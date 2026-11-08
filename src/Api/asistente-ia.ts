import "dotenv/config";
import Groq from "groq-sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { buscarContextoRAG } from "./rag";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODELO = "openai/gpt-oss-120b";

// Límites de consumo
const MAX_TOKENS_RESPUESTA = 900;
const MAX_FRAGMENTO_RAG = 500;
const MAX_MENSAJES_HISTORIAL = 4;
const MAX_ITERACIONES_MCP = 4;

const mcp = new Client({
  name: "microcredito-api-client",
  version: "1.0.0",
});

let conectado = false;

async function conectarMCP(): Promise<void> {
  if (conectado) return;

  const transporte = new StdioClientTransport({
    command: process.execPath,
    args: [
      "--import",
      "tsx",
      path.resolve(process.cwd(), "src/MCP/servidor-mcp.ts"),
    ],
    cwd: process.cwd(),
  });

  await mcp.connect(transporte);
  conectado = true;

  console.log("Cliente MCP conectado.");
}

const historialConversaciones = new Map<
  string,
  Groq.Chat.Completions.ChatCompletionMessageParam[]
>();

const PROMPT_SISTEMA = `
Eres el asistente de inteligencia artificial del Sistema de Gestión de Microcréditos.

Responde en español, de forma clara, precisa y profesional.

REGLAS GENERALES:
- No inventes datos, fechas, montos, tasas ni resultados.
- Utiliza las herramientas MCP para consultar información del sistema.
- Utiliza el contexto RAG para responder preguntas sobre políticas y documentación.
- Respeta los resultados devueltos por las herramientas.
- No confundas interés corriente con interés moratorio.
- No alteres los resultados financieros proporcionados por el sistema.

CÁLCULOS DE MORA:
- Consulta mediante MCP cuando se solicite información de mora registrada.
- Respeta la política aplicada, sus tasas, tramos y días de atraso.
- Para POL-2026-10, aplica tasas escalonadas progresivamente, calculando cada tramo por separado según los días recorridos.
- Utiliza una base de 360 días para el cálculo de intereses.
- No apliques la tasa del último tramo a todos los días de atraso.
- No redondees los intereses de cada tramo individualmente; suma los resultados y redondea el total a 2 decimales.
- Presenta exactamente los montos devueltos por MCP.
- Si el usuario solicita un cálculo manual, distingue el cálculo manual del registrado.
- No menciones discrepancias históricas que no sean relevantes para la consulta actual.
- Para explicar POL-2026-10, utiliza las tasas anuales definidas en PoliticaEscalonada: 18%, 24%, 30% y 36%.
- Calcula el interés moratorio sobre el capital en mora, no sobre la cuota normal completa.
- Desglosa los días recorridos en cada tramo y calcula cada tramo por separado.
- No inventes tasas diarias, factores de riesgo ni ajustes internos.
- No indiques que se aplica una única tasa a todos los días cuando el cálculo es escalonado.
- Las fórmulas y los resultados deben corresponder al cálculo real ejecutado por MCP.
- Las respuestas de cálculos de mora deben ser concisas y completas.
- Limita la explicación a un máximo de 250 palabras.
- Evita repetir la política completa si no es necesario.
- Presenta únicamente los tramos aplicados al caso consultado.
- No incluyas fórmulas redundantes ni explicaciones extensas.
- Finaliza siempre con el interés moratorio y el total exigible.
- Nunca dejes una fórmula, tabla o conclusión incompleta.

FORMATO MATEMÁTICO:
- Utiliza LaTeX compatible con KaTeX.
- Fórmulas en línea: $...$
- Fórmulas importantes: $$...$$
- Para ecuaciones relacionadas utiliza aligned.
- No muestres fórmulas en bloques de código.
- Utiliza Markdown, títulos, listas y tablas cuando sean apropiados.
- Explica los cálculos paso a paso cuando el usuario lo solicite.

CONTEXTO DOCUMENTAL:
`;

export async function responderAsistente(
  mensaje: string,
  sessionId: any
): Promise<string> {
  try {
    await conectarMCP();

    const contextoRAG = (
      await buscarContextoRAG(mensaje)
    ).slice(0, MAX_FRAGMENTO_RAG);

    const herramientasMCP = await mcp.listTools();

    const tools = herramientasMCP.tools.map((herramienta) => ({
      type: "function" as const,
      function: {
        name: herramienta.name,
        description: herramienta.description ?? "",
        parameters: herramienta.inputSchema,
      },
    }));

    const historial =
      historialConversaciones.get(sessionId) ?? [];

    const historialReciente = historial
      .filter(
        (m) =>
          m.role === "user" ||
          (m.role === "assistant" &&
            typeof m.content === "string" &&
            m.content.length > 0)
      )
      .slice(-MAX_MENSAJES_HISTORIAL);

    const mensajeSistema: Groq.Chat.Completions.ChatCompletionMessageParam =
      {
        role: "system",
        content: `${PROMPT_SISTEMA}\n${contextoRAG}`,
      };

    const mensajes: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      mensajeSistema,
      ...historialReciente,
      {
        role: "user",
        content: mensaje,
      },
    ];

    for (
      let intento = 0;
      intento < MAX_ITERACIONES_MCP;
      intento++
    ) {
      const respuesta = await groq.chat.completions.create({
        model: MODELO,
        messages: mensajes,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? "auto" : undefined,
        max_completion_tokens: MAX_TOKENS_RESPUESTA,
      });

      const mensajeRespuesta = respuesta.choices[0]?.message;

      if (!mensajeRespuesta) {
        throw new Error("Groq no devolvió una respuesta.");
      }

      mensajes.push(mensajeRespuesta);

      const llamadas = mensajeRespuesta.tool_calls;

      if (!llamadas || llamadas.length === 0) {
        const contenido =
          mensajeRespuesta.content ?? "No se obtuvo una respuesta.";

        // Guardar únicamente mensajes normales de usuario y asistente.
        const historialActualizado = [
          ...historialReciente,
          {
            role: "user" as const,
            content: mensaje,
          },
          {
            role: "assistant" as const,
            content: contenido,
          },
        ].slice(-MAX_MENSAJES_HISTORIAL);

        historialConversaciones.set(
          sessionId,
          historialActualizado
        );

        return contenido;
      }

      for (const llamada of llamadas) {
        if (llamada.type !== "function") continue;

        const nombreHerramienta = llamada.function.name;

        let argumentos: Record<string, unknown>;

        try {
          argumentos = JSON.parse(
            llamada.function.arguments || "{}"
          );
        } catch {
          argumentos = {};
        }

        const resultado = await mcp.callTool({
          name: nombreHerramienta,
          arguments: argumentos,
        });

        mensajes.push({
          role: "tool",
          tool_call_id: llamada.id,
          content: JSON.stringify(resultado),
        });
      }
    }

    return "No fue posible completar la respuesta después de varias consultas a las herramientas.";
  } catch (error: any) {
    if (error?.status === 429) {
      console.error(
        "Límite de tokens de Groq alcanzado:",
        error.message
      );

      return "El servicio de inteligencia artificial alcanzó temporalmente su límite de uso. Los datos del sistema no se han modificado. Intenta nuevamente cuando se restablezca el límite.";
    }

    console.error("Error en el asistente IA:", error);

    return "Ocurrió un error al procesar la consulta del asistente IA.";
  }
}
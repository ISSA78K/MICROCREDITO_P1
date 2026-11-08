import "dotenv/config";
import { pipeline } from "@huggingface/transformers";
import fs from "node:fs/promises";
import path from "node:path";

const MODELO_EMBEDDING = "Xenova/all-MiniLM-L6-v2";

interface FragmentoDocumento {
  fuente: string;
  texto: string;
  embedding: number[];
}

type Extractor = Awaited<
  ReturnType<typeof pipeline<"feature-extraction">>
>;

let extractor: Extractor | null = null;

let indice: FragmentoDocumento[] = [];
let indiceCargado = false;

async function obtenerExtractor(): Promise<Extractor> {
  if (!extractor) {
    console.log("Cargando modelo local de embeddings...");

    extractor = await pipeline(
      "feature-extraction",
      MODELO_EMBEDDING
    );

    console.log("Modelo local de embeddings listo.");
  }

  return extractor;
}

function dividirTexto(
  texto: string,
  tamano = 900,
  solapamiento = 150
): string[] {
  const fragmentos: string[] = [];
  const limpio = texto.replace(/\r\n/g, "\n").trim();

  for (
    let inicio = 0;
    inicio < limpio.length;
    inicio += tamano - solapamiento
  ) {
    const fragmento = limpio.slice(
      inicio,
      inicio + tamano
    ).trim();

    if (fragmento.length > 0) {
      fragmentos.push(fragmento);
    }
  }

  return fragmentos;
}

async function generarEmbedding(
  texto: string
): Promise<number[]> {
  const modelo = await obtenerExtractor();

  const respuesta = await modelo(texto, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(respuesta.data);
}

function similitudCoseno(
  a: number[],
  b: number[]
): number {
  let producto = 0;
  let normaA = 0;
  let normaB = 0;

  for (let i = 0; i < a.length; i++) {
    producto += a[i] * b[i];
    normaA += a[i] * a[i];
    normaB += b[i] * b[i];
  }

  if (normaA === 0 || normaB === 0) {
    return 0;
  }

  return producto / (Math.sqrt(normaA) * Math.sqrt(normaB));
}

export async function cargarIndiceRAG(): Promise<void> {
  if (indiceCargado) return;

  const carpetaCorpus = path.resolve(
    process.cwd(),
    "datos-proyecto-final",
    "datos-proyecto-final",
    "corpus"
  );

  const archivos = await fs.readdir(carpetaCorpus);

  const documentos = archivos.filter((archivo) =>
    archivo.toLowerCase().endsWith(".md")
  );

  if (documentos.length === 0) {
    throw new Error(
      "No se encontraron documentos Markdown en el corpus."
    );
  }

  const nuevoIndice: FragmentoDocumento[] = [];

  for (const archivo of documentos) {
    const ruta = path.join(carpetaCorpus, archivo);
    const contenido = await fs.readFile(ruta, "utf8");

    const fragmentos = dividirTexto(contenido);

    for (const texto of fragmentos) {
      const embedding = await generarEmbedding(texto);

      nuevoIndice.push({
        fuente: archivo,
        texto,
        embedding,
      });
    }
  }

  indice = nuevoIndice;
  indiceCargado = true;

  console.log(
    `RAG cargado: ${documentos.length} documentos, ${indice.length} fragmentos.`
  );
}

export async function buscarContextoRAG(
  consulta: string,
  cantidad = 4
): Promise<string> {
  await cargarIndiceRAG();

  const embeddingConsulta = await generarEmbedding(consulta);

  const resultados = indice
    .map((fragmento) => ({
      ...fragmento,
      puntuacion: similitudCoseno(
        embeddingConsulta,
        fragmento.embedding
      ),
    }))
    .sort((a, b) => b.puntuacion - a.puntuacion)
    .slice(0, cantidad);

  if (resultados.length === 0) {
    return "No se encontraron documentos relevantes.";
  }

  return resultados
    .map(
      (resultado, posicion) =>
        `[Fuente ${posicion + 1}: ${resultado.fuente}]\n` +
        resultado.texto
    )
    .join("\n\n---\n\n");
}
import "dotenv/config";
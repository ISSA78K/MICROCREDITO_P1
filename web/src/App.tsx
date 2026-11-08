import { useEffect, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import "./App.css";

interface CreditoReciente {
  creditoId: string;
  cliente: string;
  monto: string;
  estado: string;
  saldoPendiente: string;
}

interface ActividadReciente {
  movimientoId: string;
  tipo: string;
  creditoId: string;
  cliente: string;
  fecha: string;
  monto: string;
}

interface DashboardResumen {
  carteraActiva: string;
  creditosActivos: number;
  desembolsos: string;
  pagosRecibidos: string;
  creditosEnMora: number;
  creditosCancelados: number;
  creditosRecientes: CreditoReciente[];
  actividadReciente: ActividadReciente[];
}

interface Cliente {
  id_cliente: string;
  nombre_completo: string;
  dpi: string;
  telefono: string | null;
  municipio: string | null;
  fecha_alta: string;
}
interface CreditoAmortizacion {
  creditoId: string;
  cliente: string;
  capital: string;
  plazoMeses: number;
  tasaAnual: string;
  estado: string;
}

interface CuotaAmortizacion {
  numero: number;
  capital: string;
  interes: string;
  cuota: string;
  saldo: string;
  diasAtraso: number;
  cargoCobranzaGenerado: boolean;
}

interface PlanAmortizacionRespuesta {
  creditoId: string;
  totalCuotas: number;
  cuotas: CuotaAmortizacion[];
}

interface Asesor {
  id_asesor: string;
  nombre_completo: string;
}


interface Solicitud {
  solicitudId: string;
  clienteId: string;
  cliente: string;
  asesorId: string | null;
  asesor: string | null;
  fechaSolicitud: string;
  montoSolicitado: string;
  plazoMeses: number;
  destinoCredito: string;
  observaciones: string | null;
  estado: string;
}
interface Credito {
  creditoId: string;
  clienteId: string;
  cliente: string;
  fechaDesembolso: string;
  capital: string;
  saldoCapital: string;
  plazoMeses: number;
  tasaAnual: string;
  estado: string;
  diasAtraso: number;
}

interface PagoHistorial {
  pagoId: string;
  creditoId: string;
  montoRecibido: string;
  canal?: string;
  fechaPago?: string;
  aplicacion: {
    gastos: string;
    interesMoratorio: string;
    interesCorriente: string;
    capital: string;
    excedente: string;
  };
}

const formatoQuetzales = (valor: string) =>
  `Q ${Number(valor).toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  
function limpiarMarkdown(texto: string): string {
  let resultado = texto;

  // 1. Convertir entidades HTML hexadecimales
  resultado = resultado.replace(/&#x([0-9a-f]+);/gi, (_, codigo) =>
    String.fromCodePoint(parseInt(codigo, 16))
  );

  // 2. Convertir entidades HTML numéricas
  resultado = resultado.replace(/&#([0-9]+);/g, (_, codigo) =>
    String.fromCodePoint(parseInt(codigo, 10))
  );

  // 3. Corregir espacios HTML
  resultado = resultado.replace(/&nbsp;/g, " ");

  // 4. Convertir etiquetas <br> en saltos de línea
  resultado = resultado.replace(/<br\s*\/?>/gi, "  \n");

  // 5. Corregir espacios en expresiones comunes
  resultado = resultado.replace(/Resultado:\s\*(?=[Qq])/g, "Resultado: ");

  resultado = resultado.replace(
    /interés\s+moratorio\s\*=/gi,
    "interés moratorio ="
  );

  // 6. Convertir bloques ```math ... ``` a bloques KaTeX
  resultado = resultado.replace(
    /```math\s*([\s\S]*?)```/gi,
    (_, formula) => {
      const contenido = formula.trim();

      // Detectar separadores incorrectos como \[4pt]
      const partes = contenido.split(/\\\[\s*\d+(?:\.\d+)?pt\]/);

      // Si hay varias ecuaciones, organizarlas con aligned
      if (partes.length > 1) {
        const ecuaciones = partes
          .map((parte: string) => parte.trim())
          .filter(Boolean);

        return `$$
\\begin{aligned}
${ecuaciones.join(" \\\\\n")}
\\end{aligned}
$$`;
      }

      return `$$\n${contenido}\n$$`;
    }
  );

  // 7. Convertir ecuaciones de bloque \[ ... \] a $$ ... $$
  resultado = resultado.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, formula) => `$$\n${formula.trim()}\n$$`
  );

  // 8. Convertir ecuaciones inline \( ... \) a $ ... $
  resultado = resultado.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, formula) => `$${formula.trim()}$`
  );

  // 9. Convertir fórmulas matemáticas que vienen entre backticks
  //    Ejemplo: `I1=capital×r1×30` -> $I1=capital×r1×30$
  resultado = resultado.replace(
    /`([^`\n]*=[^`\n]*)`/g,
    (_, formula) => {
      const contenido = formula.trim();

      // Evitar convertir bloques de código o expresiones no matemáticas
      if (
        /[×÷^_]/.test(contenido) ||
        /\\(?:frac|sqrt|times|cdot|text|sum|boxed)/.test(contenido) ||
        /\d/.test(contenido)
      ) {
        return `$${contenido}$`;
      }

      return `\`${contenido}\``;
    }
  );

  // 10. Corregir fórmulas con comandos LaTeX entre paréntesis
  resultado = resultado.replace(
    /\(\s*([^()]*\\(?:frac|text|times|sum|cdot|sqrt|displaystyle|boxed)[^()]*)\s*\)/g,
    (_, formula) => `$${formula.trim()}$`
  );

  return resultado;
}

function App() {
  type PagoHistorial = {
  aplicacion: any;
  pagoId: string;
  creditoId: string;
  montoRecibido: string;
  canal?: string;
  fechaPago?: string;
};

const [historialPagos, setHistorialPagos] = useState<PagoHistorial[]>([]);
const [cargandoHistorial, setCargandoHistorial] = useState(false);
const [errorHistorial, setErrorHistorial] = useState("");
const cargarHistorialPagos = async () => {
  setCargandoHistorial(true);
  setErrorHistorial("");

  try {
    const respuesta = await fetch("/api/pagos");

    if (!respuesta.ok) {
      throw new Error("No fue posible obtener el historial de pagos.");
    }

    const resultado = await respuesta.json();

    const listaPagos = Array.isArray(resultado)
      ? resultado
      : resultado.pagos ?? resultado.data ?? [];

    const pagosNormalizados: PagoHistorial[] = listaPagos.map(
  (pago: any) => ({
    pagoId: String(pago.pagoId ?? pago.id_pago ?? ""),
    creditoId: String(pago.creditoId ?? pago.id_credito ?? ""),
    montoRecibido: String(
      pago.montoRecibido ?? pago.monto ?? pago.monto_centavos ?? "0"
    ),
    canal: pago.canal ?? "No especificado",
    fechaPago: pago.fechaPago ?? pago.fecha_pago ?? "",
    aplicacion: {
      gastos: String(pago.aplicacion?.gastos ?? "0.00"),
      interesMoratorio: String(
        pago.aplicacion?.interesMoratorio ?? "0.00"
      ),
      interesCorriente: String(
        pago.aplicacion?.interesCorriente ?? "0.00"
      ),
      capital: String(pago.aplicacion?.capital ?? "0.00"),
      excedente: String(pago.aplicacion?.excedente ?? "0.00"),
    },
  })
);

    setHistorialPagos(pagosNormalizados);
  } catch (e) {
    setErrorHistorial(
      e instanceof Error
        ? e.message
        : "Error de conexión con la API."
    );
  } finally {
    setCargandoHistorial(false);
  }
};

  const [datos, setDatos] = useState<DashboardResumen | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [errorAsesores, setErrorAsesores] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

const [nuevoCliente, setNuevoCliente] = useState({
  nombre_completo: "",
  dpi: "",
  telefono: "",
  municipio: "",
});

const [registrando, setRegistrando] = useState(false);
const [mensajeRegistro, setMensajeRegistro] = useState("");
  const [vista, setVista] = useState("dashboard");
  const [fechaCierre, setFechaCierre] = useState(
  new Date().toISOString().slice(0, 10)
);

const [mesCierre, setMesCierre] = useState(
  new Date().toISOString().slice(0, 7)
);

const [tipoCierre, setTipoCierre] = useState<"diario" | "mensual">("diario");

const [datosCierre, setDatosCierre] = useState<any>(null);

const [cargandoCierre, setCargandoCierre] = useState(false);

const [errorCierre, setErrorCierre] = useState("");
  const [creditosAmortizacion, setCreditosAmortizacion] =
  useState<CreditoAmortizacion[]>([]);

const [planAmortizacion, setPlanAmortizacion] =
  useState<PlanAmortizacionRespuesta | null>(null);

const [cargandoAmortizacion, setCargandoAmortizacion] =
  useState(false);

const [errorAmortizacion, setErrorAmortizacion] =
  useState("");
  const [moras, setMoras] = useState<any[]>([]);
const [cargandoMora, setCargandoMora] = useState(false);
const [errorMora, setErrorMora] = useState("");
  const [mensajeChat, setMensajeChat] = useState("");
  const [enviandoChat, setEnviandoChat] = useState(false);
  const [sesionChat] = useState(() => crypto.randomUUID());
  const [mensajesChat, setMensajesChat] = useState<
    { rol: "usuario" | "asistente"; texto: string }[]
  >([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [error, setError] = useState("");
  const [errorClientes, setErrorClientes] = useState("");
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [cargandoCreditos, setCargandoCreditos] = useState(false);
  const [errorCreditos, setErrorCreditos] = useState("");
  const [creditoSeleccionado, setCreditoSeleccionado] = useState("");
  const [montoPago, setMontoPago] = useState("");
  const creditoPago = creditos.find(
  (credito) => credito.creditoId === creditoSeleccionado
);
const [mensajePago, setMensajePago] = useState("");
const [registrandoPago, setRegistrandoPago] = useState(false);

const registrarPago = async () => {
  if (!creditoPago) {
    setMensajePago("Seleccione un crédito.");
    return;
  }

  const monto = Number(montoPago);

  if (!Number.isFinite(monto) || monto <= 0) {
    setMensajePago("Ingrese un monto de pago válido.");
    return;
  }

  if (monto > Number(creditoPago.saldoCapital)) {
    setMensajePago("El monto no puede ser mayor al saldo pendiente.");
    return;
  }

  try {
    setRegistrandoPago(true);
    setMensajePago("");

    const respuesta = await fetch("/api/pagos", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
      body: JSON.stringify({
  creditoId: creditoPago.creditoId,
  monto: monto.toFixed(2),
  saldos: {
    gastos: "0.00",
    interesMoratorio: "0.00",
    interesCorriente: "0.00",
    capital: Number(creditoPago.saldoCapital).toFixed(2),
  },
}),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
  JSON.stringify(resultado, null, 2)
);
    }

    const respuestaCreditos = await fetch("/api/creditos");

if (respuestaCreditos.ok) {
  const datosCreditos: {
    total: number;
    creditos: Credito[];
  } = await respuestaCreditos.json();

  setCreditos(datosCreditos.creditos);
}

setMensajePago("Pago registrado correctamente.");
setMontoPago("");
  } catch (error) {
    setMensajePago(
      error instanceof Error
        ? error.message
        : "Ocurrió un error al registrar el pago."
    );
  } finally {
    setRegistrandoPago(false);
  }
};
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [errorSolicitudes, setErrorSolicitudes] = useState("");
  const [mostrarFormularioSolicitud, setMostrarFormularioSolicitud] = useState(false);
  const [registrandoSolicitud, setRegistrandoSolicitud] = useState(false);
  const [mensajeSolicitud, setMensajeSolicitud] = useState("");
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    id_cliente: "",
    id_asesor: "",
    monto_solicitado: "",
    plazo_meses: "12",
    destino_credito: "",
    observaciones: "",
  });

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        const respuesta = await fetch("/api/dashboard/resumen");

        if (!respuesta.ok) {
          throw new Error("No fue posible obtener el resumen.");
        }

        const resumen: DashboardResumen = await respuesta.json();
        setDatos(resumen);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Error de conexión con la API."
        );
      } finally {
        setCargando(false);
      }
    };

    void cargarResumen();
  }, []);

  useEffect(() => {
    if (vista !== "clientes" && vista !== "solicitudes") return;

    const cargarClientes = async () => {
      setCargandoClientes(true);
      setErrorClientes("");

      try {
        const respuesta = await fetch("/api/clientes");

        if (!respuesta.ok) {
          throw new Error("No fue posible obtener los clientes.");
        }

        const resultado: { total: number; clientes: Cliente[] } =
          await respuesta.json();

        setClientes(resultado.clientes);
      } catch (e) {
        setErrorClientes(
          e instanceof Error ? e.message : "Error de conexión con la API."
        );
      } finally {
        setCargandoClientes(false);
      }
    };

    void cargarClientes();
  }, [vista]);

  useEffect(() => {
  if (vista !== "amortizacion") return;

  const cargarCreditosAmortizacion = async () => {
    setErrorAmortizacion("");

    try {
      const respuesta = await fetch("/api/creditos");

      if (!respuesta.ok) {
        throw new Error("No fue posible obtener los créditos.");
      }

      const resultado = await respuesta.json();

      setCreditosAmortizacion(resultado.creditos ?? []);
    } catch (e) {
      setErrorAmortizacion(
        e instanceof Error
          ? e.message
          : "Error de conexión con la API."
      );
    }
  };

  void cargarCreditosAmortizacion();
}, [vista]);

useEffect(() => {
  if (vista !== "mora") return;

  const cargarMoras = async () => {
    setCargandoMora(true);
    setErrorMora("");

    try {
      const respuesta = await fetch("/api/mora");
      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || "No fue posible obtener los datos de mora."
        );
      }

      setMoras(resultado.creditos ?? []);
    } catch (e) {
      setErrorMora(
        e instanceof Error
          ? e.message
          : "Error de conexión con la API."
      );
    } finally {
      setCargandoMora(false);
    }
  };

  void cargarMoras();
}, [vista]);

useEffect(() => {
  if (vista !== "amortizacion" || !creditoSeleccionado) {
    setPlanAmortizacion(null);
    return;
  }

  const cargarPlan = async () => {
    setCargandoAmortizacion(true);
    setErrorAmortizacion("");

    try {
      const respuesta = await fetch(
        `/api/creditos/${encodeURIComponent(
          creditoSeleccionado
        )}/plan-amortizacion`
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || "No fue posible generar el plan."
        );
      }

      setPlanAmortizacion(resultado);
    } catch (e) {
      setPlanAmortizacion(null);

      setErrorAmortizacion(
        e instanceof Error
          ? e.message
          : "Error de conexión con la API."
      );
    } finally {
      setCargandoAmortizacion(false);
    }
  };

  void cargarPlan();
}, [vista, creditoSeleccionado]);

  useEffect(() => {
    if (vista !== "solicitudes") return;

    const cargarAsesores = async () => {
      setErrorAsesores("");

      try {
        const respuesta = await fetch("/api/asesores");

        if (!respuesta.ok) {
          throw new Error("No fue posible obtener los asesores.");
        }

        const resultado: { total: number; asesores: Asesor[] } =
          await respuesta.json();

        setAsesores(resultado.asesores);
      } catch (e) {
        setErrorAsesores(
          e instanceof Error ? e.message : "Error de conexión con la API."
        );
      }
    };

    void cargarAsesores();
  }, [vista]);
  useEffect(() => {
    if (vista !== "creditos" && vista !== "pagos") return;

    const cargarCreditos = async () => {
      setCargandoCreditos(true);
      setErrorCreditos("");

      try {
        const respuesta = await fetch("/api/creditos");

        if (!respuesta.ok) {
          throw new Error("No fue posible obtener los créditos.");
        }

        const resultado: { total: number; creditos: Credito[] } =
          await respuesta.json();

        setCreditos(resultado.creditos);
      } catch (e) {
        setErrorCreditos(
          e instanceof Error ? e.message : "Error de conexión con la API."
        );
      } finally {
        setCargandoCreditos(false);
      }
    };

    void cargarCreditos();
  }, [vista]);
  useEffect(() => {
    if (vista !== "solicitudes") return;

    const cargarSolicitudes = async () => {
      setCargandoSolicitudes(true);
      setErrorSolicitudes("");

      try {
        const respuesta = await fetch("/api/solicitudes");

        if (!respuesta.ok) {
          throw new Error("No fue posible obtener las solicitudes.");
        }

        const resultado: { total: number; solicitudes: Solicitud[] } =
          await respuesta.json();

        setSolicitudes(resultado.solicitudes);
      } catch (e) {
        setErrorSolicitudes(
          e instanceof Error ? e.message : "Error de conexión con la API."
        );
      } finally {
        setCargandoSolicitudes(false);
      }
    };

    void cargarSolicitudes();
  }, [vista]);

  useEffect(() => {
  if (vista !== "pagos") return;

  void cargarHistorialPagos();
}, [vista]);

const actualizarEstadoSolicitud = async (
  solicitudId: string,
  estado: "APROBADA" | "RECHAZADA"
) => {
  try {
    const respuesta = await fetch(
      `/api/solicitudes/${encodeURIComponent(solicitudId)}/estado`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado }),
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No fue posible actualizar la solicitud.");
    }

    const respuestaLista = await fetch("/api/solicitudes");

    if (!respuestaLista.ok) {
      throw new Error("El estado se actualizó, pero no se pudo recargar la lista.");
    }

    const lista: { total: number; solicitudes: Solicitud[] } =
      await respuestaLista.json();

    setSolicitudes(lista.solicitudes);
    alert(resultado.mensaje);
  } catch (error) {
    alert(error instanceof Error ? error.message : "Error al actualizar la solicitud.");
  }
};

const registrarSolicitud = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setRegistrandoSolicitud(true);
  setMensajeSolicitud("");

  try {
    const respuesta = await fetch("/api/solicitudes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...nuevaSolicitud,
        id_asesor: nuevaSolicitud.id_asesor || null,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo registrar la solicitud.");
    }

    const respuestaLista = await fetch("/api/solicitudes");

    if (respuestaLista.ok) {
      const lista: { total: number; solicitudes: Solicitud[] } =
        await respuestaLista.json();
      setSolicitudes(lista.solicitudes);
    }

    setNuevaSolicitud({
      id_cliente: "",
      id_asesor: "",
      monto_solicitado: "",
      plazo_meses: "12",
      destino_credito: "",
      observaciones: "",
    });

    setMostrarFormularioSolicitud(false);
    setMensajeSolicitud("Solicitud registrada correctamente.");
  } catch (e) {
    setMensajeSolicitud(
      e instanceof Error ? e.message : "Error de conexión con la API."
    );
  } finally {
    setRegistrandoSolicitud(false);
  }
};
const registrarCliente = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  setRegistrando(true);
  setMensajeRegistro("");

  try {
    const respuesta = await fetch("/api/clientes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nuevoCliente),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo registrar el cliente.");
    }

    setClientes((anteriores) =>
      [resultado.cliente, ...anteriores].sort((a, b) =>
        a.nombre_completo.localeCompare(b.nombre_completo, "es")
      )
    );

    setNuevoCliente({
      nombre_completo: "",
      dpi: "",
      telefono: "",
      municipio: "",
    });

    setMostrarFormulario(false);
    setMensajeRegistro("Cliente registrado correctamente.");
  } catch (error) {
    setMensajeRegistro(
      error instanceof Error
        ? error.message
        : "Ocurrió un error al registrar el cliente."
    );
  } finally {
    setRegistrando(false);
  }
};

  const enviarMensajeChat = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const texto = mensajeChat.trim();
    if (!texto || enviandoChat) return;

    setMensajesChat((anteriores) => [
      ...anteriores,
      { rol: "usuario", texto },
    ]);
    setMensajeChat("");
    setEnviandoChat(true);

    try {
      const respuesta = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  mensaje: texto,
  sessionId: sesionChat,
}),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "Error al consultar el asistente.");
      }

      setMensajesChat((anteriores) => [
        ...anteriores,
        { rol: "asistente", texto: resultado.respuesta },
      ]);
    } catch (error) {
      setMensajesChat((anteriores) => [
        ...anteriores,
        {
          rol: "asistente",
          texto:
            error instanceof Error
              ? error.message
              : "No fue posible conectar con el asistente.",
        },
      ]);
    } finally {
      setEnviandoChat(false);
    }
  };
  const metrics = [
    {
      title: "Cartera activa",
      value: datos ? formatoQuetzales(datos.carteraActiva) : "Q 0.00",
      detail: "Saldo total pendiente",
    },
    {
      title: "Créditos activos",
      value: datos ? String(datos.creditosActivos) : "0",
      detail: "Créditos vigentes",
    },
    {
      title: "Desembolsos",
      value: datos ? formatoQuetzales(datos.desembolsos) : "Q 0.00",
      detail: "Total desembolsado",
    },
    {
      title: "Pagos recibidos",
      value: datos ? formatoQuetzales(datos.pagosRecibidos) : "Q 0.00",
      detail: "Recaudación acumulada",
    },
    {
      title: "Créditos en mora",
      value: datos ? String(datos.creditosEnMora) : "0",
      detail: "Requieren seguimiento",
    },
    {
      title: "Créditos cancelados",
      value: datos ? String(datos.creditosCancelados) : "0",
      detail: "Créditos totalmente pagados",
    },
  ];

  const porcentajeMora =
    datos && datos.creditosActivos > 0
      ? Math.round((datos.creditosEnMora / datos.creditosActivos) * 100)
      : 0;

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busqueda.toLowerCase();

    return (
      cliente.nombre_completo.toLowerCase().includes(texto) ||
      cliente.dpi.toLowerCase().includes(texto) ||
      (cliente.telefono ?? "").toLowerCase().includes(texto) ||
      (cliente.municipio ?? "").toLowerCase().includes(texto)
    );
  });

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">CV</div>
          <div>
            <h2>Crédito Vecino</h2>
            <span>Microcréditos</span>
          </div>
        </div>

        <p className="menu-label">MENÚ PRINCIPAL</p>

        <nav>
          <a
            className={vista === "dashboard" ? "active" : ""}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setVista("dashboard");
            }}
          >
            ▦ Microcréditos
          </a>

          <a
            className={vista === "clientes" ? "active" : ""}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setVista("clientes");
            }}
          >
            ♙ Clientes
          </a>

          <a
            className={vista === "chat" ? "active" : ""}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setVista("chat");
            }}
          >
            ✨ Asistente IA
          </a>
          <a
            className={vista === "solicitudes" ? "active" : ""}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setVista("solicitudes");
            }}
          >
            ▤ Solicitudes de crédito
          </a>
          <a
            className={vista === "creditos" ? "active" : ""}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setVista("creditos");
            }}
          >
            ▣ Créditos
          </a>
          <a
  className={vista === "pagos" ? "active" : ""}
  href="#"
  onClick={(e) => {
    e.preventDefault();
    setVista("pagos");
  }}
>
  ＄ Registrar pagos
</a>
          <a
  className={vista === "amortizacion" ? "active" : ""}
  href="#"
  onClick={(e) => {
    e.preventDefault();
    setVista("amortizacion");
  }}
>
  ▤ Plan de amortización
</a>
          <a
  className={vista === "mora" ? "active" : ""}
  href="#"
  onClick={(e) => {
    e.preventDefault();
    setVista("mora");
  }}
>
  ⚠ Gestión de mora
</a>
          <a
  className={vista === "cierres" ? "active" : ""}
  href="#"
  onClick={(e) => {
    e.preventDefault();
    setVista("cierres");
  }}
>
  ▥ Cierres diarios y mensuales
</a>
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">G</div>
          <div>
            <strong>Gerencia</strong>
            <span>Administrador</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">
  Inicio / {
  vista === "dashboard"
    ? "Microcréditos gerencial"
    : vista === "chat"
      ? "Asistente IA"
      : vista === "amortizacion"
        ? "Plan de amortización"
        : vista === "mora"
          ? "Gestión de mora"
          : vista === "cierres"
            ? "Cierres diarios y mensuales"
            : vista === "clientes"
              ? "Gestión de clientes"
              : vista === "creditos"
                ? "Gestión de créditos"
                : vista === "solicitudes"
                  ? "Solicitudes de crédito"
                  : vista === "pagos"
                    ? "Gestión de pagos"
                    : "Sistema de microcréditos"}
</span>

<p>
  {vista === "dashboard"
    ? "Resumen general de la operación de microcréditos."
    : vista === "chat"
      ? "Consulta información de la cartera mediante inteligencia artificial."
      : vista === "amortizacion"
        ? "Consulta y seguimiento de las cuotas de los créditos."
        : vista === "mora"
          ? "Consulta y seguimiento de créditos con pagos atrasados."
          : vista === "cierres"
            ? "Consulta y genera los cierres diarios y mensuales de la operación."
            : vista === "clientes"
              ? "Consulta y seguimiento de los clientes registrados."
              : vista === "creditos"
                ? "Consulta y administración de los créditos registrados."
                : vista === "solicitudes"
                  ? "Consulta y seguimiento de las solicitudes de crédito registradas."
                  : vista === "pagos"
                    ? "Registro y consulta de los pagos de los créditos."
                    : "Administración del sistema de microcréditos."}
</p>

            
<h1>
  {vista === "dashboard"
    ? "Microcréditos gerencial"
    : vista === "chat"
      ? "Asistente IA"
      : vista === "amortizacion"
        ? "Plan de amortización"
        : vista === "mora"
          ? "Gestión de mora"
          : vista === "cierres"
            ? "Cierres diarios y mensuales"
            : vista === "clientes"
              ? "Gestión de clientes"
              : vista === "creditos"
                ? "Gestión de créditos"
                : vista === "pagos"
                  ? "Gestión de pagos"
                  : "Sistema de microcréditos"}
</h1>

            
<p>
  {vista === "dashboard"
    ? "Resumen general de la operación de microcréditos."
    : vista === "chat"
      ? "Consulta información de la cartera mediante inteligencia artificial."
      : vista === "amortizacion"
        ? "Consulta y seguimiento de las cuotas de los créditos."
        : vista === "mora"
          ? "Consulta y seguimiento de créditos en mora."
          : vista === "cierres"
            ? "Consulta y genera los cierres diarios y mensuales de la operación."
            : vista === "clientes"
              ? "Consulta y seguimiento de los clientes registrados."
              : vista === "creditos"
                ? "Consulta y administración de los créditos registrados."
                : vista === "pagos"
                  ? "Registro y consulta de los pagos de los créditos."
                  : "Administración del sistema de microcréditos."}
</p>
          </div>

          <div className="topbar-right">
            <span className="status-dot"></span>
            Sistema conectado
          </div>
        </header>

        {vista === "dashboard" && (
          <>
            {cargando && (
              <p className="metric-detail">Cargando datos del dashboard...</p>
            )}

            {error && (
              <p role="alert" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}

            <section className="metrics-grid">
              {metrics.map((metric) => (
                <article className="metric-card" key={metric.title}>
                  <span className="metric-title">{metric.title}</span>
                  <strong className="metric-value">{metric.value}</strong>
                  <span className="metric-detail">{metric.detail}</span>
                </article>
              ))}
            </section>

            <section className="content-grid">
              <article className="panel portfolio-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Resumen de cartera</h2>
                    <p>Distribución de la cartera de microcréditos</p>
                  </div>
                  <span className="tag">Vista general</span>
                </div>

                <div className="empty-chart">
                  <div className="chart-circle">
                    <span>{porcentajeMora}%</span>
                    <small>En mora</small>
                  </div>

                  <div className="chart-legend">
                    <p>
                      <span className="legend-dot green"></span> Créditos al día
                    </p>
                    <p>
                      <span className="legend-dot orange"></span> Créditos en mora
                    </p>
                  </div>
                </div>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Actividad reciente</h2>
                    <p>Últimos créditos registrados</p>
                  </div>
                </div>

                
<div className="activity-empty">
  {datos?.actividadReciente?.length ? (
    <div className="activity-list">
      {datos.actividadReciente.map((movimiento) => (
        <div
          className="activity-item"
          key={movimiento.movimientoId}
        >
          <div>
            <strong>
              {movimiento.tipo === "PAGO"
                ? "Pago registrado"
                : "Crédito desembolsado"}
            </strong>

            <p>{movimiento.cliente}</p>
            <p>Crédito: {movimiento.creditoId}</p>
            <p>{movimiento.fecha}</p>
          </div>

          <strong>
            {formatoQuetzales(movimiento.monto)}
          </strong>
        </div>
      ))}
    </div>
  ) : (
    <div>
      <div className="activity-icon">▤</div>
      <strong>Sin movimientos</strong>
      <p>No hay registros recientes para mostrar.</p>
    </div>
  )}
</div>

              </article>
            </section>

              <section className="panel table-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Créditos recientes</h2>
                    <p>Seguimiento de solicitudes y créditos</p>
                  </div>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setVista("clientes")}
                  >
                    Ver clientes
                  </button>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Crédito</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                        <th>Saldo pendiente</th>
                      </tr>
                    </thead>

                    <tbody>
  {datos?.creditosRecientes.map((credito) => (
    <tr key={credito.creditoId}>
      <td>{credito.cliente}</td>
      <td>{credito.creditoId}</td>
      <td>{formatoQuetzales(credito.monto)}</td>
      <td>{credito.estado}</td>
      <td>—</td>
      <td>{formatoQuetzales(credito.saldoPendiente)}</td>
    </tr>
  ))}

                      {!cargando &&
                        !error &&
                        datos?.creditosRecientes.length === 0 && (
                          <tr>
                            <td colSpan={6} className="empty-row">
                              No hay créditos para mostrar todavía.
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

  {vista === "pagos" && (
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <h2>Registrar pagos</h2>
          <p>Registro y seguimiento de pagos de microcréditos.</p>

            {creditoPago && (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        border: "1px solid #d1d5db",
        borderRadius: "10px",
        maxWidth: "500px",
      }}
    >
      <h3>Información del crédito</h3>

      <p>
        <strong>Cliente:</strong> {creditoPago.cliente}
      </p>

      <p>
        <strong>Código:</strong> {creditoPago.creditoId}
      </p>

      <p>
        <strong>Saldo pendiente:</strong>{" "}
        {formatoQuetzales(creditoPago.saldoCapital)}
      </p>

      <p>
        <strong>Estado:</strong> {creditoPago.estado}
      </p>
      <label style={{ display: "block", marginTop: "15px" }}>
    Monto del pago (Q)
    <input
      type="number"
      min="0.01"
      step="0.01"
      required
      value={montoPago}
      onChange={(e) => setMontoPago(e.target.value)}
      placeholder="Ingrese el monto del pago"
      style={{
        display: "block",
        width: "100%",
        padding: "10px",
        marginTop: "8px",
        borderRadius: "8px",
        border: "1px solid #d1d5db",
      }}
    />
  </label>
    </div>
  )}
          <div style={{ marginTop: "20px", maxWidth: "500px" }}>
    <label>
      Seleccionar crédito
      <select
        value={creditoSeleccionado}
      onChange={(e) => setCreditoSeleccionado(e.target.value)}
      style={{
        display: "block",
        width: "100%",
        padding: "10px",
        marginTop: "8px",
        borderRadius: "8px",
        border: "1px solid #d1d5db",
      }}
    >
      <option value="">Seleccione un crédito</option>
      {creditos.map((credito) => (
        <option key={credito.creditoId} value={credito.creditoId}>
          {credito.creditoId} - {credito.cliente} - Saldo: {formatoQuetzales(credito.saldoCapital)}
        </option>
      ))}
    </select>
  </label>
</div>
      </div>
    </div>

    <div className="activity-empty">
  <div className="activity-icon">＄</div>

  <strong>Módulo de pagos</strong>

  <p>
    Registre el pago correspondiente al crédito seleccionado.
  </p>

  <button
    type="button"
    onClick={registrarPago}
    disabled={!creditoPago || !montoPago || registrandoPago}
    style={{
      marginTop: "15px",
      padding: "12px 24px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#2563eb",
      color: "#ffffff",
      fontWeight: "600",
      cursor: registrandoPago ? "wait" : "pointer",
      opacity: registrandoPago ? 0.7 : 1,
    }}
  >
    {registrandoPago ? "Registrando pago..." : "Registrar pago"}
  </button>

  {mensajePago && (
    <p style={{ marginTop: "15px", fontWeight: "600" }}>
      {mensajePago}
    </p>
  )}
</div>

<div className="panel table-panel" style={{ marginTop: "25px" }}>
  <div className="panel-heading">
    <div>
      <h2>Historial de pagos</h2>
      <p>Total de pagos registrados: {historialPagos.length}</p>
    </div>

    <button
      className="secondary-button"
      type="button"
      onClick={() => void cargarHistorialPagos()}
      disabled={cargandoHistorial}
    >
      {cargandoHistorial ? "Actualizando..." : "Actualizar"}
    </button>
  </div>

  {cargandoHistorial && (
    <p className="metric-detail">Cargando historial de pagos...</p>
  )}

  {errorHistorial && (
    <p className="error-message">{errorHistorial}</p>
  )}

  {!cargandoHistorial && !errorHistorial && (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID del pago</th>
            <th>Código del crédito</th>
            <th>Monto recibido</th>
            <th>Canal</th>
            <th>Fecha del pago</th>
          </tr>
        </thead>

        <tbody>
          {historialPagos.map((pago) => (
            <tr key={pago.pagoId}>
              <td>{pago.pagoId}</td>
              <td>{pago.creditoId}</td>
              <td>{formatoQuetzales(pago.montoRecibido)}</td>
              <td>{pago.canal ?? "No especificado"}</td>
              <td>{pago.fechaPago ?? "No especificada"}</td>
            </tr>
          ))}

          {historialPagos.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-row">
                No hay pagos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )}
</div>

  </section>
)}

        {vista === "clientes" && (
          <section className="panel table-panel">
            <div className="panel-heading">
              <div>
                <h2>Clientes registrados</h2>
                <p>
                  Total de clientes: {clientes.length}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
  <button
    type="button"
    onClick={() => setMostrarFormulario(!mostrarFormulario)}
    style={{
      backgroundColor: "#2563eb",
      color: "white",
      padding: "10px 18px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    {mostrarFormulario ? "Cancelar registro" : "+ Registrar nuevo cliente"}
  </button>

  {mostrarFormulario && (
    <form
      onSubmit={registrarCliente}
      style={{
        marginTop: "15px",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        display: "grid",
        gap: "12px",
        maxWidth: "500px",
      }}
    >
      <h3>Registro de nuevo cliente</h3>

      <label>
  Nombre completo{" "}
  <span style={{ color: "red", fontWeight: "bold" }}>*</span>
  <span style={{ color: "red", fontSize: "12px", marginLeft: "5px" }}>
    Campo obligatorio
  </span>
        <input
          type="text"
          required
          value={nuevoCliente.nombre_completo}
          onChange={(e) =>
            setNuevoCliente({
              ...nuevoCliente,
              nombre_completo: e.target.value,
            })
          }
          placeholder="Ingrese el nombre completo"
          style={{ width: "100%", padding: "9px", marginTop: "5px" }}
        />
      </label>

      <label>
  DPI{" "}
  <span style={{ color: "red", fontWeight: "bold" }}>*</span>
  <span style={{ color: "red", fontSize: "12px", marginLeft: "5px" }}>
    Campo obligatorio
  </span>
        <input
          type="text"
          required
          value={nuevoCliente.dpi}
          onChange={(e) =>
            setNuevoCliente({
              ...nuevoCliente,
              dpi: e.target.value,
            })
          }
          placeholder="Ingrese el DPI"
          style={{ width: "100%", padding: "9px", marginTop: "5px" }}
        />
      </label>

      <label>
        Teléfono
        <input
          type="text"
          value={nuevoCliente.telefono}
          onChange={(e) =>
            setNuevoCliente({
              ...nuevoCliente,
              telefono: e.target.value,
            })
          }
          placeholder="Ingrese el teléfono"
          style={{ width: "100%", padding: "9px", marginTop: "5px" }}
        />
      </label>

      <label>
        Municipio
        <input
          type="text"
          value={nuevoCliente.municipio}
          onChange={(e) =>
            setNuevoCliente({
              ...nuevoCliente,
              municipio: e.target.value,
            })
          }
          placeholder="Ingrese el municipio"
          style={{ width: "100%", padding: "9px", marginTop: "5px" }}
        />
      </label>

      <button
        type="submit"
        disabled={registrando}
        style={{
          backgroundColor: "#16a34a",
          color: "white",
          padding: "10px",
          border: "none",
          borderRadius: "8px",
          cursor: registrando ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {registrando ? "Registrando..." : "Guardar cliente"}
      </button>
    </form>
  )}

  {mensajeRegistro && (
    <p style={{ marginTop: "10px", color: "#16a34a" }}>
      {mensajeRegistro}
    </p>
  )}
</div>

            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, DPI, teléfono o municipio..."
                style={{
                  width: "100%",
                  padding: "12px 15px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            {cargandoClientes && (
              <p className="metric-detail">Cargando clientes...</p>
            )}

            {errorClientes && (
              <p role="alert" style={{ color: "#dc2626" }}>
                {errorClientes}
              </p>
            )}

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre completo</th>
                    <th>DPI</th>
                    <th>Teléfono</th>
                    <th>Municipio</th>
                    <th>Fecha de alta</th>
                  </tr>
                </thead>

                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id_cliente}>
                      <td>{cliente.id_cliente}</td>
                      <td>{cliente.nombre_completo}</td>
                      <td>{cliente.dpi}</td>
                      <td>{cliente.telefono || "No registrado"}</td>
                      <td>{cliente.municipio || "No registrado"}</td>
                      <td>{cliente.fecha_alta}</td>
                    </tr>
                  ))}

                  {!cargandoClientes &&
                    !errorClientes &&
                    clientesFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={6} className="empty-row">
                          No se encontraron clientes.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {vista === "chat" && (
          <section className="panel table-panel">
            <div className="panel-heading">
              <div>
                <h2>Asistente IA</h2>
                <p>Realiza consultas sobre la información de microcréditos.</p>
              </div>
            </div>

            <div className="chat-messages" role="log" aria-live="polite">
              {mensajesChat.length === 0 && (
                <p className="chat-empty">
                  Hola. ¿Qué deseas consultar sobre la cartera de microcréditos?
                </p>
              )}

              {mensajesChat.map((mensaje, indice) => (
                <div
                  key={indice}
                  className={`chat-message ${mensaje.rol}`}
                >
                  <strong>
                    {mensaje.rol === "usuario" ? "Tú" : "Asistente IA"}
                  </strong>
                  <div className="markdown-content">
                    <ReactMarkdown
  remarkPlugins={[remarkGfm, remarkMath]}
  rehypePlugins={[rehypeKatex]}
  components={{
    p: ({ children }) => <p>{children}</p>,
  }}
>
  {limpiarMarkdown(mensaje.texto)}
</ReactMarkdown>
                  </div>    
                </div>
              ))}

              {enviandoChat && (
                <p className="chat-loading">El asistente está pensando...</p>
              )}
            </div>

            <form onSubmit={enviarMensajeChat} className="chat-form">
              <input
                type="text"
                value={mensajeChat}
                onChange={(e) => setMensajeChat(e.target.value)}
                placeholder="Escribe una pregunta sobre la cartera..."
                disabled={enviandoChat}
              />

              <button
                type="submit"
                disabled={enviandoChat || !mensajeChat.trim()}
              >
                {enviandoChat ? "Consultando..." : "Enviar"}
              </button>
            </form>
          </section>
        )}
        {vista === "creditos" && (
          <section className="panel table-panel">
            <div className="panel-heading">
              <div>
                <h2>Créditos registrados</h2>
                <p>Total de créditos: {creditos.length}</p>
              </div>
            </div>

            {cargandoCreditos && (
              <p className="metric-detail">Cargando créditos...</p>
            )}

            {errorCreditos && (
              <p className="error-message">{errorCreditos}</p>
            )}

            {!cargandoCreditos && !errorCreditos && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Fecha desembolso</th>
                      <th>Capital</th>
                      <th>Saldo pendiente</th>
                      <th>Plazo</th>
                      <th>Tasa anual</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                      <th>Días atraso</th>
                    </tr>
                  </thead>

                  <tbody>
                    {creditos.map((credito) => (
                      <tr key={credito.creditoId}>
                        <td>{credito.creditoId}</td>
                        <td>{credito.cliente}</td>
                        <td>{credito.fechaDesembolso}</td>
                        <td>{formatoQuetzales(credito.capital)}</td>
                        <td>{formatoQuetzales(credito.saldoCapital)}</td>
                        <td>{credito.plazoMeses} meses</td>
                        <td>{credito.tasaAnual}%</td>
                        <td>{credito.estado}</td>
                        <td>{credito.diasAtraso}</td>
                      </tr>
                    ))}

                    {creditos.length === 0 && (
                      <tr>
                        <td colSpan={9} className="empty-row">
                          No hay créditos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        {vista === "solicitudes" && (
          <section className="panel table-panel">
            <div className="panel-heading">
              <div>
                <h2>Solicitudes de crédito</h2>
                <p>Total de solicitudes: {solicitudes.length}</p>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => {
                  setMostrarFormularioSolicitud(!mostrarFormularioSolicitud);
                  setMensajeSolicitud("");
                }}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {mostrarFormularioSolicitud
                  ? "Cancelar solicitud"
                  : "+ Nueva solicitud"}
              </button>
            </div>

            {mensajeSolicitud && (
              <p className="metric-detail">{mensajeSolicitud}</p>
            )}

            {errorAsesores && (
              <p className="error-message">{errorAsesores}</p>
            )}

            {mostrarFormularioSolicitud && (
              <form
                onSubmit={registrarSolicitud}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "15px",
                  marginBottom: "25px",
                  padding: "20px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                }}
              >
                <label>
                  Cliente
                  <select
                    required
                    value={nuevaSolicitud.id_cliente}
                    onChange={(e) =>
                      setNuevaSolicitud((anterior) => ({
                        ...anterior,
                        id_cliente: e.target.value,
                      }))
                    }
                    style={{ display: "block", width: "100%", padding: "10px" }}
                  >
                    <option value="">Seleccione un cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id_cliente} value={cliente.id_cliente}>
                        {cliente.nombre_completo}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Asesor
                  <select
                    value={nuevaSolicitud.id_asesor}
                    onChange={(e) =>
                      setNuevaSolicitud((anterior) => ({
                        ...anterior,
                        id_asesor: e.target.value,
                      }))
                    }
                    style={{ display: "block", width: "100%", padding: "10px" }}
                  >
                    <option value="">Sin asignar</option>
                    {asesores.map((asesor) => (
                      <option key={asesor.id_asesor} value={asesor.id_asesor}>
                        {asesor.nombre_completo}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Monto solicitado (Q)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={nuevaSolicitud.monto_solicitado}
                    onChange={(e) =>
                      setNuevaSolicitud((anterior) => ({
                        ...anterior,
                        monto_solicitado: e.target.value,
                      }))
                    }
                    style={{ display: "block", width: "100%", padding: "10px" }}
                  />
                </label>

                <label>
                  Plazo (meses)
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={nuevaSolicitud.plazo_meses}
                    onChange={(e) =>
                      setNuevaSolicitud((anterior) => ({
                        ...anterior,
                        plazo_meses: e.target.value,
                      }))
                    }
                    style={{ display: "block", width: "100%", padding: "10px" }}
                  />
                </label>

                <label>
                  Destino del crédito
                  <input
                    type="text"
                    required
                    value={nuevaSolicitud.destino_credito}
                    onChange={(e) =>
                      setNuevaSolicitud((anterior) => ({
                        ...anterior,
                        destino_credito: e.target.value,
                      }))
                    }
                    style={{ display: "block", width: "100%", padding: "10px" }}
                  />
                </label>

                <label>
                  Observaciones (opcional)
                  <input
                    type="text"
                    value={nuevaSolicitud.observaciones}
                    onChange={(e) =>
                      setNuevaSolicitud((anterior) => ({
                        ...anterior,
                        observaciones: e.target.value,
                      }))
                    }
                    style={{ display: "block", width: "100%", padding: "10px" }}
                  />
                </label>

                <div style={{ gridColumn: "1 / -1" }}>
                  <button
                    type="submit"
                    disabled={registrandoSolicitud}
                    style={{
                      backgroundColor: "#16a34a",
                      color: "white",
                      padding: "10px 18px",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {registrandoSolicitud
                      ? "Registrando..."
                      : "Guardar solicitud"}
                  </button>
                </div>
              </form>
            )}
            {cargandoSolicitudes && (
              <p className="metric-detail">Cargando solicitudes...</p>
            )}

            {errorSolicitudes && (
              <p className="error-message">{errorSolicitudes}</p>
            )}

            {!cargandoSolicitudes && !errorSolicitudes && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Asesor</th>
                      <th>Fecha</th>
                      <th>Monto solicitado</th>
                      <th>Plazo</th>
                      <th>Destino</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.map((solicitud) => (
                      <tr key={solicitud.solicitudId}>
                        <td>{solicitud.solicitudId}</td>
                        <td>{solicitud.cliente}</td>
                        <td>{solicitud.asesor ?? "Sin asignar"}</td>
                        <td>{solicitud.fechaSolicitud}</td>
                        <td>{formatoQuetzales(solicitud.montoSolicitado)}</td>
                        <td>{solicitud.plazoMeses} meses</td>
                        <td>{solicitud.destinoCredito}</td>
                        <td>{solicitud.estado}</td>
                        <td>
                          {(solicitud.estado === "PENDIENTE" || solicitud.estado === "EN_REVISION") && (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                type="button"
                                className="primary-button"
                                onClick={() => actualizarEstadoSolicitud(solicitud.solicitudId, "APROBADA")}
                              >
                                Aprobar
                              </button>
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => actualizarEstadoSolicitud(solicitud.solicitudId, "RECHAZADA")}
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {solicitudes.length === 0 && (
                      <tr>
                        <td colSpan={9} className="empty-row">
                          No hay solicitudes registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        {vista === "amortizacion" && (
  <section className="panel table-panel">
    <div className="panel-heading">
      <div>
        <h2>Plan de amortización</h2>
        <p>Consulta las cuotas, capital, intereses y saldo de cada crédito.</p>
      </div>
    </div>

    <div style={{ marginBottom: "20px" }}>
      <label
        htmlFor="creditoAmortizacion"
        style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}
      >
        Seleccionar crédito
      </label>

      <select
        id="creditoAmortizacion"
        value={creditoSeleccionado}
        onChange={(e) => setCreditoSeleccionado(e.target.value)}
        style={{
          width: "100%",
          maxWidth: "600px",
          padding: "12px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
        }}
      >
        <option value="">Seleccione un crédito</option>

        {creditosAmortizacion.map((credito) => (
          <option key={credito.creditoId} value={credito.creditoId}>
            {credito.creditoId} - {credito.cliente} - {credito.estado}
          </option>
        ))}
      </select>
    </div>

    {errorAmortizacion && (
      <p role="alert" style={{ color: "#dc2626" }}>
        {errorAmortizacion}
      </p>
    )}

    {cargandoAmortizacion && (
      <p className="metric-detail">Generando plan de amortización...</p>
    )}

    {planAmortizacion && !cargandoAmortizacion && (
      <>
        <div className="metrics-grid" style={{ marginBottom: "20px" }}>
          <article className="metric-card">
            <span className="metric-title">Crédito</span>
            <strong className="metric-value">
              {planAmortizacion.creditoId}
            </strong>
          </article>

          <article className="metric-card">
            <span className="metric-title">Total de cuotas</span>
            <strong className="metric-value">
              {planAmortizacion.totalCuotas}
            </strong>
          </article>

          <article className="metric-card">
            <span className="metric-title">Monto de cuota inicial</span>
            <strong className="metric-value">
              {formatoQuetzales(planAmortizacion.cuotas[0]?.cuota ?? "0")}
            </strong>
          </article>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No. cuota</th>
                <th>Capital</th>
                <th>Interés</th>
                <th>Cuota total</th>
                <th>Saldo restante</th>
                <th>Días de atraso</th>
                <th>Cargo cobranza</th>
              </tr>
            </thead>

            <tbody>
              {planAmortizacion.cuotas.map((cuota) => (
                <tr key={cuota.numero}>
                  <td>{cuota.numero}</td>
                  <td>{formatoQuetzales(cuota.capital)}</td>
                  <td>{formatoQuetzales(cuota.interes)}</td>
                  <td>{formatoQuetzales(cuota.cuota)}</td>
                  <td>{formatoQuetzales(cuota.saldo)}</td>
                  <td>{cuota.diasAtraso}</td>
                  <td>
                    {cuota.cargoCobranzaGenerado ? "Sí" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}

    {!creditoSeleccionado && !errorAmortizacion && (
      <div className="activity-empty">
        <div className="activity-icon">▤</div>
        <strong>Módulo de amortización</strong>
        <p>Seleccione un crédito para consultar su plan de cuotas.</p>
      </div>
    )}
  </section>
)}


        {vista === "mora" && (
          <section className="panel table-panel">
            <div className="panel-heading">
              <div>
                <h2>Créditos en mora</h2>
                <p>
                  Total de créditos con atraso: {moras.length}
                </p>
              </div>
            </div>

            {cargandoMora && (
              <div className="activity-empty">
                <p>Cargando información de mora...</p>
              </div>
            )}

            {errorMora && (
              <div className="activity-empty">
                <p>{errorMora}</p>
              </div>
            )}

            {!cargandoMora && !errorMora && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>No. crédito</th>
                      <th>Cliente</th>
                      <th>Fecha desembolso</th>
                      <th>Saldo capital</th>
                      <th>Días atraso</th>
                      <th>Tramo</th>
                      <th>Interés moratorio</th>
                      <th>Interés en suspenso</th>
                      <th>Cargo cobranza</th>
                      <th>Política de mora</th>
                    </tr>
                  </thead>

                  <tbody>
                    {moras.map((mora) => (
                      <tr key={mora.creditoId}>
                        <td>{mora.creditoId}</td>
                        <td>{mora.cliente}</td>
                        <td>{mora.fechaDesembolso}</td>
                        <td>{formatoQuetzales(mora.saldoCapital)}</td>
                        <td>{mora.diasAtraso}</td>
                        <td>{mora.tramo}</td>
                        <td>{formatoQuetzales(mora.interesMoratorio)}</td>
                        <td>{formatoQuetzales(mora.interesEnSuspenso)}</td>
                        <td>{formatoQuetzales(mora.cargoCobranza)}</td>
                        <td>{mora.politicaMora}</td>
                      </tr>
                    ))}

                    {moras.length === 0 && (
                      <tr>
                        <td colSpan={10} className="empty-row">
                          No hay créditos en mora registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        
{vista === "cierres" && (
  <section className="panel">
    <h2>Cierres diarios y mensuales</h2>
    <p>Consulta los movimientos y genera el resumen del período.</p>

    <div className="form-grid">
      <div>
        <label>Tipo de cierre</label>
        <select
          value={tipoCierre}
          onChange={(e) => {
            setTipoCierre(e.target.value as "diario" | "mensual");
            setDatosCierre(null);
            setErrorCierre("");
          }}
        >
          <option value="diario">Cierre diario</option>
          <option value="mensual">Cierre mensual</option>
        </select>
      </div>

      {tipoCierre === "diario" ? (
        <div>
          <label>Fecha del cierre</label>
          <input
            type="date"
            value={fechaCierre}
            onChange={(e) => {
              setFechaCierre(e.target.value);
              setDatosCierre(null);
            }}
          />
        </div>
      ) : (
        <div>
          <label>Mes del cierre</label>
          <input
            type="month"
            value={mesCierre}
            onChange={(e) => {
              setMesCierre(e.target.value);
              setDatosCierre(null);
            }}
          />
        </div>
      )}
    </div>

    <button
      disabled={cargandoCierre}
      onClick={() => {
        setErrorCierre("");
        setCargandoCierre(true);

        try {
          const pagosPeriodo: PagoHistorial[] = historialPagos.filter(
  (pago: PagoHistorial) => {
            const fecha = String(pago.fechaPago ?? "").slice(0, 10);

            return tipoCierre === "diario"
              ? fecha === fechaCierre
              : fecha.startsWith(mesCierre);
          });

          const desembolsosPeriodo = creditos.filter((credito: any) => {
            const fecha = String(credito.fechaDesembolso ?? "").slice(0, 10);

            return tipoCierre === "diario"
              ? fecha === fechaCierre
              : fecha.startsWith(mesCierre);
          });

          const totalCobrado = pagosPeriodo.reduce(
            (total: number, pago: any) =>
              total + Number(pago.montoRecibido ?? pago.monto ?? 0),
            0
          );

          const totalDesembolsado = desembolsosPeriodo.reduce(
            (total: number, credito: any) =>
              total + Number(credito.capital ?? credito.monto ?? 0),
            0
          );

          setDatosCierre({
  fecha: tipoCierre === "diario" ? fechaCierre : mesCierre,
  tipo: tipoCierre,
  cantidadPagos: pagosPeriodo.length,
  cantidadDesembolsos: desembolsosPeriodo.length,
  totalCobrado,
  totalDesembolsado,
  saldoNeto: totalCobrado - totalDesembolsado,

  totalGastos: pagosPeriodo.reduce(
    (total, pago) => total + Number(pago.aplicacion?.gastos ?? 0),
    0
  ),

  totalInteresMoratorio: pagosPeriodo.reduce(
    (total, pago) =>
      total + Number(pago.aplicacion?.interesMoratorio ?? 0),
    0
  ),

  totalInteresCorriente: pagosPeriodo.reduce(
    (total, pago) =>
      total + Number(pago.aplicacion?.interesCorriente ?? 0),
    0
  ),

  totalCapital: pagosPeriodo.reduce(
    (total, pago) => total + Number(pago.aplicacion?.capital ?? 0),
    0
  ),
});
        } catch {
          setErrorCierre("No fue posible generar el cierre.");
        } finally {
          setCargandoCierre(false);
        }
      }}
    >
      {cargandoCierre ? "Generando..." : "Generar cierre"}
    </button>

    {errorCierre && <p className="error">{errorCierre}</p>}

    {datosCierre && (
      <div className="panel" style={{ marginTop: "20px" }}>
        <h3>
          Resultado del cierre {datosCierre.tipo}
        </h3>

        <p>
          <strong>Período:</strong> {datosCierre.fecha}
        </p>

        <div className="form-grid">
          <div>
            <h4>Pagos recibidos</h4>
            <p>{datosCierre.cantidadPagos}</p>
            <strong>
              Q {datosCierre.totalCobrado.toFixed(2)}
            </strong>
          </div>
<div>
  <h4>Recuperación por gastos</h4>
  <strong>
    Q {datosCierre.totalGastos.toFixed(2)}
  </strong>
</div>

<div>
  <h4>Recuperación por interés moratorio</h4>
  <strong>
    Q {datosCierre.totalInteresMoratorio.toFixed(2)}
  </strong>
</div>

<div>
  <h4>Recuperación por interés corriente</h4>
  <strong>
    Q {datosCierre.totalInteresCorriente.toFixed(2)}
  </strong>
</div>

<div>
  <h4>Recuperación por capital</h4>
  <strong>
    Q {datosCierre.totalCapital.toFixed(2)}
  </strong>
</div>
          <div>
            <h4>Créditos desembolsados</h4>
            <p>{datosCierre.cantidadDesembolsos}</p>
            <strong>
              Q {datosCierre.totalDesembolsado.toFixed(2)}
            </strong>
          </div>

          <div>
            <h4>Saldo neto del período</h4>
            <strong>
              Q {datosCierre.saldoNeto.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>
    )}
  </section>
)}


      </main>
    </div>
  );
}

export default App;
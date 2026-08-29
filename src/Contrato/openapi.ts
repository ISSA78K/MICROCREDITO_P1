export const openApiDocument = {
  openapi: "3.1.0",

  info: {
    title:
      "Sistema de Gestión de Microcrédito - Crédito Vecino",
    version: "1.0.0",
    description:
      "Contrato de API para la gestión de microcréditos.",
  },

  servers: [
    {
      url: "https://api.creditovecino.gt",
    },
  ],

  paths: {
        "/clientes": {
      post: {
        summary: "Registrar un cliente",
        operationId: "registrarCliente",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegistrarClienteRequest",
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Cliente registrado correctamente",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ClienteResponse",
                },
              },
            },
          },

          "400": {
            description: "Solicitud inválida",
            content: {
              "application/problem+json": {
                schema: {
                  $ref: "#/components/schemas/ProblemDetails",
                },
              },
            },
          },

          "422": {
            description: "Error de validación",
            content: {
              "application/problem+json": {
                schema: {
                  $ref: "#/components/schemas/ProblemDetails",
                },
              },
            },
          },
        },
      },

      get: {
        summary: "Consultar clientes",
        operationId: "consultarClientes",

        responses: {
          "200": {
            description: "Listado de clientes",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/ClienteResponse",
                  },
                },
              },
            },
          },
        },
      },
    },

    "/solicitudes": {
      post: {
        summary: "Registrar una solicitud de crédito",
        operationId: "registrarSolicitudCredito",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegistrarSolicitudRequest",
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Solicitud registrada correctamente",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SolicitudCreditoResponse",
                },
              },
            },
          },

          "400": {
            description: "Solicitud inválida",
            content: {
              "application/problem+json": {
                schema: {
                  $ref: "#/components/schemas/ProblemDetails",
                },
              },
            },
          },

          "422": {
            description: "Error de validación",
            content: {
              "application/problem+json": {
                schema: {
                  $ref: "#/components/schemas/ProblemDetails",
                },
              },
            },
          },
        },
      },
    },

    "/creditos": {
      get: {
        summary: "Consultar créditos",
        operationId: "consultarCreditos",

        responses: {
          "200": {
            description: "Listado de créditos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/CreditoResponse",
                  },
                },
              },
            },
          },
        },
      },
    },

    "/creditos/{creditoId}/desembolso": {
      post: {
        summary: "Desembolsar un crédito",
        operationId: "desembolsarCredito",

        parameters: [
          {
            name: "creditoId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/DesembolsarCreditoRequest",
              },
            },
          },
        },

        responses: {
          "200": {
            description: "Crédito desembolsado correctamente",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreditoResponse",
                },
              },
            },
          },

          "400": {
            description: "Solicitud inválida",
            content: {
              "application/problem+json": {
                schema: {
                  $ref: "#/components/schemas/ProblemDetails",
                },
              },
            },
          },

          "422": {
            description: "Error de validación",
            content: {
              "application/problem+json": {
                schema: {
                  $ref: "#/components/schemas/ProblemDetails",
                },
              },
            },
          },
        },
      },
    },

    "/cierres": {
      get: {
        summary: "Consultar cierre de cartera",
        operationId: "consultarCierre",

        parameters: [
          {
            name: "fechaCorte",
            in: "query",
            required: true,
            schema: {
              type: "string",
              format: "date",
            },
          },
        ],

        responses: {
          "200": {
            description: "Cierre de cartera",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CierreResponse",
                },
              },
            },
          },

          "422": {
            description: "Error de validación",
            content: {
              "application/problem+json": {
                schema: {
                  $ref: "#/components/schemas/ProblemDetails",
                },
              },
            },
          },
        },
      },
    },

    "/cartera/riesgo": {
      get: {
        summary: "Consultar cartera en riesgo",
        operationId: "consultarCarteraEnRiesgo",

        parameters: [
          {
            name: "fechaCorte",
            in: "query",
            required: true,
            schema: {
              type: "string",
              format: "date",
            },
          },
        ],

        responses: {
          "200": {
            description: "Indicadores de cartera en riesgo",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CarteraRiesgoResponse",
                },
              },
            },
          },

          "422": {
            description: "Error de validación",
            content: {
              "application/problem+json": {
                schema: {
                  $ref: "#/components/schemas/ProblemDetails",
                },
              },
            },
          },
        },
      },
    },
    "/pagos": {
      post: {
        summary: "Registrar un pago",
        operationId: "registrarPago",

        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: true,

            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegistrarPagoRequest",
              },
            },
          },
        },

        responses: {
          "201": {
            description:
              "Pago registrado correctamente",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RegistrarPagoResponse",
                },
              },
            },
          },

          "200": {
            description:
              "Pago previamente procesado; respuesta reproducida",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RegistrarPagoResponse",
                },
              },
            },
          },

          "400": {
            description:
              "Solicitud inválida",

            content: {
              "application/problem+json": {
                schema: {
                  $ref: "#/components/schemas/ProblemDetails",
                },
              },
            },
          },

          "409": {
            description:
              "La misma Idempotency-Key fue utilizada anteriormente con un contenido diferente",

            content: {
              "application/problem+json": {
                schema: {
                  $ref: "#/components/schemas/ProblemDetails",
                },
              },
            },
          },

          "422": {
            description:
              "Error de validación",

            content: {
              "application/problem+json": {
                schema: {
                  $ref: "#/components/schemas/ProblemDetails",
                },
              },
            },
          },
        },
      },
    },

    "/cartera": {
      get: {
        summary:
          "Consultar indicadores de cartera",

        operationId:
          "consultarCartera",

        parameters: [
          {
            name: "fechaCorte",
            in: "query",
            required: true,

            schema: {
              type: "string",
              format: "date",
            },
          },
        ],

        responses: {
          "200": {
            description:
              "Indicadores de cartera",

            content: {
              "application/json": {
                schema: {
                  $ref:
                    "#/components/schemas/ConsultarCarteraResponse",
                },
              },
            },
          },

          "422": {
            description:
              "Error de validación",

            content: {
              "application/problem+json": {
                schema: {
                  $ref:
                    "#/components/schemas/ProblemDetails",
                },
              },
            },
          },
        },
      },
    },
  },

  components: {
    schemas: {
          RegistrarClienteRequest: {
        type: "object",

        required: [
          "clienteId",
          "nombre",
        ],

        properties: {
          clienteId: {
            type: "string",
            example: "CLI-001",
          },

          nombre: {
            type: "string",
            example: "Cliente Ejemplo",
          },
        },
      },

      ClienteResponse: {
        type: "object",

        required: [
          "clienteId",
          "nombre",
        ],

        properties: {
          clienteId: {
            type: "string",
            example: "CLI-001",
          },

          nombre: {
            type: "string",
            example: "Cliente Ejemplo",
          },
        },
      },

      RegistrarSolicitudRequest: {
        type: "object",

        required: [
          "clienteId",
          "monto",
        ],

        properties: {
          clienteId: {
            type: "string",
            example: "CLI-001",
          },

          monto: {
            type: "string",
            pattern: "^\\d{1,13}\\.\\d{2}$",
            example: "5000.00",
          },
        },
      },

      SolicitudCreditoResponse: {
        type: "object",

        required: [
          "solicitudId",
          "clienteId",
          "monto",
          "estado",
        ],

        properties: {
          solicitudId: {
            type: "string",
            example: "SOL-001",
          },

          clienteId: {
            type: "string",
            example: "CLI-001",
          },

          monto: {
            type: "string",
            example: "5000.00",
          },

          estado: {
            type: "string",
            example: "solicitado",
          },
        },
      },

      CreditoResponse: {
        type: "object",

        required: [
          "creditoId",
          "clienteId",
          "saldoCapital",
          "estado",
        ],

        properties: {
          creditoId: {
            type: "string",
            example: "C-001",
          },

          clienteId: {
            type: "string",
            example: "CLI-001",
          },

          saldoCapital: {
            type: "string",
            example: "5000.00",
          },

          estado: {
            type: "string",
            example: "vigente",
          },
        },
      },

      DesembolsarCreditoRequest: {
        type: "object",

        required: [
          "monto",
        ],

        properties: {
          monto: {
            type: "string",
            pattern: "^\\d{1,13}\\.\\d{2}$",
            example: "5000.00",
          },
        },
      },

      CierreResponse: {
        type: "object",

        required: [
          "fechaCorte",
          "carteraActiva",
          "saldoEnRiesgo",
          "porcentajeEnRiesgo",
          "dadoPorIncobrableEnElPeriodo",
        ],

        properties: {
          fechaCorte: {
            type: "string",
            format: "date",
          },

          carteraActiva: {
            type: "string",
            example: "800000.00",
          },

          saldoEnRiesgo: {
            type: "string",
            example: "56000.00",
          },

          porcentajeEnRiesgo: {
            type: "number",
            example: 7.00,
          },

          dadoPorIncobrableEnElPeriodo: {
            type: "string",
            example: "8000.00",
          },
        },
      },

      CarteraRiesgoResponse: {
        type: "object",

        required: [
          "fechaCorte",
          "carteraActiva",
          "saldoEnRiesgo",
          "porcentajeEnRiesgo",
          "porTramo",
          "dadoPorIncobrableEnElPeriodo",
        ],

        properties: {
          fechaCorte: {
            type: "string",
            format: "date",
          },

          carteraActiva: {
            type: "string",
            example: "800000.00",
          },

          saldoEnRiesgo: {
            type: "string",
            example: "56000.00",
          },

          porcentajeEnRiesgo: {
            type: "number",
            minimum: 0,
            maximum: 100,
            example: 7.00,
          },

          porTramo: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },

          dadoPorIncobrableEnElPeriodo: {
            type: "string",
            example: "8000.00",
          },
        },
      },
    securitySchemes: {
      IdempotencyKey: {
        type: "apiKey",
        in: "header",
        name: "Idempotency-Key",
        description:
          "Clave única para garantizar que un mismo pago no sea procesado dos veces.",
  },
},
      RegistrarPagoRequest: {
        type: "object",

        required: [
          "creditoId",
          "monto",
          "saldos",
        ],

        properties: {
          creditoId: {
            type: "string",
            example: "C-004",
          },

          monto: {
            type: "string",
            pattern:
              "^-?\\d{1,13}\\.\\d{2}$",
            example: "1004.62",
          },

          saldos: {
            type: "object",

            required: [
              "gastos",
              "interesMoratorio",
              "interesCorriente",
              "capital",
            ],

            properties: {
              gastos: {
                type: "string",
                example: "10.00",
              },

              interesMoratorio: {
                type: "string",
                example: "20.00",
              },

              interesCorriente: {
                type: "string",
                example: "30.00",
              },

              capital: {
                type: "string",
                example: "100.00",
              },
            },
          },
        },
      },

      RegistrarPagoResponse: {
        type: "object",

        required: [
          "pagoId",
          "creditoId",
          "montoRecibido",
          "reproducido",
          "aplicacion",
        ],

        properties: {
          pagoId: {
            type: "string",
          },

          creditoId: {
            type: "string",
          },

          montoRecibido: {
            type: "string",
          },

          reproducido: {
            type: "boolean",
          },

          aplicacion: {
            type: "object",

            properties: {
              gastos: {
                type: "string",
              },

              interesMoratorio: {
                type: "string",
              },

              interesCorriente: {
                type: "string",
              },

              capital: {
                type: "string",
              },

              excedente: {
                type: "string",
              },
            },
          },
        },
      },

      ConsultarCarteraResponse: {
        type: "object",

        required: [
          "fechaCorte",
          "carteraActiva",
          "saldoEnRiesgo",
          "porcentajeEnRiesgo",
        ],

        properties: {
          fechaCorte: {
            type: "string",
            format: "date",
          },

          carteraActiva: {
            type: "string",
            example: "15000.00",
          },

          saldoEnRiesgo: {
            type: "string",
            example: "5000.00",
          },

          porcentajeEnRiesgo: {
            type: "number",
            minimum: 0,
            maximum: 100,   
            example: 33.33,
          },

          porTramo: {
            type: "object",
          },

          dadoPorIncobrableEnElPeriodo: {
            type: "string",
            example: "500.00",
          },
        },
      },

      ProblemDetails: {
        type: "object",

        required: [
          "type",
          "title",
          "status",
        ],

        properties: {
          type: {
            type: "string",
            format: "uri",
          },

          title: {
            type: "string",
          },

          status: {
            type: "integer",
            minimum: 400,
            maximum: 599,
          },

          detail: {
            type: "string",
          },

          instance: {
            type: "string",
          },

          traceId: {
            type: "string",
          },

          errores: {
            type: "array",

            items: {
              type: "object",

              required: [
                "campo",
                "mensaje",
              ],

              properties: {
                campo: {
                  type: "string",
                },

                mensaje: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
  },
} as const; 
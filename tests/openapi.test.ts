import {
  describe,
  expect,
  it,
} from "vitest";

import {
  openApiDocument,
} from "../src/Contrato/openapi";

describe("Contrato OpenAPI", () => {
  it("declara OpenAPI 3.1", () => {
    expect(
      openApiDocument.openapi
    ).toBe("3.1.0");
  });

  it("expone POST /pagos", () => {
    expect(
      openApiDocument.paths[
        "/pagos"
      ].post
    ).toBeDefined();
  });

  it("expone GET /cartera", () => {
    expect(
      openApiDocument.paths[
        "/cartera"
      ].get
    ).toBeDefined();
  });

  it("requiere Idempotency-Key para pagos", () => {
    const parametros =
      openApiDocument.paths[
        "/pagos"
      ].post.parameters;

    const clave =
      parametros.find(
        (parametro) =>
          parametro.name ===
          "Idempotency-Key"
      );

    expect(clave).toBeDefined();
    expect(clave?.required).toBe(true);
  });

  it("define ProblemDetails", () => {
    expect(
      openApiDocument.components
        .schemas.ProblemDetails
    ).toBeDefined();
  });

  it("define respuesta 409 para pagos", () => {
    expect(
      openApiDocument.paths[
        "/pagos"
      ].post.responses["409"]
    ).toBeDefined();
  });
});
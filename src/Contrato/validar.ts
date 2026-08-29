import SwaggerParser from "@apidevtools/swagger-parser";

async function validar() {
  try {
    await SwaggerParser.validate("./openapi.json");

    console.log(
      "OK · documento OpenAPI 3.1 válido"
    );
  } catch (error) {
    console.error(
      "ERROR · documento OpenAPI inválido"
    );

    console.error(error);

    process.exit(1);
  }
}

validar();
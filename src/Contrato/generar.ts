import { writeFileSync } from "node:fs";
import { openApiDocument } from "./openapi";
import { stringify } from "yaml";

const json = JSON.stringify(
  openApiDocument,
  null,
  2
);

const yaml = stringify(
  openApiDocument
);

writeFileSync(
  "./openapi.json",
  json,
  "utf8"
);

writeFileSync(
  "./openapi.yaml",
  yaml,
  "utf8"
);

console.log("OK · openapi.json generado");
console.log("OK · openapi.yaml generado");
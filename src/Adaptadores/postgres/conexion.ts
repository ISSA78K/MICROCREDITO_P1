import "dotenv/config";
import { Pool, type PoolClient } from "pg";

const host = process.env.DB_HOST;
const port = Number(process.env.DB_PORT);
const database = process.env.DB_NAME;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

if (!host || !database || !user || !password || !Number.isInteger(port)) {
  throw new Error(
    "La configuración de PostgreSQL está incompleta. Revisa el archivo .env."
  );
}

export const pool = new Pool({
  host,
  port,
  database,
  user,
  password,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function ejecutarTransaccion<T>(
  operacion: (cliente: PoolClient) => Promise<T>
): Promise<T> {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    const resultado = await operacion(cliente);

    await cliente.query("COMMIT");

    return resultado;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

pool.on("error", (error) => {
  console.error("Error inesperado en el pool de PostgreSQL:", error.message);
});

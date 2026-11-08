import { pool } from "./conexion";

async function probarConexion(): Promise<void> {
  try {
    const resultado = await pool.query(
      "SELECT current_database() AS base, current_user AS usuario, version() AS version"
    );

    console.log("Conexión PostgreSQL exitosa.");
    console.log("Base de datos:", resultado.rows[0].base);
    console.log("Usuario:", resultado.rows[0].usuario);
    console.log("Versión:", resultado.rows[0].version);
  } catch (error) {
    console.error("Error al conectar con PostgreSQL:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void probarConexion();
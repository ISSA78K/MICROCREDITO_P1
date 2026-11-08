CREATE TABLE IF NOT EXISTS solicitudes (
    id_solicitud TEXT PRIMARY KEY,
    id_cliente TEXT NOT NULL REFERENCES clientes(id_cliente),
    id_asesor TEXT REFERENCES asesores(id_asesor),
    fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
    monto_solicitado_centavos BIGINT NOT NULL CHECK (monto_solicitado_centavos > 0),
    plazo_meses INTEGER NOT NULL CHECK (plazo_meses > 0),
    destino_credito TEXT NOT NULL,
    observaciones TEXT,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA'))
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_cliente
    ON solicitudes(id_cliente);

CREATE INDEX IF NOT EXISTS idx_solicitudes_estado
    ON solicitudes(estado);
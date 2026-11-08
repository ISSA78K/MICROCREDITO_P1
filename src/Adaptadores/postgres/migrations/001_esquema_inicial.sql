CREATE TABLE IF NOT EXISTS asesores (
    id_asesor TEXT PRIMARY KEY,
    nombre_completo TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clientes (
    id_cliente TEXT PRIMARY KEY,
    nombre_completo TEXT NOT NULL,
    dpi TEXT NOT NULL,
    telefono TEXT,
    municipio TEXT,
    fecha_alta DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS politicas (
    id_politica TEXT PRIMARY KEY,
    datos JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS creditos (
    id_credito TEXT PRIMARY KEY,
    id_cliente TEXT NOT NULL REFERENCES clientes(id_cliente),
    id_asesor TEXT NOT NULL REFERENCES asesores(id_asesor),
    fecha_desembolso DATE NOT NULL,
    capital_centavos BIGINT NOT NULL CHECK (capital_centavos > 0),
    saldo_capital_centavos BIGINT NOT NULL DEFAULT 0,
    plazo_meses INTEGER NOT NULL CHECK (plazo_meses > 0),
    tna_bps INTEGER NOT NULL CHECK (tna_bps >= 0),
    reestructurado BOOLEAN NOT NULL DEFAULT FALSE,
    estado TEXT NOT NULL DEFAULT 'ACTIVO',
    politica_mora_id TEXT,
    interes_en_suspenso_centavos BIGINT NOT NULL DEFAULT 0,
    dias_atraso INTEGER NOT NULL DEFAULT 0,
    cargo_cobranza_generado_centavos BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pagos (
    clave_idempotencia TEXT PRIMARY KEY,
    id_credito TEXT NOT NULL REFERENCES creditos(id_credito),
    fecha_pago DATE NOT NULL,
    monto_centavos BIGINT NOT NULL CHECK (monto_centavos > 0),
    canal TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eventos (
    seq BIGINT PRIMARY KEY,
    tipo TEXT NOT NULL,
    datos JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS documentos_rag (
    id_documento TEXT PRIMARY KEY,
    nombre_archivo TEXT NOT NULL UNIQUE,
    contenido TEXT NOT NULL,
    hash_sha256 TEXT
);

CREATE TABLE IF NOT EXISTS fragmentos_rag (
    id_fragmento BIGSERIAL PRIMARY KEY,
    id_documento TEXT NOT NULL REFERENCES documentos_rag(id_documento)
        ON DELETE CASCADE,
    numero_fragmento INTEGER NOT NULL,
    contenido TEXT NOT NULL,
    UNIQUE (id_documento, numero_fragmento)
);

CREATE INDEX IF NOT EXISTS idx_creditos_cliente
    ON creditos(id_cliente);

CREATE INDEX IF NOT EXISTS idx_creditos_estado
    ON creditos(estado);

CREATE INDEX IF NOT EXISTS idx_pagos_credito_fecha
    ON pagos(id_credito, fecha_pago);

CREATE INDEX IF NOT EXISTS idx_eventos_tipo
    ON eventos(tipo);

CREATE INDEX IF NOT EXISTS idx_fragmentos_documento
    ON fragmentos_rag(id_documento);
    
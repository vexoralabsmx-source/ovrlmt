import "server-only";

export type EnviatodoEnv = {
  baseUrl: string;
  token: string;
  apiKey: string;
  app: string;
  contentType: string;
  mode: "sandbox" | "production" | string;
  guideDownloadUrl: string;
  guideBinariesUrl: string;
};

const REQUIRED_ENV_KEYS = [
  "ENVIATODO_BASE_URL",
  "ENVIATODO_TOKEN",
  "ENVIATODO_API_KEY",
  "ENVIATODO_APP",
  "ENVIATODO_CONTENT_TYPE",
  "ENVIATODO_MODE",
  "ENVIATODO_GUIDE_DOWNLOAD_URL",
  "ENVIATODO_GUIDE_BINARIES_URL",
] as const;

function readRequiredEnv(key: (typeof REQUIRED_ENV_KEYS)[number]) {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`Falta la variable de entorno requerida: ${key}`);
  return value;
}

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

export function getEnviatodoEnv(): EnviatodoEnv {
  try {
    return {
      baseUrl: normalizeBaseUrl(readRequiredEnv("ENVIATODO_BASE_URL")),
      token: readRequiredEnv("ENVIATODO_TOKEN"),
      apiKey: readRequiredEnv("ENVIATODO_API_KEY"),
      app: readRequiredEnv("ENVIATODO_APP"),
      contentType: readRequiredEnv("ENVIATODO_CONTENT_TYPE"),
      mode: readRequiredEnv("ENVIATODO_MODE"),
      guideDownloadUrl: readRequiredEnv("ENVIATODO_GUIDE_DOWNLOAD_URL"),
      guideBinariesUrl: readRequiredEnv("ENVIATODO_GUIDE_BINARIES_URL"),
    };
  } catch (error) {
    console.error("enviatodo_env_invalid", {
      message: error instanceof Error ? error.message : "Variables de entorno EnviaTodo invalidas.",
    });
    throw error;
  }
}

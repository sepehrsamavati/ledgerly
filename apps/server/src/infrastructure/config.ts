export interface ServerConfig {
  port: number;
  host: string;
  corsOrigin: string | boolean;
  prefix: string;
}

export function getConfig(): ServerConfig {
  return {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
    host: process.env.HOST || '0.0.0.0',
    corsOrigin: process.env.CORS_ORIGIN || true,
    prefix: process.env.API_PREFIX || '',
  };
}

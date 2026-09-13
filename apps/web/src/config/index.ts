export interface AppConfig {
  mode: 'client-only' | 'backend';
  apiBaseUrl?: string;
  basePath: string;
}

export function getAppConfig(): AppConfig {
  const mode = (import.meta.env.VITE_APP_MODE as 'backend') || 'client-only';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const basePath = import.meta.env.VITE_BASE_PATH || '/';

  return {
    mode,
    apiBaseUrl,
    basePath,
  };
}

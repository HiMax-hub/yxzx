/// <reference types="vite/client" />

// Vite 环境变量类型声明（.env.development / .env.production）
interface ImportMetaEnv {
  readonly VITE_APP_ENV: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_STORAGE_PREFIX: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT_MS: string;
  readonly VITE_SITE_DOMAIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PADDLE_ENV?: 'sandbox' | 'production' | string;
  readonly VITE_PADDLE_CLIENT_TOKEN?: string;
  readonly VITE_PADDLE_MONTHLY_PRICE_ID?: string;
  readonly VITE_PADDLE_LIFETIME_PRICE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

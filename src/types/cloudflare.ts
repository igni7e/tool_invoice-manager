/// <reference types="@cloudflare/workers-types" />

export interface CloudflareEnv {
  DB: D1Database;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends CloudflareEnv {}
  }
}

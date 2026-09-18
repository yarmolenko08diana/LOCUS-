/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LLM_ENABLED?: string
  readonly VITE_LLM_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

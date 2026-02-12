/**
 * Type declarations for WASM module imports
 * Supports importing .wasm files directly as URLs/data URIs for bundling
 */

declare module '*.wasm' {
  const content: string;
  export default content;
}

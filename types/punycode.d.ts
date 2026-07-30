// The `punycode` npm package ships no types, and `@types/node` only declares the
// deprecated built-in module. We import the package file directly to avoid the
// built-in, so mirror the small surface we use.
declare module 'punycode/punycode.js' {
  export function toUnicode(domain: string): string;
  export function toASCII(domain: string): string;
}

declare module 'punycode/punycode.js' {
  export function toUnicode(domain: string): string;
  export function toASCII(domain: string): string;
}

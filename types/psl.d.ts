// psl ships its own types at psl/types/index.d.ts, but its package.json
// `exports` map omits a `types` condition so TypeScript's moduleResolution:node16
// can't find them. Mirror the small surface we use.
declare module 'psl' {
  export function get(domain: string | null): string | null;
  export function isValid(domain: string): boolean;
  export function parse(domain: string):
    | {
        tld: string | null;
        sld: string | null;
        domain: string | null;
        subdomain: string | null;
        listed: boolean;
        input: string;
      }
    | { input: string; error: { message: string; code: string } };
}

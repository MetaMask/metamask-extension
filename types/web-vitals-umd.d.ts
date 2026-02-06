/**
 * Type declarations for web-vitals UMD build.
 *
 * Maps the CJS build path to the same types as the ESM attribution module.
 * This is needed because Browserify/LavaMoat cannot bundle ESM modules,
 * but TypeScript needs to know the UMD build has identical exports.
 *
 * @see https://github.com/GoogleChrome/web-vitals
 */
declare module 'web-vitals/dist/web-vitals.attribution.umd.cjs' {
  export * from 'web-vitals/attribution';
}

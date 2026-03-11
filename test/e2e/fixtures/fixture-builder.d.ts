/**
 * Type declaration for fixture-builder.js (JavaScript module).
 * Ensures TypeScript recognizes withAssetsController and other balance helpers.
 */
declare class FixtureBuilder {
  withAssetsController(data: Record<string, unknown>): this;
  withTokensController(data: Record<string, unknown>): this;
  withEnabledNetworks(data: Record<string, unknown>): this;
  withAppStateController(data: Record<string, unknown>): this;
  build(): unknown;
}

export = FixtureBuilder;

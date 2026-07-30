// WARNING: This code runs outside of LavaMoat.
//
// Two globals must share this exact object:
// - the browser global: the real Window or WorkerGlobalScope, where WebDriver
//   and CDP evaluate test code;
// - LavaMoat's protected root global: where MetaMask installs the test hooks.
//
// Creating the object before LavaMoat starts lets LavaMoat copy the same
// reference into its protected root global. MetaMask can then populate the
// object from inside LavaMoat while tests read it from the browser global.
// Creating it later in bootstrap would expose it only to the protected root.
//
// HTML pages load this file as a script, and the service worker injects it as a
// LavaMoat static shim. Static shims are evaluated as raw source, so this file
// must remain valid JavaScript without imports, exports, or TypeScript syntax.
// eslint-disable-next-line import-x/unambiguous
globalThis.stateHooks ??= Object.create(Object.prototype);

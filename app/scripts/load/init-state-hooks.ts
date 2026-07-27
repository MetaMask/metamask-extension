// WARNING: This code runs outside of LavaMoat.
//
// Runs before LavaMoat solely to expose one shared object. The root
// compartment populates this object with hooks.
globalThis.stateHooks ??= {} as typeof stateHooks;

export {};

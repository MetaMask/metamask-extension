// WARNING: This code runs outside of LavaMoat.
//
// Runs before LavaMoat solely to expose one shared object. The root
// compartment populates this object with hooks.
// This must remain a script because LavaMoat evaluates static shims as raw
// source.
// eslint-disable-next-line import-x/unambiguous
globalThis.stateHooks ??= Object.create(Object.prototype);

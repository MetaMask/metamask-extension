// The root compartment will populate this with hooks
global.stateHooks = global.stateHooks || ({} as typeof stateHooks);
global.stateHooks.runtimeInitialization ??= import(
  /* webpackChunkName: "common-startup" */ './runtime-startup.js'
).then(({ initializeRuntime }) => initializeRuntime());

export {};

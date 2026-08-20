// WARNING: This code runs outside of LavaMoat.
//
// Sentry's GlobalHandlers integration sets this to 50 during initialization.
// Once Sentry runs in a LavaMoat package compartment, however, SES gives it a
// shared Error constructor whose stackTraceLimit setter intentionally does
// nothing. A static shim runs between SES's repair and harden phases, where the
// root Error constructor can still forward this setting to the browser's Error
// constructor. Errors created later inside protected compartments then retain
// the same stack depth that Sentry requested before it was protected.
//
// LavaMoat evaluates static shims as raw source, so this file must remain valid
// JavaScript without imports, exports, or TypeScript-only syntax.
// eslint-disable-next-line import-x/unambiguous
Error.stackTraceLimit = 50;

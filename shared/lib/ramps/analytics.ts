/*
 * Constants from the `metamask-ramps` Segment tracking plan, shared by the UI
 * (`useRampsAnalytics`) and the background checkout/order analytics. The
 * extension in-app buy flow mirrors mobile's Unified Buy v2.
 */

// The `metamask-ramps` schema requires `ramp_type` on every event.
// Single const for now; promote to a param if the flow ever emits other
// ramp types (deposit/sell/headless).
export const RAMPS_RAMP_TYPE = 'UNIFIED_BUY_2';

// The extension buy flow routes through third-party (aggregator) providers.
// `AGGREGATOR` is valid on every event's optional `ramp_routing` enum.
export const RAMPS_RAMP_ROUTING = 'AGGREGATOR';

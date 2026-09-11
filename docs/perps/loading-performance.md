# Perps preload performance and telemetry

On a fresh browser process, opening Perps immediately after unlock took **3.48 seconds before and 2.69 seconds after**, a **23% reduction in median wait**. Opening Perps three seconds after unlock took **3.84 seconds before and 0.05 seconds after**, a **98.7% reduction**. The latter includes a declared preload opportunity on wallet Home before the measured click. These are three-sample medians; immediate-entry ranges overlap, so statistical significance is not established.

These are real click-to-priced-DOM measurements, not browser startup time, recipe execution duration, or Sentry span duration. Three samples were retained per build and flow/direction.

| Flow                                        | First priced rows, before → after | Sampled priced rows matching quotes, before → after |
| ------------------------------------------- | --------------------------------- | --------------------------------------------------- |
| Fresh browser, immediate entry after unlock | 3.484 s → 2.686 s                 | 3.687 s → 2.937 s                                   |
| Fresh browser, entry 3 s after unlock       | 3.837 s → 0.050 s                 | 4.101 s → 0.050 s                                   |
| Warm entry                                  | 0.028 s → 0.035 s                 | 9.757 s → 0.035 s                                   |
| Brief tab resume                            | 0.024 s → 0.026 s                 | 7.320 s → 0.026 s                                   |
| Account 1 → Account 2                       | 2.793 s → 2.035 s                 | 2.906 s → 2.150 s                                   |
| Account 2 → Account 1                       | 2.739 s → 2.067 s                 | 2.879 s → 2.176 s                                   |

Warm cached rows can appear before their displayed symbols have matching current quotes. The historical second boundary waits for every included positive-priced row to match a finite positive quote using the actual UI formatter, and for the manager address and account/order/position caches to be available. Its collector filtered unpriced rows before checking, so it does not prove completeness of the rendered row set. The revised reusable collector retains unpriced rows and waits for all of them; its separate validation does not retroactively strengthen the historical samples. It does not independently establish exchange-origin freshness or the provenance/content of every account snapshot. The observed warm and resume difference is in this quote-matching boundary; first priced rows remained around 25–35 ms.

The account journey selects an existing account on wallet Home, then clicks Perps. It includes that intervening UI/automation delay, which is retained separately in the raw values. It does not measure switching inside an already-open Perps dashboard. Brief resume means a measured hidden→visible tab transition in the same process, not prolonged suspension or socket recovery.

## Reproduce and inspect

The [reusable recipe collector](../../development/perps/loading/README.md) generates, plans and runs each flow, checks build identity and prices, captures actual SDK events, and retains complete recipe evidence. [All 36 sample extracts, raw timestamps, medians, ranges and hashes](./loading-performance-results.json) are included. Keep failed authoring attempts outside the declared cohorts; do not overwrite or count them as passes.

The benchmark compares frozen baseline `867848e2481626dc47ee1bb0f2695dc45d0eef67` plus the same eight startup policy prerequisites against PR commit `96583820b169e80830f1fded4c9f92f413fcd689`. It used mm-harness 0.50.5 and Chrome for Testing 147.0.7727.15, fullscreen MV3, on the same preserved development wallet profile. Fresh-process samples verify browser replacement and an uncached Terminal `/v1/perpetuals` response with nonzero bytes. HTTP cache was disabled equally during both observation windows. OS, DNS and backend caches were not reset.

The subsequent account-switch telemetry addition is a separate source change. It does not alter provider initialization, preloading, connection ownership, or the serial queue; the table above remains identified with its measured commit.

The reusable collector subsequently passed cold, warm, account-change and brief-resume checks on the telemetry build. [Actual SDK start/end pairs and context](./loading-performance-traces.json) include the successful account-switch span and are kept separate from the benchmark cohorts. All four checks matched 12 rendered prices to current quotes. The unchanged 27-node regression also passed on that build.

## Mobile source contract

The reference is MetaMask Mobile commit [`7c379ae5cc63cd5db35dc2ce919883b5a674617e`](https://github.com/MetaMask/metamask-mobile/tree/7c379ae5cc63cd5db35dc2ce919883b5a674617e). This is a source comparison, not a Mobile runtime benchmark.

| Trace                               | Extension boundary                                                                                   | Mobile correspondence                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `Perps Connection Establishment`    | Eligible wallet-root operation through init, provider ping, market retrieval and price-preload setup | Connection establishment through connection/preload readiness                                   |
| `Perps Entry To Live Market List`   | Home mount to committed rendered-market readiness, with orders/positions available                   | Home entry measurement; same `empty`, `position`, `order` variants                              |
| `Perps Market List View`            | Market-list mount to its rendered-market readiness                                                   | Separate market-list screen measurement                                                         |
| `Perps Account Switch Reconnection` | This UI's requested account change through the existing wallet-root preload operation                | Mobile's shared manager reconnect includes cleanup, reconnect, platform delay, ping and preload |

The shared vocabulary is `op=perps.operation`, `feature=perps`, `lifecycle_context=cold_process|warm|background_resume|unknown`, unique operation IDs, and explicit success/failure endings. Cold state lives in the Extension background process and is consumed by successful foreground settlement. Tab visibility supplies Extension's resume observation; Mobile uses app lifecycle events. Background preload alone does not consume the first cold foreground entry.

Account-change spans explicitly carry `source=wallet_root`, `trigger=requested_account_change`, `start_boundary=wallet_root_effect`, and `completion_boundary=preload_ready`. They include RPC/queue wait and may occur once per UI while sharing one background reconnect. Filter by these boundaries when comparing with Mobile; do not aggregate them as identical shared-provider operations. A failed or superseded request need not become the active account. The existing timeout, release and failure paths end it unsuccessfully without interrupting unfinished provider work or changing serial ordering.

Mobile's separate reconnect-to-fresh-position CUF and its stage measurements are not established by this account-change span. Browser click-to-DOM, SDK mount/effect-to-readiness, and fresh-data receipt are different boundaries.

The baseline build did not expose the SDK observer, so no baseline SDK delta is claimed. Actual SDK events from the PR build are retained independently of the browser timings. Some cached mount-to-ready SDK spans are 0 ms; that does not mean the user click rendered in 0 ms. Pair starts/ends by span ID and use start-time context, since end-time isolation-scope tags may describe another operation. Remote Sentry ingestion is not proven by local SDK events.

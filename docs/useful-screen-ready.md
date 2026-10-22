# Useful Screen Ready

`Useful Screen Ready` (`ui.screen.performance`) measures initial document
navigation (`performance.timeOrigin`) to a page's explicit readiness signal.
The shared API emits no results until a page registers and reports a measurement.

## Page-owned measurement

Register before routing begins, using initial application state to decide
eligibility. Keep registration and navigation rules alongside the page. An
application bootstrap call connects that adapter to the initial state and router;
the shared measurement helper does not interpret either.

```ts
const measurement = registerDocumentLoadMeasurement({
  screen: 'example',
  tags: { 'example.initial_state': true },
});

measurement.reportReady(); // Record elapsed document loading time.
measurement.discard(); // Permanently exclude this document from sampling.
```

Both operations are terminal and idempotent. Reporting or discarding prevents
later registrations from restarting sampling in the same document. Registration
captures a copy of the supplied tags and the background initialization timestamp.
Labels and tags must not contain URLs, request identifiers, or other private data.

The page owns whether startup redirects are allowed, when leaving its initial
visit invalidates measurement, and which content or interactions affect readiness.
A router `REPLACE` alone does not establish that navigation is a startup redirect.
Observe navigation before the page mounts, including while its code is loading.
Expose the resulting handle through a page-owned context or props.

## Optional React scheduling

```ts
useAfterPaint(isContentReady, measurement?.reportReady);
```

`useAfterPaint` schedules a callback after a ready commit and two animation frames.
This allows a paint opportunity; it does not measure actual pixel presentation.
It cancels pending work when readiness becomes false, the callback changes, or the
component unmounts. Becoming ready again can schedule a new callback.

Scheduling cleanup never discards the measurement. This distinction allows
StrictMode replay and temporary loading states without permanently excluding a
valid load. The page explicitly calls `discard()` when the load is no longer
eligible. The scheduling hook has no dependency on telemetry or routing.

## Shared measurement contract

- At most one sample per document. Discarded loads produce no successful sample
  or incomplete span. A span is created and immediately ended when readiness is
  reported, backdated to document navigation.
- Visibility and page-close tracking starts before background initialization.
  Hidden documents and page close permanently exclude sampling. Where supported,
  buffered `visibility-state` entries also exclude documents hidden before the
  UI bundle ran. Otherwise, visibility before script execution is unknown.
- Common tags are `screen`, `ui.navigation=document`, `ui.readiness_version=1`,
  and `ui.background_initialized_before_navigation`. Integrations supply any
  additional initial-state metadata. Compare timings within matching cohorts.
- Background warmness uses the existing `BACKGROUND_INITIALIZED` message:
  before navigation=true, afterward=false, not received=unknown. No new RPC or
  wait is introduced.
- Default sampling is 0.1%, with existing consent, remote overrides, and ceilings.

Collect a production baseline before optimizations. Live Sentry ingestion and
dashboard availability must be verified after deployment. This metric covers
completed foreground loads, not abandonment or failure rates; asynchronous
enrichment can update content after readiness.

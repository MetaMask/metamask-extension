# Dedicated extension workers

Use a dedicated Web Worker to isolate a package that expects APIs we do not want
to grant it. Provide a worker-local mock for just the operations the package
needs. For example, mock a DOM or XML interface over worker-owned data, or use
in-memory storage instead of granting access to persistent extension storage.
Do not forward calls to the real APIs on the extension page.

The worker communicates with the page that creates it through messages and has
no access to the page's DOM. It is separate from the extension's background
service worker and does not register as one in the manifest.

Workers can also help keep the extension page responsive during CPU-intensive
work. In a synthetic Chromium 147 test on the MetaMask onboarding page, moving
the same calculation to a dedicated worker reduced the median largest gap
between animation-frame callbacks from 267 ms to 17 ms. The calculation took
about 273 ms either way. The test used a warmed worker, small messages, and a
development build with LavaMoat disabled. Measure responsiveness and end-to-end
latency for your own workload, including worker startup and message transfer.

## Add a worker

1. Create a top-level file in this directory named `<name>.worker.ts`. Webpack
   discovers these files automatically for Manifest V3 (MV3) builds and emits
   `workers/<name>.worker.js`. Other filenames and files in subdirectories are
   not discovered as entrypoints.
2. Keep the entrypoint focused on providing the mocks, handling messages, and
   calling worker logic. Keep the message interface narrow and send only the
   data the worker needs. Import dependencies statically: each worker is built
   as a self-contained script without a shared runtime or async chunks.
3. Start the worker from an MV3 extension page using the emitted extension URL.
   For example, to start `example.worker.ts`:

   ```ts
   const worker = new Worker(
     browser.runtime.getURL('workers/example.worker.js'),
   );
   ```

   Use `postMessage` and `message` events to exchange data. Handle errors and
   call `worker.terminate()` when the worker is no longer needed.

## Verify the build

Run `yarn start` (restart it after adding or renaming an entrypoint), then check
that the script appears under `dist/chrome/workers/`. Load the unpacked extension
and exercise the caller to verify that the worker starts and responds. Worker
entrypoints are not packaged for MV2 targets.

Also test with a LavaMoat-enabled build. Each worker gets its own inline SES
lockdown and does not inherit the browser-global exceptions used by extension
pages. Verify that the package works with the mocks and that the caller does
not expose the real APIs through its message interface.

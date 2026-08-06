/**
 * Returns true when the extension is running under Selenium/Playwright E2E
 * (`IN_TEST` build) and not inside a Jest worker.
 *
 * Used to skip physical hardware-wallet device probes that cannot succeed in CI.
 */
export function isInE2eTest(): boolean {
  return Boolean(
    process.env.IN_TEST && process.env.JEST_WORKER_ID === 'undefined',
  );
}

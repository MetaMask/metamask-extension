import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  // Mirrors the test runner's default `prepare`, plus an init script. Real
  // Chrome and Brave define `window.chrome` (without `runtime`) on every web
  // page, but Playwright's headless shell does not, so code that only guards
  // `chrome?.runtime` passes here and crashes in a real browser.
  async prepare({ page, browserContext, testRunnerConfig }) {
    await page.addInitScript('window.chrome ??= {};');

    const targetURL = process.env.TARGET_URL;
    const iframeURL = new URL('iframe.html', targetURL).toString();

    if (testRunnerConfig?.getHttpHeaders) {
      const headers = await testRunnerConfig.getHttpHeaders(iframeURL);
      await browserContext.setExtraHTTPHeaders(headers);
    }

    await page.goto(iframeURL, { waitUntil: 'load' }).catch((error) => {
      if (error.message?.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error(
          `Could not access the Storybook instance at ${targetURL}. Are you sure it's running?\n\n${error.message}`,
        );
      }
      throw error;
    });
  },
};

export default config;

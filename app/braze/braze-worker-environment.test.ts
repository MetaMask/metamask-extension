import { installBrazeWorkerEnvironment } from './braze-worker-environment';

describe('installBrazeWorkerEnvironment', () => {
  it('refuses to install in a document context', () => {
    expect(() => installBrazeWorkerEnvironment()).toThrow(
      'Braze SDK must run in a dedicated worker without a DOM',
    );
    expect(window.document).toBe(document);
  });
});

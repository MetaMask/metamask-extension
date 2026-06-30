import { isPureBlackPreviewAvailable } from './preview-pure-black-provider';

describe('isPureBlackPreviewAvailable', () => {
  const originalMetaMaskDebug = process.env.METAMASK_DEBUG;

  afterEach(() => {
    if (originalMetaMaskDebug === undefined) {
      delete process.env.METAMASK_DEBUG;
    } else {
      process.env.METAMASK_DEBUG = originalMetaMaskDebug;
    }
  });

  it('returns false when METAMASK_DEBUG is unset', () => {
    delete process.env.METAMASK_DEBUG;

    expect(isPureBlackPreviewAvailable()).toBe(false);
  });

  it('returns true when METAMASK_DEBUG is truthy', () => {
    process.env.METAMASK_DEBUG = 'true';

    expect(isPureBlackPreviewAvailable()).toBe(true);
  });
});

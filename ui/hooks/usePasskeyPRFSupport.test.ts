import { renderHook, waitFor } from '@testing-library/react';
import * as passkey from '../../shared/lib/passkey';
import { usePasskeyPRFSupport } from './usePasskeyPRFSupport';

jest.mock('../../shared/lib/passkey', () => ({
  ...jest.requireActual<typeof import('../../shared/lib/passkey')>(
    '../../shared/lib/passkey',
  ),
  isPasskeyPRFSupported: jest.fn(),
}));

const mockIsPasskeyPRFSupported = jest.mocked(passkey.isPasskeyPRFSupported);

describe('usePasskeyPRFSupport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not invoke the callback when PRF is supported', async () => {
    mockIsPasskeyPRFSupported.mockResolvedValue(true);
    const onUnsupported = jest.fn();

    renderHook(() => usePasskeyPRFSupport(onUnsupported));

    await waitFor(() => {
      expect(mockIsPasskeyPRFSupported).toHaveBeenCalled();
    });
    expect(onUnsupported).not.toHaveBeenCalled();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([false, undefined])(
    'invokes the callback when PRF support is %s',
    async (support: boolean | undefined) => {
      mockIsPasskeyPRFSupported.mockResolvedValue(support);
      const onUnsupported = jest.fn();

      renderHook(() => usePasskeyPRFSupport(onUnsupported));

      await waitFor(() => {
        expect(onUnsupported).toHaveBeenCalledTimes(1);
      });
    },
  );

  it('invokes the callback when capability detection fails', async () => {
    mockIsPasskeyPRFSupported.mockRejectedValue(new Error('detection failed'));
    const onUnsupported = jest.fn();

    renderHook(() => usePasskeyPRFSupport(onUnsupported));

    await waitFor(() => {
      expect(onUnsupported).toHaveBeenCalledTimes(1);
    });
  });
});

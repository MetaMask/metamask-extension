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

    renderHook(() => usePasskeyPRFSupport({ onUnsupported }));

    await waitFor(() => {
      expect(mockIsPasskeyPRFSupported).toHaveBeenCalled();
    });
    expect(onUnsupported).not.toHaveBeenCalled();
  });

  it('does not check PRF for an already registered passkey', async () => {
    const onUnsupported = jest.fn();

    renderHook(() => usePasskeyPRFSupport({ enabled: false, onUnsupported }));

    await Promise.resolve();
    expect(mockIsPasskeyPRFSupported).not.toHaveBeenCalled();
    expect(onUnsupported).not.toHaveBeenCalled();
  });

  it('invokes the callback when PRF support is false', async () => {
    mockIsPasskeyPRFSupported.mockResolvedValue(false);
    const onUnsupported = jest.fn();

    renderHook(() => usePasskeyPRFSupport({ onUnsupported }));

    await waitFor(() => {
      expect(onUnsupported).toHaveBeenCalledTimes(1);
    });
  });

  it('does not invoke the callback when PRF support is unknown', async () => {
    mockIsPasskeyPRFSupported.mockResolvedValue(undefined);
    const onUnsupported = jest.fn();

    renderHook(() => usePasskeyPRFSupport({ onUnsupported }));

    await Promise.resolve();
    expect(onUnsupported).not.toHaveBeenCalled();
  });

  it('does not invoke the callback when capability detection fails', async () => {
    mockIsPasskeyPRFSupported.mockRejectedValue(new Error('detection failed'));
    const onUnsupported = jest.fn();

    renderHook(() => usePasskeyPRFSupport({ onUnsupported }));

    await Promise.resolve();
    expect(onUnsupported).not.toHaveBeenCalled();
  });
});

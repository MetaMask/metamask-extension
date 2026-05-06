import { renderHook } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import { useEnsureMusdTokenRegistered } from './useEnsureMusdTokenRegistered';

const mockEnsureMusdTokenImportedForChain = jest.fn();

jest.mock('../../components/app/musd/utils', () => ({
  ensureMusdTokenImportedForChain: (...args: unknown[]) =>
    mockEnsureMusdTokenImportedForChain(...args),
}));

jest.mock('../../components/app/musd/constants', () => ({
  MUSD_TOKEN_ADDRESS_BY_CHAIN: {
    '0x1': '0xaaa',
    '0xe708': '0xbbb',
  },
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

describe('useEnsureMusdTokenRegistered', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    mockEnsureMusdTokenImportedForChain.mockResolvedValue(undefined);
  });

  it('registers mUSD for all supported chains when flow is enabled', async () => {
    (useSelector as jest.Mock).mockReturnValue(true);

    renderHook(() => useEnsureMusdTokenRegistered());

    // Allow async effect to complete
    await new Promise(process.nextTick);

    expect(mockEnsureMusdTokenImportedForChain).toHaveBeenCalledTimes(2);
    expect(mockEnsureMusdTokenImportedForChain).toHaveBeenCalledWith(
      '0x1',
      mockDispatch,
    );
    expect(mockEnsureMusdTokenImportedForChain).toHaveBeenCalledWith(
      '0xe708',
      mockDispatch,
    );
  });

  it('does not register mUSD when flow is disabled', async () => {
    (useSelector as jest.Mock).mockReturnValue(false);

    renderHook(() => useEnsureMusdTokenRegistered());

    await new Promise(process.nextTick);

    expect(mockEnsureMusdTokenImportedForChain).not.toHaveBeenCalled();
  });

  it('continues registering remaining chains when one fails', async () => {
    (useSelector as jest.Mock).mockReturnValue(true);
    jest.spyOn(console, 'warn').mockImplementation();

    mockEnsureMusdTokenImportedForChain
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(undefined);

    renderHook(() => useEnsureMusdTokenRegistered());

    await new Promise(process.nextTick);

    expect(mockEnsureMusdTokenImportedForChain).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[mUSD] Failed to register'),
      expect.any(Error),
    );
    (console.warn as jest.Mock).mockRestore();
  });
});

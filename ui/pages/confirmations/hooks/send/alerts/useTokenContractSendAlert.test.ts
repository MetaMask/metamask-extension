import { renderHook } from '@testing-library/react-hooks';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useSendContext } from '../../../context/send';
import { useSendType } from '../useSendType';
import { getTokenStandardAndDetailsByChain } from '../../../../../store/actions';
import { useTokenContractSendAlert } from './useTokenContractSendAlert';

jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../context/send');
jest.mock('../useSendType');
jest.mock('../../../../../store/actions', () => ({
  getTokenStandardAndDetailsByChain: jest.fn(),
}));

describe('useTokenContractSendAlert', () => {
  const mockT = jest.fn((key: string) => key);
  const mockUseSendContext = jest.mocked(useSendContext);
  const mockUseSendType = jest.mocked(useSendType);
  const mockGetTokenStandard = jest.mocked(getTokenStandardAndDetailsByChain);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useI18nContext).mockReturnValue(mockT);
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
      isBitcoinSendType: false,
      isTronSendType: false,
      isNonEvmSendType: false,
    } as ReturnType<typeof useSendType>);
    mockUseSendContext.mockReturnValue({
      to: '0xdB055877e6c13b6A6B25aBcAA29B393777dD0a73',
      chainId: '0x1',
      asset: { address: '0xAsset' },
    } as unknown as ReturnType<typeof useSendContext>);
    mockGetTokenStandard.mockResolvedValue({} as never);
  });

  it('returns null when there is no recipient', () => {
    mockUseSendContext.mockReturnValue({
      to: undefined,
      chainId: '0x1',
      asset: { address: '0xAsset' },
    } as unknown as ReturnType<typeof useSendContext>);

    const { result } = renderHook(() => useTokenContractSendAlert());

    expect(result.current).toBeNull();
  });

  it('returns null when send type is not EVM', () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: false,
      isSolanaSendType: true,
      isBitcoinSendType: false,
      isTronSendType: false,
      isNonEvmSendType: true,
    } as ReturnType<typeof useSendType>);

    const { result } = renderHook(() => useTokenContractSendAlert());

    expect(result.current).toBeNull();
  });

  it('returns alert when address is a token contract', async () => {
    mockGetTokenStandard.mockResolvedValue({ standard: 'ERC20' } as never);

    const { result, waitForNextUpdate } = renderHook(() =>
      useTokenContractSendAlert(),
    );

    await waitForNextUpdate();

    expect(result.current).toStrictEqual({
      key: 'tokenContract',
      title: 'smartContractAddress',
      message: 'smartContractAddressWarning',
    });
  });

  it('returns null when address is not a token contract', async () => {
    mockGetTokenStandard.mockResolvedValue({} as never);

    const { result, waitForNextUpdate } = renderHook(() =>
      useTokenContractSendAlert(),
    );

    // Wait for the async check to settle
    try {
      await waitForNextUpdate({ timeout: 100 });
    } catch {
      // No update expected - that's fine
    }

    expect(result.current).toBeNull();
  });

  it('resets when recipient changes', async () => {
    mockGetTokenStandard.mockResolvedValue({ standard: 'ERC20' } as never);

    const { result, waitForNextUpdate, rerender } = renderHook(() =>
      useTokenContractSendAlert(),
    );

    await waitForNextUpdate();
    expect(result.current).not.toBeNull();

    mockGetTokenStandard.mockResolvedValue({} as never);
    mockUseSendContext.mockReturnValue({
      to: '0xNewAddress1234567890abcdef12345678',
      chainId: '0x1',
      asset: { address: '0xAsset' },
    } as unknown as ReturnType<typeof useSendContext>);

    rerender();

    try {
      await waitForNextUpdate({ timeout: 100 });
    } catch {
      // No update expected - that's fine
    }

    expect(result.current).toBeNull();
  });
});

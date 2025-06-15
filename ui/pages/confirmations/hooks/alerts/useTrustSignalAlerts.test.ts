import { TransactionMeta } from '@metamask/transaction-controller';
import { Severity } from '../../../../helpers/constants/design-system';
import { useTrustSignalAlerts } from './useTrustSignalAlerts';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';

jest.mock('../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../hooks/useTrustSignals', () => ({
  useTrustSignals: jest.fn(),
  TrustSignalDisplayState: {
    Malicious: 'malicious',
    Warning: 'warning',
    Verified: 'verified',
    Unknown: 'unknown',
  },
}));

describe('useTrustSignalAlerts', () => {
  const mockT = jest.fn((key) => key);
  const mockUseConfirmContext = jest.requireMock(
    '../../context/confirm',
  ).useConfirmContext;
  const mockUseI18nContext = jest.requireMock(
    '../../../../hooks/useI18nContext',
  ).useI18nContext;
  const mockUseTrustSignals = jest.requireMock(
    '../../../../hooks/useTrustSignals',
  ).useTrustSignals;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue(mockT);
  });

  it('returns empty array when there is no current confirmation', () => {
    mockUseConfirmContext.mockReturnValue({ currentConfirmation: null });
    mockUseTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Unknown,
      trustLabel: null,
    });

    const { result } = renderHook(() => useTrustSignalAlerts());

    expect(result.current).toEqual([]);
  });

  it('returns malicious alert when trust signal state is malicious', () => {
    const mockConfirmation = {
      id: '123',
      chainId: '0x1',
      txParams: {
        to: '0xmalicious',
        from: '0xuser',
      },
    } as unknown as TransactionMeta;

    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: mockConfirmation,
    });

    mockUseTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Malicious,
      trustLabel: 'This address has been flagged as malicious',
    });

    const { result } = renderHook(() => useTrustSignalAlerts());

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      actions: [],
      field: RowAlertKey.InteractingWith,
      isBlocking: false,
      key: 'trustSignalMalicious',
      message: 'This address has been flagged as malicious',
      reason: 'Malicious address',
      severity: Severity.Danger,
    });
  });

  it('returns warning alert when trust signal state is warning', () => {
    const mockConfirmation = {
      id: '123',
      chainId: '0x1',
      txParams: {
        to: '0xwarning',
        from: '0xuser',
      },
    } as unknown as TransactionMeta;

    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: mockConfirmation,
    });

    mockUseTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Warning,
      trustLabel: 'Suspicious activity detected',
    });

    const { result } = renderHook(() => useTrustSignalAlerts());

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      actions: [],
      field: RowAlertKey.InteractingWith,
      isBlocking: false,
      key: 'trustSignalWarning',
      message: 'Suspicious activity detected',
      reason: 'Suspicious address',
      severity: Severity.Warning,
    });
  });

  it('returns empty array when trust signal state is neither malicious nor warning', () => {
    const mockConfirmation = {
      id: '123',
      chainId: '0x1',
      txParams: {
        to: '0xsafe',
        from: '0xuser',
      },
    } as unknown as TransactionMeta;

    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: mockConfirmation,
    });

    mockUseTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Verified,
      trustLabel: null,
    });

    const { result } = renderHook(() => useTrustSignalAlerts());

    expect(result.current).toEqual([]);
  });

  it('uses default message when trustLabel is not provided', () => {
    const mockConfirmation = {
      id: '123',
      chainId: '0x1',
      txParams: {
        to: '0xmalicious',
        from: '0xuser',
      },
    } as unknown as TransactionMeta;

    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: mockConfirmation,
    });

    mockUseTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Malicious,
      trustLabel: null,
    });

    const { result } = renderHook(() => useTrustSignalAlerts());

    expect(result.current).toHaveLength(1);
    expect(result.current[0].message).toEqual(
      'If you confirm this request, you will probably lose your assets to a scammer. ',
    );
  });

  it('checks verifying contract for signature requests', () => {
    const mockSignatureRequest = {
      id: '123',
      chainId: '0x1',
      msgParams: {
        data: JSON.stringify({
          domain: {
            verifyingContract: '0xverifyingContract',
          },
        }),
      },
    };

    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: mockSignatureRequest,
    });

    mockUseTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Warning,
      trustLabel: 'Warning for verifying contract',
    });

    const { result } = renderHook(() => useTrustSignalAlerts());

    expect(mockUseTrustSignals).toHaveBeenCalledWith(
      '0xverifyingContract',
      expect.any(Number),
      '0x1',
      true,
    );
    expect(result.current).toHaveLength(1);
  });

  it('checks verifying contract for ERC721Order signature request', () => {
    const mockOrderSignatureRequest = {
      id: '123',
      chainId: '0x1',
      type: 'eth_signTypedData',
      msgParams: {
        data: JSON.stringify({
          types: {
            Order: [
              { type: 'uint8', name: 'direction' },
              { type: 'address', name: 'maker' },
              { type: 'address', name: 'taker' },
              { type: 'uint256', name: 'expiry' },
              { type: 'uint256', name: 'nonce' },
              { type: 'address', name: 'erc20Token' },
              { type: 'uint256', name: 'erc20TokenAmount' },
              { type: 'Fee[]', name: 'fees' },
              { type: 'address', name: 'erc721Token' },
              { type: 'uint256', name: 'erc721TokenId' },
              { type: 'Property[]', name: 'erc721TokenProperties' },
            ],
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
              { name: 'verifyingContract', type: 'address' },
            ],
          },
          domain: {
            name: 'ZeroEx',
            version: '1.0.0',
            chainId: '0x1',
            verifyingContract: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
          },
          primaryType: 'Order',
          message: {
            direction: '0',
            maker: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            taker: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            expiry: '2524604400',
            nonce:
              '100131415900000000000000000000000000000083840314483690155566137712510085002484',
            erc20Token: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            erc20TokenAmount: '42000000000000',
            fees: [],
            erc721Token: '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e',
            erc721TokenId: '2516',
            erc721TokenProperties: [],
          },
        }),
        from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
        version: 'V4',
        signatureMethod: 'eth_signTypedData_v4',
        origin: 'https://metamask.github.io',
      },
    };

    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: mockOrderSignatureRequest,
    });

    mockUseTrustSignals.mockReturnValue({
      state: TrustSignalDisplayState.Malicious,
      trustLabel: 'Malicious exchange contract',
    });

    const { result } = renderHook(() => useTrustSignalAlerts());

    expect(mockUseTrustSignals).toHaveBeenCalledWith(
      '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      expect.any(Number),
      '0x1',
      true,
    );
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      actions: [],
      field: RowAlertKey.InteractingWith,
      isBlocking: false,
      key: 'trustSignalMalicious',
      message: 'Malicious exchange contract',
      reason: 'Malicious address',
      severity: Severity.Danger,
    });
  });
});

// Helper to render hooks
import { renderHook } from '@testing-library/react-hooks';

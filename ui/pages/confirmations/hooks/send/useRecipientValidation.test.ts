import { AddressResolution } from '@metamask/snaps-sdk';
import { waitFor } from '@testing-library/react';

import mockState from '../../../../../test/data/mock-state.json';
import { EVM_ASSET, SOLANA_ASSET } from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import * as SnapNameResolution from '../../../../hooks/snaps/useSnapNameResolution';
import { useSendContext } from '../../context/send';
import * as SendValidationUtils from '../../utils/sendValidations';
import { useSendType } from './useSendType';
import { useRecipientValidation } from './useRecipientValidation';

jest.mock('../../../../hooks/useI18nContext');
jest.mock('../../context/send');
jest.mock('./useSendType');

describe('useRecipientValidation', () => {
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockUseSendContext = jest.mocked(useSendContext);
  const mockUseSendType = jest.mocked(useSendType);

  const mockT = jest.fn((key) => key);

  function renderHook() {
    return renderHookWithProvider(useRecipientValidation, mockState);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue(mockT);
    mockUseSendContext.mockReturnValue({
      to: '0xdB055877e6c13b6A6B25aBcAA29B393777dD0a73',
      chainId: '0x1',
      from: '',
      updateAsset: jest.fn(),
      updateCurrentPage: jest.fn(),
      updateTo: jest.fn(),
      updateValue: jest.fn(),
      value: '',
    } as unknown as ReturnType<typeof useSendContext>);
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);
  });

  it('returns recipient validation functions and state', () => {
    const { result } = renderHook();

    expect(result.current).toEqual({
      recipientConfusableCharacters: undefined,
      recipientError: undefined,
      recipientWarning: undefined,
      recipientResolvedLookup: undefined,
      recipientValidationLoading: true,
      toAddressValidated: undefined,
    });
  });

  it('translates error messages', async () => {
    mockUseSendContext.mockReturnValue({
      asset: EVM_ASSET,
      to: '0x123',
      chainId: '0x1',
      from: '',
      updateAsset: jest.fn(),
      updateCurrentPage: jest.fn(),
      updateTo: jest.fn(),
      updateValue: jest.fn(),
      value: '',
    } as unknown as ReturnType<typeof useSendContext>);

    const { result } = renderHook();

    await waitFor(() => {
      expect(result.current).toEqual({
        recipientConfusableCharacters: undefined,
        recipientError: 'invalidAddress',
        recipientResolvedLookup: undefined,
        recipientValidationLoading: false,
        recipientWarning: undefined,
        toAddressValidated: '0x123',
      });
      expect(mockT).toHaveBeenCalledWith('invalidAddress');
    });
  });

  it('translates warning messages', async () => {
    mockUseSendContext.mockReturnValue({
      asset: EVM_ASSET,
      to: 'exаmple.eth',
      chainId: '0x1',
    } as unknown as ReturnType<typeof useSendContext>);

    jest.spyOn(SnapNameResolution, 'useSnapNameResolution').mockReturnValue({
      loading: false,
      results: [{ resolvedAddress: '0x123' } as AddressResolution],
    });

    jest
      .spyOn(SendValidationUtils, 'findConfusablesInRecipient')
      .mockReturnValue({
        confusableCharacters: [
          { point: 'а', similarTo: 'a' },
          { point: 'е', similarTo: 'e' },
        ],
        warning: 'confusingDomain',
      });

    const { result } = renderHook();

    await waitFor(() => {
      expect(result.current.recipientWarning).toEqual('confusingDomain');
      expect(mockT).toHaveBeenLastCalledWith('confusingDomain');
    });
  });

  it('returns resolved lookup when available', async () => {
    mockUseSendContext.mockReturnValue({
      asset: EVM_ASSET,
      to: 'test.eth',
      chainId: '0x1',
    } as unknown as ReturnType<typeof useSendContext>);

    jest.spyOn(SnapNameResolution, 'useSnapNameResolution').mockReturnValue({
      loading: false,
      results: [{ resolvedAddress: '0x123' } as AddressResolution],
    });

    const { result } = renderHook();

    await waitFor(() => {
      expect(result.current.recipientResolvedLookup).toBe('0x123');
    });
  });

  it('returns confusable characters when available', async () => {
    mockUseSendContext.mockReturnValue({
      asset: EVM_ASSET,
      to: 'exаmple.eth',
      chainId: '0x1',
    } as unknown as ReturnType<typeof useSendContext>);

    jest.spyOn(SnapNameResolution, 'useSnapNameResolution').mockReturnValue({
      loading: false,
      results: [{ resolvedAddress: '0x123' } as AddressResolution],
    });

    jest
      .spyOn(SendValidationUtils, 'findConfusablesInRecipient')
      .mockReturnValue({
        confusableCharacters: [
          { point: 'а', similarTo: 'a' },
          { point: 'е', similarTo: 'e' },
        ],
        warning: 'confusingDomain',
      });

    const { result } = renderHook();

    await waitFor(() => {
      expect(result.current.recipientConfusableCharacters).toEqual([
        { point: 'а', similarTo: 'a' },
        { point: 'е', similarTo: 'e' },
      ]);
    });
  });

  it('returns empty result for empty address', async () => {
    mockUseSendContext.mockReturnValue({
      asset: EVM_ASSET,
      to: '',
      chainId: '0x1',
    } as unknown as ReturnType<typeof useSendContext>);

    const { result } = renderHook();

    await waitFor(() => {
      expect(result.current).toEqual({
        recipientConfusableCharacters: undefined,
        recipientError: undefined,
        recipientResolvedLookup: undefined,
        recipientValidationLoading: false,
        recipientWarning: undefined,
        toAddressValidated: undefined,
      });
    });
  });

  it('returns empty result for undefined address', async () => {
    mockUseSendContext.mockReturnValue({
      asset: EVM_ASSET,
      to: undefined,
      chainId: '0x1',
    } as unknown as ReturnType<typeof useSendContext>);

    const { result } = renderHook();

    await waitFor(() => {
      expect(result.current).toEqual({
        recipientConfusableCharacters: undefined,
        recipientError: undefined,
        recipientResolvedLookup: undefined,
        recipientValidationLoading: false,
        recipientWarning: undefined,
        toAddressValidated: undefined,
      });
    });
  });

  it('validate hex value for EVM send type', async () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);

    const mockValidateHexAddress = jest
      .spyOn(SendValidationUtils, 'validateEvmHexAddress')
      .mockResolvedValue({
        error: 'invalidAddress',
      });

    const { result } = renderHook();

    await waitFor(() => {
      expect(mockValidateHexAddress).toHaveBeenCalled();
      expect(result.current.recipientError).toEqual('invalidAddress');
    });
  });

  it('validate solana address for Solana send type', async () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: false,
      isSolanaSendType: true,
    } as unknown as ReturnType<typeof useSendType>);

    mockUseSendContext.mockReturnValue({
      asset: SOLANA_ASSET,
      to: 'H8UekPGwePSmQ3ttuYGPU1sxKnk7K3SR4VBGp5dAEwQs',
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    } as unknown as ReturnType<typeof useSendContext>);

    jest.spyOn(SnapNameResolution, 'useSnapNameResolution').mockReturnValue({
      loading: false,
      results: [],
    });

    const mockValidateSolanaAddress = jest
      .spyOn(SendValidationUtils, 'validateSolanaAddress')
      .mockReturnValue({
        error: 'invalidAddress',
      });

    const { result } = renderHook();

    await waitFor(() => {
      expect(mockValidateSolanaAddress).toHaveBeenCalled();
      expect(result.current.recipientError).toEqual('invalidAddress');
    });
  });
});

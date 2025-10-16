import { waitFor } from '@testing-library/react';

import mockState from '../../../../../test/data/mock-state.json';
import {
  BITCOIN_ASSET,
  EVM_ASSET,
  SOLANA_ASSET,
} from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useSendContext } from '../../context/send';
import * as SendValidationUtils from '../../utils/sendValidations';
import * as NameValidation from './useNameValidation';
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
        recipientWarning: undefined,
        toAddressValidated: '0x123',
      });
      expect(mockT).toHaveBeenCalledWith('invalidAddress');
    });
  });

  it('returns resolved lookup when available', async () => {
    mockUseSendContext.mockReturnValue({
      asset: EVM_ASSET,
      to: 'test.eth',
      chainId: '0x1',
    } as unknown as ReturnType<typeof useSendContext>);

    jest.spyOn(NameValidation, 'useNameValidation').mockReturnValue({
      validateName: () =>
        Promise.resolve({ resolvedLookup: '0x123', protocol: 'ens' }),
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

    jest.spyOn(NameValidation, 'useNameValidation').mockReturnValue({
      validateName: () =>
        Promise.resolve({
          resolvedLookup: '0x123',
          confusableCharacters: [
            { point: 'а', similarTo: 'a' },
            { point: 'е', similarTo: 'e' },
          ],
          protocol: 'ens',
        }),
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
        recipientWarning: undefined,
        toAddressValidated: '',
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

    jest.spyOn(NameValidation, 'useNameValidation').mockReturnValue({
      validateName: () =>
        Promise.resolve({
          error: 'nameResolutionFailedError',
        }),
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

  it('validate bitcoin address for Bitcoin send type', async () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: false,
      isSolanaSendType: false,
      isBitcoinSendType: true,
    } as unknown as ReturnType<typeof useSendType>);

    mockUseSendContext.mockReturnValue({
      asset: BITCOIN_ASSET,
      to: 'bc1qux5pw7w5cjjs375at0c8j96le7nuky693uj3rm',
      chainId: 'bip122:000000000019d6689c085ae165831e93',
    } as unknown as ReturnType<typeof useSendContext>);

    jest.spyOn(NameValidation, 'useNameValidation').mockReturnValue({
      validateName: () =>
        Promise.resolve({
          error: 'nameResolutionFailedError',
        }),
    });

    const mockValidateBtcAddress = jest
      .spyOn(SendValidationUtils, 'validateBtcAddress')
      .mockReturnValue({
        error: 'invalidAddress',
      });

    const { result } = renderHook();

    await waitFor(() => {
      expect(mockValidateBtcAddress).toHaveBeenCalled();
      expect(result.current.recipientError).toEqual('invalidAddress');
    });
  });
});

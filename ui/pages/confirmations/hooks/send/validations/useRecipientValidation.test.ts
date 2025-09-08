import { act } from '@testing-library/react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useAsyncResult } from '../../../../../hooks/useAsync';
import { useSendContext } from '../../../context/send';
import { useSendType } from '../useSendType';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import { useEvmRecipientValidation } from './useEvmRecipientValidation';
import { useSolanaRecipientValidation } from './useSolanaRecipientValidation';
import { useRecipientValidation } from './useRecipientValidation';

jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../../../hooks/useAsync');
jest.mock('../../../context/send');
jest.mock('../useSendType');
jest.mock('./useEvmRecipientValidation');
jest.mock('./useSolanaRecipientValidation');

describe('useRecipientValidation', () => {
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockUseAsyncResult = jest.mocked(useAsyncResult);
  const mockUseSendContext = jest.mocked(useSendContext);
  const mockUseSendType = jest.mocked(useSendType);
  const mockUseEvmRecipientValidation = jest.mocked(useEvmRecipientValidation);
  const mockUseSolanaRecipientValidation = jest.mocked(
    useSolanaRecipientValidation,
  );

  const mockT = jest.fn((key) => key);
  const mockValidateEvmRecipient = jest.fn();
  const mockValidateSolanaRecipient = jest.fn();

  function renderHook() {
    return renderHookWithProvider(useRecipientValidation, mockState);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue(mockT);
    mockUseSendContext.mockReturnValue({
      to: '',
      chainId: '0x1',
      from: '',
      updateAsset: jest.fn(),
      updateCurrentPage: jest.fn(),
      updateTo: jest.fn(),
      updateToResolvedLookup: jest.fn(),
      updateValue: jest.fn(),
      value: '',
    } as unknown as ReturnType<typeof useSendContext>);
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);
    mockUseEvmRecipientValidation.mockReturnValue({
      validateEvmRecipient: mockValidateEvmRecipient,
      isLookupLoading: false,
    });
    mockUseSolanaRecipientValidation.mockReturnValue({
      validateSolanaRecipient: mockValidateSolanaRecipient,
      isLookupLoading: false,
    });
    mockUseAsyncResult.mockReturnValue({
      value: null,
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useAsyncResult>);
  });

  it('returns recipient validation functions and state', () => {
    const { result } = renderHook();

    expect(result.current).toEqual({
      recipientError: null,
      recipientWarning: null,
      recipientResolvedLookup: undefined,
      recipientConfusableCharacters: [],
      validateRecipient: expect.any(Function),
    });
  });

  it('translates error messages', () => {
    mockUseAsyncResult.mockReturnValue({
      value: {
        error: 'invalidAddress',
        warning: null,
        resolvedLookup: null,
        confusableCharacters: [],
      },
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useAsyncResult>);

    const { result } = renderHook();

    expect(mockT).toHaveBeenCalledWith('invalidAddress');
    expect(result.current.recipientError).toBe('invalidAddress');
  });

  it('translates warning messages', () => {
    mockUseAsyncResult.mockReturnValue({
      value: {
        error: null,
        warning: 'warningMessage',
        resolvedLookup: null,
        confusableCharacters: [],
      },
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useAsyncResult>);

    const { result } = renderHook();

    expect(mockT).toHaveBeenCalledWith('warningMessage');
    expect(result.current.recipientWarning).toBe('warningMessage');
  });

  it('returns resolved lookup when available', () => {
    const mockResolvedLookup = { resolvedAddress: '0x123' };
    mockUseAsyncResult.mockReturnValue({
      value: {
        error: null,
        warning: null,
        resolvedLookup: mockResolvedLookup,
        confusableCharacters: [],
      },
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useAsyncResult>);

    const { result } = renderHook();

    expect(result.current.recipientResolvedLookup).toBe(mockResolvedLookup);
  });

  it('returns confusable characters when available', () => {
    const mockConfusableCharacters = ['а', 'e'];
    mockUseAsyncResult.mockReturnValue({
      value: {
        error: null,
        warning: null,
        resolvedLookup: null,
        confusableCharacters: mockConfusableCharacters,
      },
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useAsyncResult>);

    const { result } = renderHook();

    expect(result.current.recipientConfusableCharacters).toBe(
      mockConfusableCharacters,
    );
  });

  describe('validateRecipient', () => {
    it('returns empty result for empty address', async () => {
      const { result } = renderHook();

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateRecipient('');
      });

      expect(validationResult).toEqual({
        error: null,
        resolvedLookup: null,
        warning: null,
      });
    });

    it('returns empty result for undefined address', async () => {
      const { result } = renderHook();

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateRecipient(undefined);
      });

      expect(validationResult).toEqual({
        error: null,
        resolvedLookup: null,
        warning: null,
      });
    });

    it('uses EVM validation for EVM send type', async () => {
      mockValidateEvmRecipient.mockResolvedValue({
        error: 'invalidAddress',
        resolvedLookup: null,
        warning: null,
      });

      const { result } = renderHook();

      await act(async () => {
        await result.current.validateRecipient('0x123');
      });

      expect(mockValidateEvmRecipient).toHaveBeenCalledWith('0x123', '0x1');
      expect(mockValidateSolanaRecipient).not.toHaveBeenCalled();
    });

    it('uses Solana validation for Solana send type', async () => {
      mockUseSendType.mockReturnValue({
        isEvmSendType: false,
        isSolanaSendType: true,
      } as unknown as ReturnType<typeof useSendType>);
      mockValidateSolanaRecipient.mockResolvedValue({
        error: null,
        resolvedLookup: null,
        warning: null,
      });

      const { result } = renderHook();

      await act(async () => {
        await result.current.validateRecipient(
          'H8UekPGwePSmQ3ttuYGPU1sxKnk7K3SR4VBGp5dAEwQs',
        );
      });

      expect(mockValidateSolanaRecipient).toHaveBeenCalledWith(
        'H8UekPGwePSmQ3ttuYGPU1sxKnk7K3SR4VBGp5dAEwQs',
        '0x1',
      );
      expect(mockValidateEvmRecipient).not.toHaveBeenCalled();
    });

    it('returns empty result for unknown send type', async () => {
      mockUseSendType.mockReturnValue({
        isEvmSendType: false,
        isSolanaSendType: false,
      } as unknown as ReturnType<typeof useSendType>);

      const { result } = renderHook();

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateRecipient('address');
      });

      expect(validationResult).toEqual({
        confusableCharacters: [],
        error: null,
        resolvedLookup: null,
        warning: null,
      });
      expect(mockValidateEvmRecipient).not.toHaveBeenCalled();
      expect(mockValidateSolanaRecipient).not.toHaveBeenCalled();
    });

    it('normalizes validation result', async () => {
      mockValidateEvmRecipient.mockResolvedValue({
        error: 'invalidAddress',
        resolvedLookup: { resolvedAddress: '0x456' },
        warning: 'warningMessage',
        confusableCharacters: ['а'],
      });

      const { result } = renderHook();

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateRecipient('0x123');
      });

      expect(validationResult).toEqual({
        error: 'invalidAddress',
        resolvedLookup: { resolvedAddress: '0x456' },
        warning: 'warningMessage',
        confusableCharacters: ['а'],
      });
    });

    it('handles partial validation results', async () => {
      mockValidateEvmRecipient.mockResolvedValue({
        error: undefined,
        warning: undefined,
      });

      const { result } = renderHook();

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateRecipient('0x123');
      });

      expect(validationResult).toEqual({
        error: null,
        resolvedLookup: null,
        warning: null,
        confusableCharacters: [],
      });
    });

    it('clears cache when send type changes', async () => {
      mockValidateEvmRecipient.mockResolvedValue({
        error: null,
        resolvedLookup: null,
        warning: null,
      });

      const { result, rerender } = renderHook();

      await act(async () => {
        await result.current.validateRecipient('0x123');
      });

      mockUseSendType.mockReturnValue({
        isEvmSendType: false,
        isSolanaSendType: true,
      } as unknown as ReturnType<typeof useSendType>);
      mockValidateSolanaRecipient.mockResolvedValue({
        error: null,
        resolvedLookup: null,
        warning: null,
      });

      rerender();

      await act(async () => {
        await result.current.validateRecipient('0x123');
      });

      expect(mockValidateSolanaRecipient).toHaveBeenCalledWith('0x123', '0x1');
    });

    it('clears cache when chainId changes', async () => {
      mockValidateEvmRecipient.mockResolvedValue({
        error: null,
        resolvedLookup: null,
        warning: null,
      });

      const { result, rerender } = renderHook();

      await act(async () => {
        await result.current.validateRecipient('0x123');
      });

      mockUseSendContext.mockReturnValue({
        to: '',
        chainId: '0x89',
      } as unknown as ReturnType<typeof useSendContext>);

      rerender();

      await act(async () => {
        await result.current.validateRecipient('0x123');
      });

      expect(mockValidateEvmRecipient).toHaveBeenCalledTimes(2);
      expect(mockValidateEvmRecipient).toHaveBeenLastCalledWith(
        '0x123',
        '0x89',
      );
    });
  });
});

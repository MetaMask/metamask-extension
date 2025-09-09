import { act } from '@testing-library/react';
import { isSolanaAddress } from '../../../../../../shared/lib/multichain/accounts';
import { isValidHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { isValidDomainName } from '../../../../../helpers/utils/util';
import { useSnapNameResolution } from '../../../../../hooks/snaps/useSnapNameResolution';
import { validateDomainWithConfusables } from '../../../utils/sendValidations';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import { useSolanaRecipientValidation } from './useSolanaRecipientValidation';

jest.mock('../../../../../../shared/lib/multichain/accounts');
jest.mock('../../../../../../shared/modules/hexstring-utils', () => ({
  ...jest.requireActual('../../../../../../shared/modules/hexstring-utils'),
  isValidHexAddress: jest.fn(),
}));
jest.mock('../../../../../helpers/utils/util', () => ({
  ...jest.requireActual('../../../../../helpers/utils/util'),
  isValidDomainName: jest.fn(),
}));
jest.mock('../../../../../hooks/snaps/useSnapNameResolution');
jest.mock('../../../utils/sendValidations');

describe('useSolanaRecipientValidation', () => {
  const mockIsSolanaAddress = jest.mocked(isSolanaAddress);
  const mockIsValidHexAddress = jest.mocked(isValidHexAddress);
  const mockIsValidDomainName = jest.mocked(isValidDomainName);
  const mockUseSnapNameResolution = jest.mocked(useSnapNameResolution);
  const mockValidateDomainWithConfusables = jest.mocked(
    validateDomainWithConfusables,
  );

  const mockResolveNameLookup = jest.fn();

  function renderHook() {
    return renderHookWithProvider(useSolanaRecipientValidation, mockState);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSnapNameResolution.mockReturnValue({
      lookupDomainAddresses: mockResolveNameLookup,
    });
  });

  describe('validateSolanaRecipient', () => {
    it('returns error for burn addresses', async () => {
      mockIsSolanaAddress.mockReturnValue(true);
      const { result } = renderHook();

      const burnAddress = '1nc1nerator11111111111111111111111111111111';
      let validationResult;
      await act(async () => {
        validationResult =
          await result.current.validateSolanaRecipient(burnAddress);
      });

      expect(validationResult).toEqual({
        error: 'invalidAddress',
        isLookupLoading: false,
      });
    });

    it('returns error for another burn address', async () => {
      mockIsSolanaAddress.mockReturnValue(true);
      const { result } = renderHook();

      const burnAddress = 'So11111111111111111111111111111111111111112';
      let validationResult;
      await act(async () => {
        validationResult =
          await result.current.validateSolanaRecipient(burnAddress);
      });

      expect(validationResult).toEqual({
        error: 'invalidAddress',
        isLookupLoading: false,
      });
    });

    it('returns success for valid Solana address', async () => {
      mockIsSolanaAddress.mockReturnValue(true);
      const { result } = renderHook();

      const validAddress = 'H8UekPGwePSmQ3ttuYGPU1sxKnk7K3SR4VBGp5dAEwQs';
      let validationResult;
      await act(async () => {
        validationResult =
          await result.current.validateSolanaRecipient(validAddress);
      });

      expect(validationResult).toEqual({
        error: null,
        resolvedLookup: null,
        warning: null,
        isLookupLoading: false,
      });
    });

    it('returns error for invalid Solana address', async () => {
      mockIsSolanaAddress.mockReturnValue(false);
      mockIsValidDomainName.mockReturnValue(false);
      const { result } = renderHook();

      const invalidAddress = 'invalid-address';
      let validationResult;
      await act(async () => {
        validationResult =
          await result.current.validateSolanaRecipient(invalidAddress);
      });

      expect(validationResult).toEqual({
        error: 'invalidAddress',
        isLookupLoading: false,
      });
    });

    it('validates domain names', async () => {
      mockIsSolanaAddress.mockReturnValue(false);
      mockIsValidDomainName.mockReturnValue(true);
      mockIsValidHexAddress.mockReturnValue(false);
      mockValidateDomainWithConfusables.mockResolvedValue({
        error: null,
        resolvedLookup: {
          resolvedAddress: 'H8UekPGwePSmQ3ttuYGPU1sxKnk7K3SR4VBGp5dAEwQs',
        } as never,
      });

      const { result } = renderHook();
      const domainAddress = 'example.sol';

      let validationResult;
      await act(async () => {
        validationResult =
          await result.current.validateSolanaRecipient(domainAddress);
      });

      expect(mockValidateDomainWithConfusables).toHaveBeenCalledWith(
        domainAddress,
        expect.objectContaining({
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          lookupDomainAddresses: mockResolveNameLookup,
          errorMessages: {
            unknownError: 'solanaUnknownError',
            confusingDomain: 'confusingSolanaDomain',
          },
        }),
      );

      expect(validationResult).toEqual({
        error: null,
        resolvedLookup: {
          resolvedAddress: 'H8UekPGwePSmQ3ttuYGPU1sxKnk7K3SR4VBGp5dAEwQs',
        },
      });
    });

    it('handles domain validation errors', async () => {
      mockIsSolanaAddress.mockReturnValue(false);
      mockIsValidDomainName.mockReturnValue(true);
      mockValidateDomainWithConfusables.mockRejectedValue(
        new Error('Network error'),
      );

      const { result } = renderHook();
      const domainAddress = 'example.sol';

      let validationResult;
      await act(async () => {
        validationResult =
          await result.current.validateSolanaRecipient(domainAddress);
      });

      expect(validationResult).toEqual({
        error: 'solanaUnknownError',
        isLookupLoading: false,
      });
    });

    it('uses custom chainId when provided', async () => {
      mockIsSolanaAddress.mockReturnValue(false);
      mockIsValidDomainName.mockReturnValue(true);
      mockValidateDomainWithConfusables.mockResolvedValue({
        error: null,
        resolvedLookup: null,
      });

      const { result } = renderHook();
      const customChainId = 'solana:custom';

      await act(async () => {
        await result.current.validateSolanaRecipient(
          'example.sol',
          customChainId,
        );
      });

      expect(mockValidateDomainWithConfusables).toHaveBeenCalledWith(
        'example.sol',
        expect.objectContaining({
          chainId: customChainId,
        }),
      );
    });
  });

  describe('isLookupLoading', () => {
    it('returns false initially', () => {
      const { result } = renderHook();
      expect(result.current.isLookupLoading).toBe(false);
    });

    it('sets loading state during domain validation', async () => {
      mockIsSolanaAddress.mockReturnValue(false);
      mockIsValidDomainName.mockReturnValue(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let resolveValidation: any;
      mockValidateDomainWithConfusables.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = resolve;
          }),
      );

      const { result } = renderHook();

      act(() => {
        result.current.validateSolanaRecipient('example.sol');
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isLookupLoading).toBe(true);

      act(() => {
        resolveValidation({ error: null });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isLookupLoading).toBe(false);
    });
  });
});

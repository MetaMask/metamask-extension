import { act } from '@testing-library/react';
import { isValidHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { isValidDomainName } from '../../../../../helpers/utils/util';
import {
  findNetworkClientIdByChainId,
  getERC721AssetSymbol,
} from '../../../../../store/actions';
import { useSnapNameResolution } from '../../../../../hooks/snaps/useSnapNameResolution';
import { validateDomainWithConfusables } from '../../../utils/sendValidations';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import { useEvmRecipientValidation } from './useEvmRecipientValidation';

jest.mock('../../../../../../shared/modules/hexstring-utils', () => ({
  ...jest.requireActual('../../../../../../shared/modules/hexstring-utils'),
  isValidHexAddress: jest.fn(),
}));
jest.mock('../../../../../helpers/utils/util', () => ({
  ...jest.requireActual('../../../../../helpers/utils/util'),
  isValidDomainName: jest.fn(),
}));
jest.mock('../../../../../store/actions', () => ({
  findNetworkClientIdByChainId: jest.fn(),
  getERC721AssetSymbol: jest.fn(),
}));
jest.mock('../../../../../hooks/snaps/useSnapNameResolution');
jest.mock('../../../utils/sendValidations');

describe('useEvmRecipientValidation', () => {
  const mockIsValidHexAddress = jest.mocked(isValidHexAddress);
  const mockIsValidDomainName = jest.mocked(isValidDomainName);
  const mockFindNetworkClientIdByChainId = jest.mocked(
    findNetworkClientIdByChainId,
  );
  const mockGetERC721AssetSymbol = jest.mocked(getERC721AssetSymbol);
  const mockUseSnapNameResolution = jest.mocked(useSnapNameResolution);
  const mockValidateDomainWithConfusables = jest.mocked(
    validateDomainWithConfusables,
  );

  const mockResolveNameLookup = jest.fn();

  function renderHook() {
    return renderHookWithProvider(useEvmRecipientValidation, mockState);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSnapNameResolution.mockReturnValue({
      lookupDomainAddresses: mockResolveNameLookup,
    });
    mockFindNetworkClientIdByChainId.mockResolvedValue(
      'networkClientId' as never,
    );
    mockGetERC721AssetSymbol.mockResolvedValue(null as never);
  });

  it('returns validation functions and loading state', () => {
    const { result } = renderHook();

    expect(result.current.validateEvmRecipient).toBeDefined();
  });

  it('validates valid hex address successfully', async () => {
    mockIsValidHexAddress.mockReturnValue(true);
    const { result } = renderHook();

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateEvmRecipient(
        '0x1234567890123456789012345678901234567890',
      );
    });

    expect(validationResult).toEqual({
      error: null,
      resolvedLookup: null,
      warning: null,
    });
  });

  it('rejects burn address', async () => {
    mockIsValidHexAddress.mockReturnValue(true);
    const { result } = renderHook();

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateEvmRecipient(
        '0x0000000000000000000000000000000000000000',
      );
    });

    expect(validationResult).toEqual({
      error: 'invalidAddress',
    });
  });

  it('rejects dead address', async () => {
    mockIsValidHexAddress.mockReturnValue(true);
    const { result } = renderHook();

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateEvmRecipient(
        '0x000000000000000000000000000000000000dead',
      );
    });

    expect(validationResult).toEqual({
      error: 'invalidAddress',
    });
  });

  it('rejects ERC721 token address', async () => {
    mockIsValidHexAddress.mockReturnValue(true);
    mockGetERC721AssetSymbol.mockResolvedValue('NFT' as never);
    const { result } = renderHook();

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateEvmRecipient(
        '0x1234567890123456789012345678901234567890',
        '0x1',
      );
    });

    expect(validationResult).toEqual({
      error: 'invalidAddress',
    });
    expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith('0x1');
    expect(mockGetERC721AssetSymbol).toHaveBeenCalledWith(
      '0x1234567890123456789012345678901234567890',
      'networkClientId',
    );
  });

  it('validates domain name successfully', async () => {
    mockIsValidHexAddress.mockReturnValue(false);
    mockIsValidDomainName.mockReturnValue(true);
    mockValidateDomainWithConfusables.mockResolvedValue({
      error: null,
      resolvedLookup: '0x1234567890123456789012345678901234567890',
      warning: null,
    });
    const { result } = renderHook();

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateEvmRecipient(
        'example.eth',
        '0x1',
      );
    });

    expect(validationResult).toEqual({
      error: null,
      resolvedLookup: '0x1234567890123456789012345678901234567890',
      warning: null,
    });
    expect(mockValidateDomainWithConfusables).toHaveBeenCalledWith(
      'example.eth',
      {
        chainId: '0x1',
        lookupDomainAddresses: mockResolveNameLookup,
        formatChainId: expect.any(Function),
        errorMessages: {
          unknownError: 'ensUnknownError',
          confusingDomain: 'confusingEnsDomain',
        },
      },
    );
  });

  it('handles domain validation error', async () => {
    mockIsValidHexAddress.mockReturnValue(false);
    mockIsValidDomainName.mockReturnValue(true);
    mockValidateDomainWithConfusables.mockRejectedValue(
      new Error('Network error'),
    );
    const { result } = renderHook();

    let validationResult;
    await act(async () => {
      validationResult =
        await result.current.validateEvmRecipient('example.eth');
    });

    expect(validationResult).toEqual({
      error: 'ensUnknownError',
    });
  });

  it('uses default chainId when not provided', async () => {
    mockIsValidHexAddress.mockReturnValue(false);
    mockIsValidDomainName.mockReturnValue(true);
    mockValidateDomainWithConfusables.mockResolvedValue({
      error: null,
      resolvedLookup: '0x1234567890123456789012345678901234567890',
      warning: null,
    });
    const { result } = renderHook();

    await act(async () => {
      await result.current.validateEvmRecipient('example.eth');
    });

    expect(mockValidateDomainWithConfusables).toHaveBeenCalledWith(
      'example.eth',
      expect.objectContaining({
        chainId: '0x1',
      }),
    );
  });

  it('formats chainId correctly', async () => {
    mockIsValidHexAddress.mockReturnValue(false);
    mockIsValidDomainName.mockReturnValue(true);
    mockValidateDomainWithConfusables.mockResolvedValue({
      error: null,
      resolvedLookup: '0x1234567890123456789012345678901234567890',
      warning: null,
    });
    const { result } = renderHook();

    await act(async () => {
      await result.current.validateEvmRecipient('example.eth', '0x89');
    });

    const options = mockValidateDomainWithConfusables.mock.calls[0][1];
    const formattedChainId = options.formatChainId
      ? options.formatChainId('0x89')
      : '0x89';
    expect(formattedChainId).toBe('eip155:137');
  });

  it('rejects invalid address', async () => {
    mockIsValidHexAddress.mockReturnValue(false);
    mockIsValidDomainName.mockReturnValue(false);
    const { result } = renderHook();

    let validationResult;
    await act(async () => {
      validationResult =
        await result.current.validateEvmRecipient('invalid-address');
    });

    expect(validationResult).toEqual({
      error: 'invalidAddress',
    });
  });
});

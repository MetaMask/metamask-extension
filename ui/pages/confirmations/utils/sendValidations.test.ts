// Unicode confusables is not typed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { confusables } from 'unicode-confusables';
import {
  validateDomainWithConfusables,
  DomainValidationOptions,
} from './sendValidations';

jest.mock('unicode-confusables');

describe('validateDomainWithConfusables', () => {
  const mockConfusables = jest.mocked(confusables);
  const mockLookupDomainAddresses = jest.fn();
  const mockFormatChainId = jest.fn();
  const mockFilterResolutions = jest.fn();

  const defaultOptions: DomainValidationOptions = {
    chainId: '0x1',
    lookupDomainAddresses: mockLookupDomainAddresses,
    errorMessages: {
      unknownError: 'Unknown error occurred',
      confusingDomain: 'Domain contains confusing characters',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLookupDomainAddresses.mockResolvedValue([
      { resolvedAddress: '0x123456789abcdef' },
    ]);
    mockConfusables.mockReturnValue([]);
  });

  it('returns successful validation when no confusables found', async () => {
    const result = await validateDomainWithConfusables(
      'example.eth',
      defaultOptions,
    );

    expect(result).toEqual({
      error: null,
      resolvedLookup: '0x123456789abcdef',
      warning: null,
    });
    expect(mockLookupDomainAddresses).toHaveBeenCalledWith(
      '0x1',
      'example.eth',
    );
  });

  it('returns error when no resolutions found', async () => {
    mockLookupDomainAddresses.mockResolvedValue([]);

    const result = await validateDomainWithConfusables(
      'example.eth',
      defaultOptions,
    );

    expect(result).toEqual({
      error: 'Unknown error occurred',
    });
  });

  it('returns error when resolutions is null', async () => {
    mockLookupDomainAddresses.mockResolvedValue(null);

    const result = await validateDomainWithConfusables(
      'example.eth',
      defaultOptions,
    );

    expect(result).toEqual({
      error: 'Unknown error occurred',
    });
  });

  it('uses formatChainId when provided', async () => {
    mockFormatChainId.mockReturnValue('1');
    const optionsWithFormatter = {
      ...defaultOptions,
      formatChainId: mockFormatChainId,
    };

    await validateDomainWithConfusables('example.eth', optionsWithFormatter);

    expect(mockFormatChainId).toHaveBeenCalledWith('0x1');
    expect(mockLookupDomainAddresses).toHaveBeenCalledWith('1', 'example.eth');
  });

  it('applies filterResolutions when provided', async () => {
    const filteredResults = [{ resolvedAddress: '0x987654321' }];
    mockLookupDomainAddresses.mockResolvedValue([
      { resolvedAddress: '0x123456789abcdef' },
      { resolvedAddress: '0x987654321' },
    ]);
    mockFilterResolutions.mockReturnValue(filteredResults);

    const optionsWithFilter = {
      ...defaultOptions,
      filterResolutions: mockFilterResolutions,
    };

    const result = await validateDomainWithConfusables(
      'example.eth',
      optionsWithFilter,
    );

    expect(mockFilterResolutions).toHaveBeenCalledWith([
      { resolvedAddress: '0x123456789abcdef' },
      { resolvedAddress: '0x987654321' },
    ]);
    expect(result.resolvedLookup).toBe('0x987654321');
  });

  it('returns error when filterResolutions returns empty array', async () => {
    mockLookupDomainAddresses.mockResolvedValue([
      { resolvedAddress: '0x123456789abcdef' },
    ]);
    mockFilterResolutions.mockReturnValue([]);

    const optionsWithFilter = {
      ...defaultOptions,
      filterResolutions: mockFilterResolutions,
    };

    const result = await validateDomainWithConfusables(
      'example.eth',
      optionsWithFilter,
    );

    expect(result).toEqual({
      error: 'Unknown error occurred',
    });
  });

  it('returns warning when confusable characters found', async () => {
    mockConfusables.mockReturnValue([
      { point: 'а', similarTo: 'a' },
      { point: 'е', similarTo: 'e' },
    ]);

    const result = await validateDomainWithConfusables(
      'exаmple.eth',
      defaultOptions,
    );

    expect(result).toEqual({
      confusableCharacters: [
        { point: 'а', similarTo: 'a' },
        { point: 'е', similarTo: 'e' },
      ],
      error: null,
      resolvedLookup: '0x123456789abcdef',
      warning: 'Domain contains confusing characters',
    });
  });

  it('handles zero-width confusable characters', async () => {
    mockConfusables.mockReturnValue([
      { point: '‌', similarTo: '' },
      { point: 'a', similarTo: 'a' },
    ]);

    const result = await validateDomainWithConfusables(
      'exa‌mple.eth',
      defaultOptions,
    );

    expect(result).toEqual({
      error: 'invalidAddress',
      warning: 'confusableZeroWidthUnicode',
      resolvedLookup: '0x123456789abcdef',
    });
  });

  it('filters out duplicate confusable points', async () => {
    mockConfusables.mockReturnValue([
      { point: 'а', similarTo: 'a' },
      { point: 'а', similarTo: 'a' },
      { point: 'е', similarTo: 'e' },
    ]);

    const result = await validateDomainWithConfusables(
      'exаmple.eth',
      defaultOptions,
    );

    expect(result.confusableCharacters).toEqual([
      { point: 'а', similarTo: 'a' },
      { point: 'е', similarTo: 'e' },
    ]);
  });

  it('filters out confusable characters with undefined similarTo', async () => {
    mockConfusables.mockReturnValue([
      { point: 'а', similarTo: 'a' },
      { point: 'х', similarTo: undefined },
      { point: 'е', similarTo: 'e' },
    ]);

    const result = await validateDomainWithConfusables(
      'exаmple.eth',
      defaultOptions,
    );

    expect(result.confusableCharacters).toEqual([
      { point: 'а', similarTo: 'a' },
      { point: 'е', similarTo: 'e' },
    ]);
  });

  it('returns error when resolveNameLookup throws', async () => {
    mockLookupDomainAddresses.mockRejectedValue(new Error('Network error'));

    const result = await validateDomainWithConfusables(
      'example.eth',
      defaultOptions,
    );

    expect(result).toEqual({
      error: 'Unknown error occurred',
    });
  });

  it('returns error when confusables throws', async () => {
    mockConfusables.mockImplementation(() => {
      throw new Error('Confusables library error');
    });

    const result = await validateDomainWithConfusables(
      'example.eth',
      defaultOptions,
    );

    expect(result).toEqual({
      error: 'Unknown error occurred',
    });
  });
});

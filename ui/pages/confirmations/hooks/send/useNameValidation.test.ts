import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { lookupDomainName } from '../../../../ducks/domains';
// eslint-disable-next-line import/no-namespace
import * as SendValidationUtils from '../../utils/sendValidations';
import { useNameValidation } from './useNameValidation';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useDispatch: jest.fn().mockReturnValue((callback: any) => callback?.()),
}));

jest.mock('../../../../ducks/domains', () => ({
  lookupDomainName: jest.fn(),
}));

describe('useNameValidation', () => {
  const lookupDomainNameMock = jest.mocked(lookupDomainName);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('return function to validate name', () => {
    const { result } = renderHookWithProvider(
      () => useNameValidation(),
      mockState,
    );
    expect(result.current.validateName).toBeDefined();
  });

  it('return resolved address when name is resolved', async () => {
    lookupDomainNameMock.mockReturnValue(() =>
      Promise.resolve([
        {
          resolvedAddress: 'dummy_address',
          protocol: 'dummy_protocol',
        },
      ]),
    );
    const { result } = renderHookWithProvider(
      () => useNameValidation(),
      mockState,
    );
    expect(
      await result.current.validateName(
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        'test.sol',
      ),
    ).toStrictEqual({
      protocol: 'dummy_protocol',
      resolvedLookup: 'dummy_address',
    });
    expect(lookupDomainNameMock).toHaveBeenCalledWith(
      'test.sol',
      '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      undefined,
    );
  });

  it('dispatch lookupDomainName for EVM domain names', async () => {
    lookupDomainNameMock.mockReturnValue(() =>
      Promise.resolve([
        {
          resolvedAddress: 'dummy_address',
          protocol: 'dummy_protocol',
        },
      ]),
    );
    const { result } = renderHookWithProvider(
      () => useNameValidation(),
      mockState,
    );
    expect(await result.current.validateName('0x1', 'test.eth')).toStrictEqual({
      protocol: 'dummy_protocol',
      resolvedLookup: 'dummy_address',
    });
    expect(lookupDomainNameMock).toHaveBeenCalledWith(
      'test.eth',
      '0x1',
      undefined,
    );
  });

  it('return confusable error and warning as name is resolved', async () => {
    jest
      .spyOn(SendValidationUtils, 'findConfusablesInRecipient')
      .mockReturnValue({
        error: 'dummy_error',
        warning: 'dummy_warning',
      });
    lookupDomainNameMock.mockReturnValue(() =>
      Promise.resolve([
        {
          resolvedAddress: 'dummy_address',
          protocol: 'dummy_protocol',
        },
      ]),
    );
    const { result } = renderHookWithProvider(
      () => useNameValidation(),
      mockState,
    );
    expect(
      await result.current.validateName(
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        'test.sol',
      ),
    ).toStrictEqual({
      error: 'dummy_error',
      protocol: 'dummy_protocol',
      warning: 'dummy_warning',
      resolvedLookup: 'dummy_address',
    });
  });
});

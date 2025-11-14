import { AddressResolution } from '@metamask/snaps-sdk';

import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { lookupDomainName } from '../../../../ducks/domains';
// eslint-disable-next-line import/no-namespace
import * as SnapNameResolution from '../../../../hooks/snaps/useSnapNameResolution';
// eslint-disable-next-line import/no-namespace
import * as SendValidationUtils from '../../utils/sendValidations';
import { useNameValidation } from './useNameValidation';
import { useSendType } from './useSendType';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useDispatch: jest.fn().mockReturnValue((callback: any) => callback?.()),
}));

jest.mock('@metamask/bridge-controller', () => ({
  ...jest.requireActual('@metamask/bridge-controller'),
  formatChainIdToCaip: jest.fn(),
}));

jest.mock('../../../../ducks/domains', () => ({
  lookupDomainName: jest.fn(),
}));

jest.mock('./useSendType', () => ({
  useSendType: jest.fn().mockReturnValue({
    isEvmSendType: false,
  }),
}));

describe('useNameValidation', () => {
  const lookupDomainNameMock = jest.mocked(lookupDomainName);
  const useSendTypeMock = jest.mocked(useSendType);

  beforeEach(() => {
    jest.clearAllMocks();
    useSendTypeMock.mockReturnValue({
      isEvmSendType: false,
    } as unknown as ReturnType<typeof useSendType>);
  });

  it('return function to validate name', () => {
    const { result } = renderHookWithProvider(
      () => useNameValidation(),
      mockState,
    );
    expect(result.current.validateName).toBeDefined();
  });

  it('return resolved address when name is resolved', async () => {
    jest.spyOn(SnapNameResolution, 'useSnapNameResolution').mockReturnValue({
      fetchResolutions: () =>
        Promise.resolve([
          {
            resolvedAddress: 'dummy_address',
            protocol: 'dummy_protocol',
          } as unknown as AddressResolution,
        ]),
    });
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
  });

  it('dispatch lookupDomainName when name is resolved', async () => {
    useSendTypeMock.mockReturnValue({
      isEvmSendType: true,
    } as unknown as ReturnType<typeof useSendType>);
    jest.spyOn(SnapNameResolution, 'useSnapNameResolution').mockReturnValue({
      fetchResolutions: () =>
        Promise.resolve([
          {
            resolvedAddress: 'dummy_address',
            protocol: 'dummy_protocol',
          } as unknown as AddressResolution,
        ]),
    });
    const { result } = renderHookWithProvider(
      () => useNameValidation(),
      mockState,
    );
    expect(
      await result.current.validateName(
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        'test.eth',
      ),
    ).toStrictEqual({
      protocol: 'dummy_protocol',
      resolvedLookup: 'dummy_address',
    });
    expect(lookupDomainNameMock).toHaveBeenCalledWith(
      'test.eth',
      '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    );
  });

  it('return confusable error and warning as name is resolved', async () => {
    jest
      .spyOn(SendValidationUtils, 'findConfusablesInRecipient')
      .mockReturnValue({
        error: 'dummy_error',
        warning: 'dummy_warning',
      });
    jest.spyOn(SnapNameResolution, 'useSnapNameResolution').mockReturnValue({
      fetchResolutions: () =>
        Promise.resolve([
          {
            resolvedAddress: 'dummy_address',
            protocol: 'dummy_protocol',
          } as unknown as AddressResolution,
        ]),
    });
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

import { AddressResolution } from '@metamask/snaps-sdk';

import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
// eslint-disable-next-line import/no-namespace
import * as SnapNameResolution from '../../../../hooks/snaps/useSnapNameResolution';
// eslint-disable-next-line import/no-namespace
import * as SendValidationUtils from '../../utils/sendValidations';
import { useNameValidation } from './useNameValidation';

jest.mock('@metamask/bridge-controller', () => ({
  ...jest.requireActual('@metamask/bridge-controller'),
  formatChainIdToCaip: jest.fn(),
}));

describe('useNameValidation', () => {
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

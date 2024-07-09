import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import {
  AdvancedDetailsProvider,
  useAdvancedDetailsHandler,
} from './advanced-details-context';

jest.mock('../../../../../../selectors/selectors', () => ({
  ...jest.requireActual('../../../../../../selectors/selectors'),
  getConfirmationAdvancedDetailsOpen: jest.fn(),
}));

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  setConfirmationAdvancedDetailsOpen: jest.fn(),
}));

describe('useAdvancedDetailsHandler', () => {
  it('throws an error if used outside of useAdvancedDetailsHandlerProvider', () => {
    const { result } = renderHookWithProvider(() =>
      useAdvancedDetailsHandler(),
    );
    expect(result.error).toEqual(
      new Error(
        'useAdvancedDetailsHandler must be used within an AdvancedDetailsProvider',
      ),
    );
  });

  it('showAdvancedDetails is false based on Redux state', () => {
    const getConfirmationAdvancedDetailsOpenMock =
      // eslint-disable-next-line import/no-useless-path-segments, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      require('../../../../../../selectors/selectors').getConfirmationAdvancedDetailsOpen;
    const setConfirmationAdvancedDetailsOpenMock =
      // eslint-disable-next-line import/no-useless-path-segments, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      require('../../../../../../store/actions').setConfirmationAdvancedDetailsOpen;

    getConfirmationAdvancedDetailsOpenMock.mockReturnValue(false);
    setConfirmationAdvancedDetailsOpenMock.mockReturnValue(null);

    const { result } = renderHookWithProvider(
      () => useAdvancedDetailsHandler(),
      mockState,
      '/',
      AdvancedDetailsProvider,
    );

    expect(result.current.showAdvancedDetails).toBe(false);
  });

  it('showAdvancedDetails is true based on Redux state', () => {
    const getConfirmationAdvancedDetailsOpenMock =
      // eslint-disable-next-line import/no-useless-path-segments, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      require('../../../../../../selectors/selectors').getConfirmationAdvancedDetailsOpen;
    const setConfirmationAdvancedDetailsOpenMock =
      // eslint-disable-next-line import/no-useless-path-segments, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      require('../../../../../../store/actions').setConfirmationAdvancedDetailsOpen;

    getConfirmationAdvancedDetailsOpenMock.mockReturnValue(true);
    setConfirmationAdvancedDetailsOpenMock.mockReturnValue(null);

    const { result } = renderHookWithProvider(
      () => useAdvancedDetailsHandler(),
      mockState,
      '/',
      AdvancedDetailsProvider,
    );

    expect(result.current.showAdvancedDetails).toBe(true);
  });
});

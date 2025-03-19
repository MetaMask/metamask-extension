import mockState from '../../../../test/data/mock-state.json';
import { unapprovedPersonalSignMsg } from '../../../../test/data/confirmations/personal_sign';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import syncConfirmPath from './syncConfirmPath';

const mockHistoryReplace = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({ replace: mockHistoryReplace }),
}));

describe('syncConfirmPath', () => {
  it('should execute correctly', () => {
    const result = renderHookWithConfirmContextProvider(
      () => syncConfirmPath(unapprovedPersonalSignMsg),
      mockState,
    );
    expect(result).toBeDefined();
  });

  it('should replace history route', () => {
    mockHistoryReplace.mockClear();
    renderHookWithConfirmContextProvider(
      () => syncConfirmPath(unapprovedPersonalSignMsg),
      mockState,
    );
    expect(mockHistoryReplace).toHaveBeenCalled();
  });
});

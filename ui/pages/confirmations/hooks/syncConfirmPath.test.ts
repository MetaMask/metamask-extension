import { getMockPersonalSignConfirmState } from '../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import syncConfirmPath from './syncConfirmPath';

const mockHistoryReplace = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({ replace: mockHistoryReplace }),
}));

const mockState = getMockPersonalSignConfirmState();

describe('syncConfirmPath', () => {
  it('should execute correctly', () => {
    const result = renderHookWithConfirmContextProvider(
      () => syncConfirmPath(),
      mockState,
    );
    expect(result).toBeDefined();
  });

  it('should replace history route', () => {
    mockHistoryReplace.mockClear();
    renderHookWithConfirmContextProvider(() => syncConfirmPath(), mockState);
    expect(mockHistoryReplace).toHaveBeenCalled();
  });
});

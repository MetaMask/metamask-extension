import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import syncConfirmPath from './syncConfirmPath';

const mockHistoryReplace = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({ replace: mockHistoryReplace }),
}));

const mockState = {
  confirm: {
    currentConfirmation: {
      id: '1',
      msgParams: {},
    },
  },
};

describe('syncConfirmPath', () => {
  it('should execute correctly', () => {
    const result = renderHookWithProvider(() => syncConfirmPath(), mockState);
    expect(result).toBeDefined();
  });

  it('should replace history route', () => {
    mockHistoryReplace.mockClear();
    renderHookWithProvider(() => syncConfirmPath(), mockState);
    expect(mockHistoryReplace).toHaveBeenCalled();
  });
});

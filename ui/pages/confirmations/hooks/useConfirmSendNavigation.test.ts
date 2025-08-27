import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import * as ConfirmContext from '../context/confirm';

import { useConfirmSendNavigation } from './useConfirmSendNavigation';

const mockHistory = {
  goBack: jest.fn(),
  push: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => mockHistory,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => async (fn: () => Promise<unknown>) => {
    if (fn) {
      await fn();
    }
  },
}));

function renderHook() {
  const { result } = renderHookWithProvider(
    useConfirmSendNavigation,
    mockState,
  );
  return result.current;
}

describe('useConfirmSendNavigation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('result returns method navigateBackIfSend', () => {
    jest
      .spyOn(ConfirmContext, 'useConfirmContext')
      .mockReturnValue({} as unknown as ConfirmContext.ConfirmContextType);
    const result = renderHook();
    expect(result.navigateBackIfSend).toBeDefined();
  });

  it('result returns method handleBack to goto previous page', () => {
    jest
      .spyOn(ConfirmContext, 'useConfirmContext')
      .mockReturnValue({
        currentConfirmation: { origin: 'metamask', type: 'simpleSend' },
      } as unknown as ConfirmContext.ConfirmContextType);
    const result = renderHook();
    result.navigateBackIfSend();
    expect(mockHistory.goBack).toHaveBeenCalled();
  });
});

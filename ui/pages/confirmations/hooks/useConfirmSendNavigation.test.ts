import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as ConfirmContext from '../context/confirm';

import { useConfirmSendNavigation } from './useConfirmSendNavigation';

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
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

  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('result returns method handleBack to goto previous page', () => {
    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { origin: 'metamask', type: 'simpleSend' },
    } as unknown as ConfirmContext.ConfirmContextType);
    const result = renderHook();
    result.navigateBackIfSend();
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});

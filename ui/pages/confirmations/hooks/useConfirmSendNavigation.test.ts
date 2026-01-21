import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as ConfirmContext from '../context/confirm';
import { useConfirmSendNavigation } from './useConfirmSendNavigation';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => async (fn: () => Promise<unknown>) => {
    if (fn) {
      await fn();
    }
  },
}));

describe('useConfirmSendNavigation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderHook = () => {
    const { result } = renderHookWithProvider(
      useConfirmSendNavigation,
      mockState,
    );
    return result.current;
  };

  it('returns navigateBackIfSend method', () => {
    jest
      .spyOn(ConfirmContext, 'useConfirmContext')
      .mockReturnValue({} as unknown as ConfirmContext.ConfirmContextType);

    const result = renderHook();

    expect(result.navigateBackIfSend).toBeDefined();
  });

  it('navigates back when confirmation is metamask simpleSend', () => {
    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { origin: 'metamask', type: 'simpleSend' },
    } as unknown as ConfirmContext.ConfirmContextType);

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockUseNavigate).toHaveBeenCalledWith(-1);
  });

  it('does not navigate back when origin is not metamask', () => {
    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { origin: 'dapp', type: 'simpleSend' },
    } as unknown as ConfirmContext.ConfirmContextType);

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockUseNavigate).not.toHaveBeenCalledWith(-1);
  });

  it('does not navigate back when type is not simpleSend', () => {
    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { origin: 'metamask', type: 'contractInteraction' },
    } as unknown as ConfirmContext.ConfirmContextType);

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockUseNavigate).not.toHaveBeenCalledWith(-1);
  });

  it('does not navigate back when both origin and type do not match', () => {
    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { origin: 'dapp', type: 'contractInteraction' },
    } as unknown as ConfirmContext.ConfirmContextType);

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockUseNavigate).not.toHaveBeenCalledWith(-1);
  });
});

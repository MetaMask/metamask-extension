import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import * as ConfirmContext from '../context/confirm';
import { useRedesignedSendFlow } from './useRedesignedSendFlow';
import { useConfirmSendNavigation } from './useConfirmSendNavigation';

const mockUseRedesignedSendFlow = jest.mocked(useRedesignedSendFlow);

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

jest.mock('./useRedesignedSendFlow');

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
    mockUseRedesignedSendFlow.mockReturnValue({ enabled: false });

    const result = renderHook();

    expect(result.navigateBackIfSend).toBeDefined();
  });

  it('does not navigate back when send redesign is disabled', () => {
    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { origin: 'metamask', type: 'simpleSend' },
    } as unknown as ConfirmContext.ConfirmContextType);
    mockUseRedesignedSendFlow.mockReturnValue({ enabled: false });

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockHistory.goBack).not.toHaveBeenCalled();
  });

  it('navigates back when send redesign is enabled and confirmation is metamask simpleSend', () => {
    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { origin: 'metamask', type: 'simpleSend' },
    } as unknown as ConfirmContext.ConfirmContextType);
    mockUseRedesignedSendFlow.mockReturnValue({ enabled: true });

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockHistory.goBack).toHaveBeenCalled();
  });

  it('does not navigate back when send redesign is enabled but origin is not metamask', () => {
    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { origin: 'dapp', type: 'simpleSend' },
    } as unknown as ConfirmContext.ConfirmContextType);
    mockUseRedesignedSendFlow.mockReturnValue({ enabled: true });

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockHistory.goBack).not.toHaveBeenCalled();
  });

  it('does not navigate back when send redesign is enabled but type is not simpleSend', () => {
    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { origin: 'metamask', type: 'contractInteraction' },
    } as unknown as ConfirmContext.ConfirmContextType);
    mockUseRedesignedSendFlow.mockReturnValue({ enabled: true });

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockHistory.goBack).not.toHaveBeenCalled();
  });

  it('does not navigate back when send redesign is enabled but both origin and type do not match', () => {
    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { origin: 'dapp', type: 'contractInteraction' },
    } as unknown as ConfirmContext.ConfirmContextType);
    mockUseRedesignedSendFlow.mockReturnValue({ enabled: true });

    const result = renderHook();
    result.navigateBackIfSend();

    expect(mockHistory.goBack).not.toHaveBeenCalled();
  });
});

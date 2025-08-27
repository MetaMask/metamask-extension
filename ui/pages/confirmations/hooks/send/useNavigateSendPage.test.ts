import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { SEND_ROUTE } from '../../../../helpers/constants/routes';
import { SendPages } from '../../constants/send';
import { useNavigateSendPage } from './useNavigateSendPage';

const mockHistory = {
  goBack: jest.fn(),
  push: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => mockHistory,
}));

function renderHook() {
  const { result } = renderHookWithProvider(useNavigateSendPage, mockState);
  return result.current;
}

describe('useNavigateSendPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('call SendContext.updateCurrentPage with correct parameters', () => {
    const result = renderHook();
    expect(result.goToAmountPage).toBeDefined();
    expect(result.goToSendToPage).toBeDefined();
    expect(result.goToPreviousPage).toBeDefined();
  });

  it('calls updateCurrentPage with "Amount" when goToAmountPage is called', () => {
    const result = renderHook();
    result.goToAmountPage();
    expect(mockHistory.push).toHaveBeenCalledWith(
      `${SEND_ROUTE}/${SendPages.AMOUNT}`,
    );
  });

  it('calls updateCurrentPage with "Recipient" when goToSendToPage is called', () => {
    const result = renderHook();
    result.goToSendToPage();
    expect(mockHistory.push).toHaveBeenCalledWith(
      `${SEND_ROUTE}/${SendPages.RECIPIENT}`,
    );
  });

  it('calls updateCurrentPage with "Amount" when goToPreviousPage is called on "Recipient" page', () => {
    const result = renderHook();
    result.goToPreviousPage();
    expect(mockHistory.goBack).toHaveBeenCalled();
  });

  it('calls updateCurrentPage with "Asset" when goToPreviousPage is called on "Amount" page', () => {
    const result = renderHook();
    result.goToPreviousPage();
    expect(mockHistory.goBack).toHaveBeenCalled();
  });

  it('calls history.goBack when goToPreviousPage is called on "Asset" page', () => {
    const result = renderHook();
    result.goToPreviousPage();
    expect(mockHistory.goBack).toHaveBeenCalled();
  });
});

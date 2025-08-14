import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import * as SendContext from '../../context/send';
import { useNavigateSendPage } from './useNavigateSendPage';
import { SendPages } from '../../constants/send';

const mockHistory = {
  goBack: jest.fn(),
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
  it('returns functions for send page navigations', () => {
    const result = renderHook();
    expect(result.goToAmountPage).toBeDefined();
    expect(result.goToSendToPage).toBeDefined();
    expect(result.goToPreviousPage).toBeDefined();
  });

  it('calls updateCurrentPage with "Amount" when goToAmountPage is called', () => {
    const mockUpdateCurrentPage = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      currentPage: SendPages.ASSET,
      updateCurrentPage: mockUpdateCurrentPage,
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    result.goToAmountPage();
    expect(mockUpdateCurrentPage).toHaveBeenCalledWith(SendPages.AMOUNT);
  });

  it('calls updateCurrentPage with "Recipient" when goToSendToPage is called', () => {
    const mockUpdateCurrentPage = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      currentPage: SendPages.AMOUNT,
      updateCurrentPage: mockUpdateCurrentPage,
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    result.goToSendToPage();
    expect(mockUpdateCurrentPage).toHaveBeenCalledWith(SendPages.RECIPIENT);
  });

  it('calls updateCurrentPage with "Amount" when goToPreviousPage is called on "Recipient" page', () => {
    const mockUpdateCurrentPage = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      currentPage: SendPages.RECIPIENT,
      updateCurrentPage: mockUpdateCurrentPage,
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    result.goToPreviousPage();
    expect(mockUpdateCurrentPage).toHaveBeenCalledWith(SendPages.AMOUNT);
  });

  it('calls updateCurrentPage with "Asset" when goToPreviousPage is called on "Amount" page', () => {
    const mockUpdateCurrentPage = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      currentPage: SendPages.AMOUNT,
      updateCurrentPage: mockUpdateCurrentPage,
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    result.goToPreviousPage();
    expect(mockUpdateCurrentPage).toHaveBeenCalledWith(SendPages.ASSET);
  });

  it('calls history.goBack when goToPreviousPage is called on "Asset" page', () => {
    const mockUpdateCurrentPage = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      currentPage: SendPages.ASSET,
      updateCurrentPage: mockUpdateCurrentPage,
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    result.goToPreviousPage();
    expect(mockHistory.goBack).toHaveBeenCalled();
  });
});

import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { SEND_ROUTE } from '../../../../helpers/constants/routes';
import { SendPages } from '../../constants/send';
import { useNavigateSendPage } from './useNavigateSendPage';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: jest
    .fn()
    .mockReturnValue([
      { get: () => null, toString: () => 'searchParams=dummy' },
    ]),
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
    expect(result.goToAmountRecipientPage).toBeDefined();
    expect(result.goToPreviousPage).toBeDefined();
  });

  it('calls updateCurrentPage with "Amount" when goToAmountRecipientPage is called', () => {
    const result = renderHook();
    result.goToAmountRecipientPage();
    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${SEND_ROUTE}/${SendPages.AMOUNTRECIPIENT}?searchParams=dummy`,
    );
  });

  it('calls updateCurrentPage with "Amount" when goToPreviousPage is called on "Recipient" page', () => {
    const result = renderHook();
    result.goToPreviousPage();
    expect(mockUseNavigate).toHaveBeenCalledWith(-1);
  });

  it('calls updateCurrentPage with "Asset" when goToPreviousPage is called on "Amount" page', () => {
    const result = renderHook();
    result.goToPreviousPage();
    expect(mockUseNavigate).toHaveBeenCalledWith(-1);
  });

  it('calls history.goBack when goToPreviousPage is called on "Asset" page', () => {
    const result = renderHook();
    result.goToPreviousPage();
    expect(mockUseNavigate).toHaveBeenCalledWith(-1);
  });
});

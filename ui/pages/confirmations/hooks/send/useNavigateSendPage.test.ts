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

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
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
    expect(mockHistory.push).toHaveBeenCalledWith(
      `${SEND_ROUTE}/${SendPages.AMOUNTRECIPIENT}?searchParams=dummy`,
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

import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  DEFAULT_ROUTE,
  SEND_ROUTE,
} from '../../../../helpers/constants/routes';
import { SendPages } from '../../constants/send';
import { useNavigateSendPage } from './useNavigateSendPage';

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => mockUseLocation(),
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
  beforeEach(() => {
    mockUseLocation.mockReturnValue({
      key: 'in-app-entry',
      pathname: '/send/asset',
    });
  });

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

  it('navigates home when the Send page was opened directly', () => {
    mockUseLocation.mockReturnValue({ key: 'default', pathname: '/send' });
    const result = renderHook();

    result.goToPreviousPage();

    expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
    });
  });
});

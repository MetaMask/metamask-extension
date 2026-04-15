import { renderHook } from '@testing-library/react-hooks';
import { useSuppressNavigation } from './useSuppressConfirmNavigate';

const mockUseSelector = jest.fn();
const mockIsInteractiveUI = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../shared/lib/selectors/smart-transactions', () => ({
  getExtensionSkipTransactionStatusPage: jest.fn(),
}));

jest.mock('../../shared/lib/environment-type', () => ({
  isInteractiveUI: () => mockIsInteractiveUI(),
}));

describe('useSupressNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderUseSuppressNavigation({
    toastEnabled,
    isInteractive,
  }: {
    toastEnabled: boolean;
    isInteractive: boolean;
  }) {
    mockUseSelector.mockReturnValue(toastEnabled);
    mockIsInteractiveUI.mockReturnValue(isInteractive);

    return renderHook(() => useSuppressNavigation()).result.current;
  }

  it('returns true for hidden smart transaction status page approvals', () => {
    const suppressNavigation = renderUseSuppressNavigation({
      toastEnabled: true,
      isInteractive: true,
    });

    expect(
      suppressNavigation(
        'approval-id',
        [
          {
            id: 'approval-id',
            type: 'smartTransaction:showSmartTransactionStatusPage',
          } as never,
        ],
        true,
      ),
    ).toBe(true);
  });

  it('returns true for hidden approval fallback with no visible confirmations', () => {
    const suppressNavigation = renderUseSuppressNavigation({
      toastEnabled: true,
      isInteractive: true,
    });

    expect(suppressNavigation(undefined, [], true)).toBe(true);
  });

  it('returns false by default for non-hidden confirmation flows', () => {
    const suppressNavigation = renderUseSuppressNavigation({
      toastEnabled: true,
      isInteractive: true,
    });

    expect(
      suppressNavigation(
        'approval-id',
        [
          {
            id: 'approval-id',
            type: 'transaction',
          } as never,
        ],
        false,
      ),
    ).toBe(false);
  });
});

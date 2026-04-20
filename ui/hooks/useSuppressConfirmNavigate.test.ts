import { renderHook } from '@testing-library/react-hooks';
import { getExtensionSkipTransactionStatusPage } from '../../shared/lib/selectors/smart-transactions';
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
    mockUseSelector.mockImplementation((selector: unknown) => {
      if (selector === getExtensionSkipTransactionStatusPage) {
        return toastEnabled;
      }

      return undefined;
    });
    mockIsInteractiveUI.mockReturnValue(isInteractive);

    return renderHook(() => useSuppressNavigation()).result.current;
  }

  it('returns true for hidden smart transaction status page approvals', () => {
    const suppressNavigation = renderUseSuppressNavigation({
      toastEnabled: true,
      isInteractive: true,
    });

    expect(
      suppressNavigation('approval-id', [
        {
          id: 'approval-id',
          type: 'smartTransaction:showSmartTransactionStatusPage',
        } as never,
      ]),
    ).toBe(true);
  });

  it('returns false when there is no confirmation id and no smart transaction approval exists', () => {
    const suppressNavigation = renderUseSuppressNavigation({
      toastEnabled: true,
      isInteractive: true,
    });

    expect(suppressNavigation(undefined, [])).toBe(false);
  });

  it('returns false by default for non-hidden confirmation flows', () => {
    const suppressNavigation = renderUseSuppressNavigation({
      toastEnabled: true,
      isInteractive: true,
    });

    expect(
      suppressNavigation('approval-id', [
        {
          id: 'approval-id',
          type: 'transaction',
        } as never,
      ]),
    ).toBe(false);
  });
});

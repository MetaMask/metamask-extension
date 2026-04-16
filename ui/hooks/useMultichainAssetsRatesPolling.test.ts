import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import * as ControllerActionsModule from '../store/controller-actions/multichain-asset-rates-controller';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import {
  AccountsState,
  getSelectedInternalAccount,
  getUseCurrencyRateCheck,
} from '../selectors';
import usePolling from './usePolling';
import useMultichainAssetsRatesPolling from './useMultichainAssetsRatesPolling';

// Mock Type for testing purposes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockVar = any;

jest.mock('react-redux');
jest.mock('./usePolling');
jest.mock('../ducks/metamask/metamask');
jest.mock('../selectors');

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUsePolling = usePolling as jest.MockedFunction<typeof usePolling>;

const arrangeSelectorMocks = () => {
  const mockGetCompletedOnboarding = jest
    .mocked(getCompletedOnboarding)
    .mockReturnValue(true);
  const mockGetIsUnlocked = jest.mocked(getIsUnlocked).mockReturnValue(true);
  const mockGetUseCurrencyRateCheck = jest
    .mocked(getUseCurrencyRateCheck)
    .mockReturnValue(true);
  const mockGetSelectedInternalAccount = jest
    .mocked(getSelectedInternalAccount)
    .mockReturnValue({
      id: 'account-id',
    } as MockVar);

  mockUseSelector.mockImplementation((selector) => {
    if (selector === getCompletedOnboarding) {
      return mockGetCompletedOnboarding();
    }
    if (selector === getIsUnlocked) {
      return mockGetIsUnlocked();
    }
    if (selector === getUseCurrencyRateCheck) {
      return mockGetUseCurrencyRateCheck({});
    }
    if (selector === getSelectedInternalAccount) {
      return mockGetSelectedInternalAccount({} as AccountsState);
    }
    throw new Error(`Unmocked Selector Called: ${selector.name}`);
  });

  return {
    mockGetCompletedOnboarding,
    mockGetIsUnlocked,
    mockGetUseCurrencyRateCheck,
    mockGetSelectedInternalAccount,
  };
};

const arrangeMocks = () => {
  const mockStartPolling = jest.spyOn(
    ControllerActionsModule,
    'multichainAssetsRatesStartPolling',
  );
  const mockStopPollingByPollingToken = jest.spyOn(
    ControllerActionsModule,
    'multichainAssetsRatesStopPollingByPollingToken',
  );

  mockStartPolling.mockResolvedValue('default-polling-token');
  mockStopPollingByPollingToken.mockResolvedValue(undefined);

  return {
    mockStartPolling,
    mockStopPollingByPollingToken,
    ...arrangeSelectorMocks(),
  };
};

describe('useMultichainAssetsRatesPolling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls usePolling with correct parameters when polling is enabled', () => {
    const mocks = arrangeMocks();
    const mockAccountId = 'test-account-id-123';

    mocks.mockGetSelectedInternalAccount.mockReturnValue({
      id: mockAccountId,
    } as MockVar);

    renderHook(() => useMultichainAssetsRatesPolling());

    expect(mockUsePolling).toHaveBeenCalledTimes(1);
    expect(mockUsePolling).toHaveBeenCalledWith({
      startPolling: mocks.mockStartPolling,
      stopPollingByPollingToken: mocks.mockStopPollingByPollingToken,
      input: mockAccountId,
      enabled: true,
    });
  });

  it('disables polling when onboarding is not completed', () => {
    const mocks = arrangeMocks();
    const mockAccountId = 'test-account-id-123';

    mocks.mockGetCompletedOnboarding.mockReturnValue(false);
    mocks.mockGetSelectedInternalAccount.mockReturnValue({
      id: mockAccountId,
    } as MockVar);

    renderHook(() => useMultichainAssetsRatesPolling());

    expect(mockUsePolling).toHaveBeenCalledWith({
      startPolling: mocks.mockStartPolling,
      stopPollingByPollingToken: mocks.mockStopPollingByPollingToken,
      input: mockAccountId,
      enabled: false,
    });
  });

  it('disables polling when wallet is locked', () => {
    const mocks = arrangeMocks();
    const mockAccountId = 'test-account-id-123';

    mocks.mockGetIsUnlocked.mockReturnValue(false);
    mocks.mockGetSelectedInternalAccount.mockReturnValue({
      id: mockAccountId,
    } as MockVar);

    renderHook(() => useMultichainAssetsRatesPolling());

    expect(mockUsePolling).toHaveBeenCalledWith({
      startPolling: mocks.mockStartPolling,
      stopPollingByPollingToken: mocks.mockStopPollingByPollingToken,
      input: mockAccountId,
      enabled: false,
    });
  });

  it('disables polling when currency rate check is disabled', () => {
    const mocks = arrangeMocks();
    const mockAccountId = 'test-account-id-123';

    mocks.mockGetUseCurrencyRateCheck.mockReturnValue(false);
    mocks.mockGetSelectedInternalAccount.mockReturnValue({
      id: mockAccountId,
    } as MockVar);

    renderHook(() => useMultichainAssetsRatesPolling());

    expect(mockUsePolling).toHaveBeenCalledWith({
      startPolling: mocks.mockStartPolling,
      stopPollingByPollingToken: mocks.mockStopPollingByPollingToken,
      input: mockAccountId,
      enabled: false,
    });
  });

  it('uses correct account id from selector', () => {
    const mocks = arrangeMocks();
    const mockAccountId = 'specific-account-id-456';

    mocks.mockGetSelectedInternalAccount.mockReturnValue({
      id: mockAccountId,
    } as MockVar);

    renderHook(() => useMultichainAssetsRatesPolling());

    expect(mockUsePolling).toHaveBeenCalledWith({
      startPolling: mocks.mockStartPolling,
      stopPollingByPollingToken: mocks.mockStopPollingByPollingToken,
      input: mockAccountId,
      enabled: true,
    });
  });

  describe('polling enabled combinations', () => {
    const testCases = [
      { completed: false, unlocked: false, rateCheck: false, expected: false },
      { completed: true, unlocked: false, rateCheck: false, expected: false },
      { completed: false, unlocked: true, rateCheck: false, expected: false },
      { completed: false, unlocked: false, rateCheck: true, expected: false },
      { completed: true, unlocked: true, rateCheck: false, expected: false },
      { completed: true, unlocked: false, rateCheck: true, expected: false },
      { completed: false, unlocked: true, rateCheck: true, expected: false },
      { completed: true, unlocked: true, rateCheck: true, expected: true },
    ];

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each(testCases)(
      'polling enabled: $expected when completed: $completed, unlocked: $unlocked, rateCheck: $rateCheck',
      ({
        completed,
        unlocked,
        rateCheck,
        expected,
      }: (typeof testCases)[number]) => {
        const mocks = arrangeMocks();
        const mockAccountId = 'test-account-id';

        mocks.mockGetCompletedOnboarding.mockReturnValue(completed);
        mocks.mockGetIsUnlocked.mockReturnValue(unlocked);
        mocks.mockGetUseCurrencyRateCheck.mockReturnValue(rateCheck);
        mocks.mockGetSelectedInternalAccount.mockReturnValue({
          id: mockAccountId,
        } as MockVar);

        renderHook(() => useMultichainAssetsRatesPolling());

        expect(mockUsePolling).toHaveBeenCalledWith({
          startPolling: mocks.mockStartPolling,
          stopPollingByPollingToken: mocks.mockStopPollingByPollingToken,
          input: mockAccountId,
          enabled: expected,
        });
      },
    );
  });
});

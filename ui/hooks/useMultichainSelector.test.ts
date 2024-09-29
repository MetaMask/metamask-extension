import { InternalAccount } from '@metamask/keyring-api';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { getSelectedNetworkClientId } from '../selectors';
import { MultichainState, getMultichainIsEvm } from '../selectors/multichain';
import { CHAIN_IDS } from '../../shared/constants/network';
import { mockNetworkState } from '../../test/stub/networks';
import { useMultichainSelector } from './useMultichainSelector';

const mockAccount = createMockInternalAccount();
const mockNetworkId = 'network-client-id';

const mockState = {
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET, id: mockNetworkId }),
    completedOnboarding: true,
    internalAccounts: {
      accounts: {
        [mockAccount.id]: mockAccount,
      },
      selectedAccount: mockAccount.id,
    },
  },
};

const renderUseMultichainHook = (
  selector: (state: MultichainState, account?: InternalAccount) => unknown,
  account?: InternalAccount,
  state?: MultichainState,
) => {
  return renderHookWithProvider(
    () => useMultichainSelector(selector, account ?? mockAccount),
    state ?? mockState,
  );
};

describe('useMultichainSelector', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls useSelector with the correct selector and account', () => {
    const mockSelector = jest.fn();
    renderUseMultichainHook(mockSelector, mockAccount);

    expect(mockSelector.mock.calls[0][0]).toMatchObject(mockState);
    expect(mockSelector).toHaveBeenCalledWith(
      expect.anything(), // already checked above
      mockAccount,
    );
  });

  it('calls useSelector with the correct selector and undefined account', () => {
    const mockSelector = jest.fn();
    renderUseMultichainHook(mockSelector);

    expect(mockSelector.mock.calls[0][0]).toMatchObject(mockState);
    expect(mockSelector).toHaveBeenCalledWith(
      expect.anything(), // already checked above
      mockAccount,
    );
  });

  it('uses selectedAccount if account is not provided', () => {
    // @ts-expect-error: intentionally testing without account
    const { result } = renderUseMultichainHook(getMultichainIsEvm, null);

    expect(result.current).toBe(true);
  });

  it('is compatible with selectors that do not require an account', () => {
    const { result } = renderUseMultichainHook(
      getSelectedNetworkClientId,
      mockAccount,
    );

    expect(result.current).toBe(mockNetworkId);
  });
});

import { renderHook } from '@testing-library/react-hooks';
import { BtcScope, EthScope, SolScope } from '@metamask/keyring-api';
import { KnownCaipNamespace, type CaipChainId } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { getMetaMaskAccountsOrdered } from '../../selectors';
import { useAccountNetworkAvailability } from './useAccountNetworkAvailability';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

type AccountForTest = {
  scopes: CaipChainId[];
};

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

const EVM_EOA_SCOPE = EthScope.Eoa;
const ETHEREUM = EthScope.Mainnet;
const POLYGON = `${KnownCaipNamespace.Eip155}:137`;
const SOLANA = SolScope.Mainnet;
const BITCOIN = BtcScope.Mainnet;

const setAccounts = (accounts: AccountForTest[]) => {
  mockUseSelector.mockImplementation((selector) => {
    expect(selector).toBe(getMetaMaskAccountsOrdered);
    return accounts as never;
  });
};

describe('useAccountNetworkAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when an account directly supports the requested network', () => {
    setAccounts([{ scopes: [SOLANA] }, { scopes: [POLYGON] }]);

    const { result } = renderHook(() => useAccountNetworkAvailability());

    expect(result.current.hasAnyAccountsInNetwork(SOLANA)).toBe(true);
  });

  it('returns true when an EVM account supports the requested EVM network through the EOA scope', () => {
    setAccounts([{ scopes: [EVM_EOA_SCOPE] }]);

    const { result } = renderHook(() => useAccountNetworkAvailability());

    expect(result.current.hasAnyAccountsInNetwork(ETHEREUM)).toBe(true);
  });

  it('returns false when no account supports the requested network', () => {
    setAccounts([{ scopes: [SOLANA] }, { scopes: [POLYGON] }]);

    const { result } = renderHook(() => useAccountNetworkAvailability());

    expect(result.current.hasAnyAccountsInNetwork(BITCOIN)).toBe(false);
  });

  it('returns false when there are no accounts', () => {
    setAccounts([]);

    const { result } = renderHook(() => useAccountNetworkAvailability());

    expect(result.current.hasAnyAccountsInNetwork(ETHEREUM)).toBe(false);
  });

  it('updates the availability callback when accounts change', () => {
    setAccounts([{ scopes: [SOLANA] }]);

    const { result, rerender } = renderHook(() =>
      useAccountNetworkAvailability(),
    );
    const initialCallback = result.current.hasAnyAccountsInNetwork;

    expect(initialCallback(POLYGON)).toBe(false);

    setAccounts([{ scopes: [POLYGON] }]);
    rerender();

    expect(result.current.hasAnyAccountsInNetwork).not.toBe(initialCallback);
    expect(result.current.hasAnyAccountsInNetwork(POLYGON)).toBe(true);
  });
});

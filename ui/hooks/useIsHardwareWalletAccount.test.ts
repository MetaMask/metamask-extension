import { renderHook } from '@testing-library/react-hooks';
import { KeyringTypes } from '@metamask/keyring-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { useSelector } from 'react-redux';
import { getInternalAccountByAddress } from '../selectors/accounts';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../selectors/multichain-accounts/account-tree';
import { isHardwareWallet } from '../../shared/lib/selectors/keyring';
import { useIsHardwareWalletAccount } from './useIsHardwareWalletAccount';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../selectors/accounts', () => ({
  ...jest.requireActual('../selectors/accounts'),
  getInternalAccountByAddress: jest.fn(),
}));

jest.mock('../selectors/multichain-accounts/account-tree', () => ({
  ...jest.requireActual('../selectors/multichain-accounts/account-tree'),
  getInternalAccountBySelectedAccountGroupAndCaip: jest.fn(),
}));

jest.mock('../../shared/lib/selectors/keyring', () => ({
  ...jest.requireActual('../../shared/lib/selectors/keyring'),
  isHardwareWallet: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

const LEDGER_ADDRESS = '0x1234567890123456789012345678901234567890';

const ledgerAccount = {
  address: LEDGER_ADDRESS,
  metadata: {
    keyring: { type: KeyringTypes.ledger },
  },
} as InternalAccount;

const hdAccount = {
  address: LEDGER_ADDRESS,
  metadata: {
    keyring: { type: KeyringTypes.hd },
  },
} as InternalAccount;

const renderWithMock = ({
  address,
  accountByAddress,
  evmAccountFromSelectedGroup = null,
  isHardwareWalletSelected = false,
}: {
  address?: string;
  accountByAddress?: InternalAccount;
  evmAccountFromSelectedGroup?: InternalAccount | null;
  isHardwareWalletSelected?: boolean;
}) => {
  // Inline selectors in the hook are anonymous; resolve by call order.
  let callIndex = 0;
  mockUseSelector.mockImplementation((selector) => {
    if (selector === isHardwareWallet) {
      return isHardwareWalletSelected;
    }
    callIndex += 1;
    if (callIndex === 1) {
      return accountByAddress;
    }
    if (callIndex === 2) {
      return evmAccountFromSelectedGroup;
    }
    return undefined;
  });

  (getInternalAccountByAddress as unknown as jest.Mock).mockReturnValue(
    accountByAddress,
  );
  (
    getInternalAccountBySelectedAccountGroupAndCaip as unknown as jest.Mock
  ).mockReturnValue(evmAccountFromSelectedGroup);

  return renderHook(() => useIsHardwareWalletAccount(address));
};

describe('useIsHardwareWalletAccount', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when address resolves to a hardware wallet', () => {
    const { result } = renderWithMock({
      address: LEDGER_ADDRESS,
      accountByAddress: ledgerAccount,
      isHardwareWalletSelected: false,
    });

    expect(result.current).toBe(true);
  });

  it('returns false when address resolves to a non-hardware wallet', () => {
    const { result } = renderWithMock({
      address: LEDGER_ADDRESS,
      accountByAddress: hdAccount,
    });

    expect(result.current).toBe(false);
  });

  it('returns true from selected group EVM account when address is omitted', () => {
    const { result } = renderWithMock({
      evmAccountFromSelectedGroup: ledgerAccount,
      isHardwareWalletSelected: false,
    });

    expect(result.current).toBe(true);
  });

  it('falls back to selected-account detection when address and group EVM are missing', () => {
    const { result } = renderWithMock({
      isHardwareWalletSelected: true,
    });

    expect(result.current).toBe(true);
  });
});

import { ETH_TOKEN_IMAGE_URL } from '../../shared/constants/network';
import type { HardwareWalletAccountAddress } from '../../ui/components/multichain-accounts/hardware-account-address-row';
import type { HardwareWalletAccount } from '../../ui/components/multichain-accounts/hardware-account-card';

/** Default Ethereum address fixture for hardware wallet tests and stories. */
export const MOCK_ETHEREUM_HARDWARE_ADDRESS: HardwareWalletAccountAddress = {
  id: 'eth-0',
  networkName: 'Ethereum',
  address: '0x091234567890123456789012345678901234b272',
  balance: '$120.00',
  iconUrl: ETH_TOKEN_IMAGE_URL,
};

const createMultichainAddresses = (
  index: number,
): HardwareWalletAccountAddress[] => [
  { ...MOCK_ETHEREUM_HARDWARE_ADDRESS, id: `eth-${index}` },
  {
    id: `sol-${index}`,
    networkName: 'Solana',
    address: '6dk7RD1234567890abcdefghijklmnopqrstuvDEtXQ',
    balance: '$120.00',
    iconUrl: './images/solana-logo.svg',
  },
  {
    id: `btc-${index}`,
    networkName: 'Bitcoin',
    address: 'bc1qea1234567890abcdefghijklmnopqrstuvwer2fx',
    balance: '$120.00',
    iconUrl: './images/bitcoin-logo.svg',
    addressType: 'Taproot',
  },
];

/**
 * Creates a single hardware wallet account fixture with optional overrides.
 * @param overrides - Optional account field overrides.
 */
export const createHardwareWalletAccount = (
  overrides: Partial<HardwareWalletAccount> = {},
): HardwareWalletAccount => ({
  id: 'account-0',
  name: 'Account 1',
  totalBalance: '$120.00',
  addresses: [MOCK_ETHEREUM_HARDWARE_ADDRESS],
  ...overrides,
});

type CreateMockHardwareAccountsOptions = {
  includeMultichainAddresses?: boolean;
};

/**
 * Creates a list of hardware wallet account fixtures for tests and stories.
 * @param count - Number of accounts to create.
 * @param options - Optional fixture configuration.
 */
export const createMockHardwareAccounts = (
  count: number,
  options: CreateMockHardwareAccountsOptions = {},
): HardwareWalletAccount[] => {
  const { includeMultichainAddresses = false } = options;

  return Array.from({ length: count }, (_, index) => {
    const accountNumber = index + 1;
    const addresses = includeMultichainAddresses
      ? createMultichainAddresses(index)
      : [MOCK_ETHEREUM_HARDWARE_ADDRESS];

    return {
      id: `account-${index}`,
      name: `Account ${accountNumber}`,
      totalBalance: includeMultichainAddresses ? '$360.00' : '$120.00',
      addresses,
      isAlreadyConnected: index === 2,
    };
  });
};

/** Default list of five hardware wallet accounts for page-level tests. */
export const MOCK_HARDWARE_ACCOUNTS = createMockHardwareAccounts(5);

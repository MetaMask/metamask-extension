import { ETH_TOKEN_IMAGE_URL } from '../../shared/constants/network';
import type { HardwareWalletAccountAddress } from '../../ui/components/multichain-accounts/hardware-account-address-row';
import type { HardwareWalletAccount } from '../../ui/components/multichain-accounts/hardware-account-card';

export const MOCK_ETHEREUM_HARDWARE_ADDRESS: HardwareWalletAccountAddress = {
  id: 'eth-0',
  networkName: 'Ethereum',
  address: '0x091234567890123456789012345678901234b272',
  balance: '$120.00',
  iconUrl: ETH_TOKEN_IMAGE_URL,
  iconType: 'network',
};

export const createHardwareWalletAccount = (
  overrides: Partial<HardwareWalletAccount> = {},
): HardwareWalletAccount => ({
  id: 'account-0',
  name: 'Account 1',
  totalBalance: '$120.00',
  addresses: [MOCK_ETHEREUM_HARDWARE_ADDRESS],
  ...overrides,
});

export const createMockHardwareAccounts = (
  count: number,
  options?: {
    includeMultichainAddresses?: boolean;
  },
): HardwareWalletAccount[] => {
  const includeMultichainAddresses =
    options?.includeMultichainAddresses ?? false;

  return Array.from({ length: count }, (_, index) => {
    const accountNumber = index + 1;
    const addresses = includeMultichainAddresses
      ? [
          MOCK_ETHEREUM_HARDWARE_ADDRESS,
          {
            id: `sol-${index}`,
            networkName: 'Solana',
            address: '6dk7RD1234567890abcdefghijklmnopqrstuvDEtXQ',
            balance: '$120.00',
            iconUrl: './images/solana-logo.svg',
            iconType: 'network' as const,
          },
          {
            id: `btc-${index}`,
            networkName: 'Bitcoin',
            address: 'bc1qea1234567890abcdefghijklmnopqrstuvwer2fx',
            balance: '$120.00',
            iconUrl: './images/bitcoin-logo.svg',
            iconType: 'token' as const,
            addressType: 'Taproot',
          },
        ]
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

export const MOCK_HARDWARE_ACCOUNTS = createMockHardwareAccounts(5);

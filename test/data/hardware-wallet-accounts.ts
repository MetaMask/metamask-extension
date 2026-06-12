import { ETH_TOKEN_IMAGE_URL } from '../../shared/constants/network';
import type { HardwareWalletAccount } from '../../ui/components/multichain-accounts/hardware-account-card';

const ETHEREUM_ADDRESS = {
  id: 'eth-0',
  networkName: 'Ethereum',
  address: '0x091234567890123456789012345678901234b272',
  balance: '$120.00',
  iconUrl: ETH_TOKEN_IMAGE_URL,
  iconType: 'network' as const,
};

export const createMockHardwareAccounts = (
  count: number,
  options?: {
    includeMultichainAddresses?: boolean;
  },
): HardwareWalletAccount[] => {
  const includeMultichainAddresses = options?.includeMultichainAddresses ?? false;

  return Array.from({ length: count }, (_, index) => {
    const accountNumber = index + 1;
    const addresses = includeMultichainAddresses
      ? [
          ETHEREUM_ADDRESS,
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
      : [ETHEREUM_ADDRESS];

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

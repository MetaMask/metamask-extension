export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function getTokenAvatarUrl(token: {
  address: string;
  symbol: string;
  iconUrl: string;
}) {
  return token.address === ZERO_ADDRESS && token.symbol === 'ETH'
    ? 'https://raw.githubusercontent.com/MetaMask/metamask-extension/main/app/images/eth_logo.svg'
    : token.iconUrl;
}

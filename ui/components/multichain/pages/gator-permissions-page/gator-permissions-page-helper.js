export const extractNetworkName = (
  networks,
  chainId,
  isFullNetworkName = false,
) => {
  const network = networks[chainId];
  if (network?.name && network?.name !== '') {
    return isFullNetworkName
      ? network.name
      : `networkName${network.name.split(' ')[0]}`;
  }
  return 'unknownNetworkForKeyEntropy';
};

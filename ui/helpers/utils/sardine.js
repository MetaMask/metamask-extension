export const toSardineNetworkName = (network) => {
  switch (network) {
    case 'avaxcchain':
      return 'avalanche';
    default:
      return network;
  }
};

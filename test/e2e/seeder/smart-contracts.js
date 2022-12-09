const {
  hstBytecode,
  hstAbi,
  piggybankBytecode,
  piggybankAbi,
  nftsAbi,
  nftsBytecode,
  failingContractAbi,
  failingContractBytecode,
} = require('@metamask/test-dapp/dist/constants.json');

const hstFactory = {
  initialAmount: 100,
  tokenName: 'TST',
  decimalUnits: 4,
  tokenSymbol: 'TST',
  bytecode: hstBytecode,
  abi: hstAbi,
};

const nftsFactory = {
  bytecode: nftsBytecode,
  abi: nftsAbi,
};

const piggybankFactory = {
  bytecode: piggybankBytecode,
  abi: piggybankAbi,
};

const failingContract = {
  bytecode: failingContractBytecode,
  abi: failingContractAbi,
};

const SMART_CONTRACTS = {
  HST: 'hst',
  NFTS: 'nfts',
  PIGGYBANK: 'piggybank',
  FAILING: 'failing',
};

const contractConfiguration = {
  [SMART_CONTRACTS.HST]: hstFactory,
  [SMART_CONTRACTS.NFTS]: nftsFactory,
  [SMART_CONTRACTS.PIGGYBANK]: piggybankFactory,
  [SMART_CONTRACTS.FAILING]: failingContract,
};

module.exports = { SMART_CONTRACTS, contractConfiguration };

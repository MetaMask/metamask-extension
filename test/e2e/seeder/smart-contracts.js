const {
  hstBytecode,
  hstAbi,
  piggybankBytecode,
  piggybankAbi,
  collectiblesAbi,
  collectiblesBytecode,
  failingContractAbi,
  failingContractBytecode,
} = require('../../../node_modules/@metamask/test-dapp/dist/constants.json');

const hstFactory = {
  initialAmount: 100,
  tokenName: 'TST',
  decimalUnits: 4,
  tokenSymbol: 'TST',
  bytecode: hstBytecode,
  abi: hstAbi,
};

const collectiblesFactory = {
  bytecode: collectiblesBytecode,
  abi: collectiblesAbi,
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
  COLLECTIBLES: 'collectibles',
  PIGGYBANK: 'piggybank',
  FAILING: 'failing',
};

const contractConfiguration = {
  [SMART_CONTRACTS.HST]: hstFactory,
  [SMART_CONTRACTS.COLLECTIBLES]: collectiblesFactory,
  [SMART_CONTRACTS.PIGGYBANK]: piggybankFactory,
  [SMART_CONTRACTS.FAILING]: failingContract,
};

module.exports = { SMART_CONTRACTS, contractConfiguration };

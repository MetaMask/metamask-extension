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

const contractConfiguration = {
  hst: hstFactory,
  collectibles: collectiblesFactory,
  piggybank: piggybankFactory,
  failing: failingContract,
};

module.exports = { contractConfiguration };

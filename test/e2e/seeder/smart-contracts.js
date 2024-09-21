const {
  hstBytecode,
  hstAbi,
  piggybankBytecode,
  piggybankAbi,
  nftsAbi,
  nftsBytecode,
  erc1155Abi,
  erc1155Bytecode,
  failingContractAbi,
  failingContractBytecode,
  multisigAbi,
  multisigBytecode,
} = require('@metamask/test-dapp/dist/constants.json');
const { entrypointAbi, entrypointBytecode } = require('./contracts/entrypoint');
const {
  simpleAccountFactoryAbi,
  simpleAccountFactoryBytecode,
} = require('./contracts/simpleAccountFactory');
const {
  verifyingPaymasterAbi,
  verifyingPaymasterBytecode,
} = require('./contracts/verifyingPaymaster');

const hstFactory = {
  initialAmount: 10,
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

const erc1155Factory = {
  bytecode: erc1155Bytecode,
  abi: erc1155Abi,
};

const piggybankFactory = {
  bytecode: piggybankBytecode,
  abi: piggybankAbi,
};

const failingContract = {
  bytecode: failingContractBytecode,
  abi: failingContractAbi,
};

const multisigFactory = {
  bytecode: multisigBytecode,
  abi: multisigAbi,
};

const entrypointFactory = {
  bytecode: entrypointBytecode,
  abi: entrypointAbi,
};

const simpleAccountFactory = {
  abi: simpleAccountFactoryAbi,
  bytecode: simpleAccountFactoryBytecode,
};

const verifyingPaymasterFactory = {
  abi: verifyingPaymasterAbi,
  bytecode: verifyingPaymasterBytecode,
};

const SMART_CONTRACTS = {
  HST: 'hst',
  NFTS: 'nfts',
  ERC1155: 'erc1155',
  PIGGYBANK: 'piggybank',
  FAILING: 'failing',
  MULTISIG: 'multisig',
  ENTRYPOINT: 'entrypoint',
  SIMPLE_ACCOUNT_FACTORY: 'simpleAccountFactory',
  VERIFYING_PAYMASTER: 'verifyingPaymaster',
};

const contractConfiguration = {
  [SMART_CONTRACTS.HST]: hstFactory,
  [SMART_CONTRACTS.NFTS]: nftsFactory,
  [SMART_CONTRACTS.ERC1155]: erc1155Factory,
  [SMART_CONTRACTS.PIGGYBANK]: piggybankFactory,
  [SMART_CONTRACTS.FAILING]: failingContract,
  [SMART_CONTRACTS.MULTISIG]: multisigFactory,
  [SMART_CONTRACTS.ENTRYPOINT]: entrypointFactory,
  [SMART_CONTRACTS.SIMPLE_ACCOUNT_FACTORY]: simpleAccountFactory,
  [SMART_CONTRACTS.VERIFYING_PAYMASTER]: verifyingPaymasterFactory,
};

module.exports = { SMART_CONTRACTS, contractConfiguration };

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
const {
  delegationManagerAbi,
  delegationManagerBytecode,
} = require('./contracts/delegator/delegationManager');
const {
  delegatorEntrypointAbi,
  delegatorEntrypointBytecode,
} = require('./contracts/delegator/delegatorEntrypoint');
const {
  eip7702StatelessDeleGatorAbi,
  eip7702StatelessDeleGatorBytecode,
} = require('./contracts/delegator/eip7702StatelessDeleGator');
const {
  specificActionERC20TransferBatchEnforcerAbi,
  specificActionERC20TransferBatchEnforcerBytecode,
} = require('./contracts/delegator/specificActionERC20TransferBatchEnforcer');

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

// Delegator Contracts
const delegationManagerFactory = {
  abi: delegationManagerAbi,
  bytecode: delegationManagerBytecode,
};

const delegatorEntrypointFactory = {
  abi: delegatorEntrypointAbi,
  bytecode: delegatorEntrypointBytecode,
};

const eip7702StatelessDeleGatorFactory = {
  abi: eip7702StatelessDeleGatorAbi,
  bytecode: eip7702StatelessDeleGatorBytecode,
};

const specificActionERC20TransferBatchEnforcerFactory = {
  abi: specificActionERC20TransferBatchEnforcerAbi,
  bytecode: specificActionERC20TransferBatchEnforcerBytecode,
};

const SMART_CONTRACTS = {
  HST: 'hst',
  DELEGATOR_ENTRYPOINT: 'delegatorEntrypoint',
  DELEGATION_MANAGER: 'delegationManager',
  EIP7702_STATELESS_DELEGATOR: 'eip7702StatelessDelegator',
  ENTRYPOINT: 'entrypoint',
  ERC1155: 'erc1155',
  FAILING: 'failing',
  MULTISIG: 'multisig',
  NFTS: 'nfts',
  PIGGYBANK: 'piggybank',
  SPECIFIC_ACTION_ERC20_TRANSFER_BATCH_ENFORCER: 'specificActionERC20TransferBatchEnforcer',
  SIMPLE_ACCOUNT_FACTORY: 'simpleAccountFactory',
  VERIFYING_PAYMASTER: 'verifyingPaymaster',
};

const contractConfiguration = {
  [SMART_CONTRACTS.HST]: hstFactory,
  [SMART_CONTRACTS.DELEGATOR_ENTRYPOINT]: delegatorEntrypointFactory,
  [SMART_CONTRACTS.DELEGATION_MANAGER]: delegationManagerFactory,
  [SMART_CONTRACTS.EIP7702_STATELESS_DELEGATOR]: eip7702StatelessDeleGatorFactory,
  [SMART_CONTRACTS.ENTRYPOINT]: entrypointFactory,
  [SMART_CONTRACTS.ERC1155]: erc1155Factory,
  [SMART_CONTRACTS.FAILING]: failingContract,
  [SMART_CONTRACTS.MULTISIG]: multisigFactory,
  [SMART_CONTRACTS.NFTS]: nftsFactory,
  [SMART_CONTRACTS.PIGGYBANK]: piggybankFactory,
  [SMART_CONTRACTS.SIMPLE_ACCOUNT_FACTORY]: simpleAccountFactory,
  [SMART_CONTRACTS.SPECIFIC_ACTION_ERC20_TRANSFER_BATCH_ENFORCER]: specificActionERC20TransferBatchEnforcerFactory,
  [SMART_CONTRACTS.VERIFYING_PAYMASTER]: verifyingPaymasterFactory,
};

module.exports = { SMART_CONTRACTS, contractConfiguration };

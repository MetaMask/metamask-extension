type AbiInput = {
  name: string;
  type: string;
  indexed?: boolean;
};

type AbiOutput = { name: string; type: string };

function abiFunction(
  name: string,
  inputs: readonly AbiInput[],
  outputs: readonly AbiOutput[],
  stateMutability: 'view' | 'nonpayable' | 'pure',
) {
  return {
    constant: stateMutability === 'view' || stateMutability === 'pure',
    inputs: [...inputs],
    name,
    outputs: outputs.length ? [...outputs] : [],
    payable: false,
    stateMutability,
    type: 'function' as const,
  };
}

function abiEvent(name: string, inputs: readonly AbiInput[]) {
  return {
    anonymous: false,
    inputs: [...inputs],
    name,
    type: 'event' as const,
  };
}

const b32 = (name: string): AbiInput => ({ name, type: 'bytes32' });

const abi = [
  abiFunction('setContent', [b32('node'), b32('hash')], [], 'nonpayable'),
  abiFunction(
    'content',
    [b32('node')],
    [{ name: '', type: 'bytes32' }],
    'view',
  ),
  abiFunction(
    'supportsInterface',
    [{ name: 'interfaceID', type: 'bytes4' }],
    [{ name: '', type: 'bool' }],
    'pure',
  ),
  abiFunction(
    'setText',
    [
      b32('node'),
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    [],
    'nonpayable',
  ),
  abiFunction(
    'ABI',
    [b32('node'), { name: 'contentTypes', type: 'uint256' }],
    [
      { name: 'contentType', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    'view',
  ),
  abiFunction('setPubkey', [b32('node'), b32('x'), b32('y')], [], 'nonpayable'),
  abiFunction(
    'setContenthash',
    [b32('node'), { name: 'hash', type: 'bytes' }],
    [],
    'nonpayable',
  ),
  abiFunction('addr', [b32('node')], [{ name: '', type: 'address' }], 'view'),
  abiFunction(
    'text',
    [b32('node'), { name: 'key', type: 'string' }],
    [{ name: '', type: 'string' }],
    'view',
  ),
  abiFunction(
    'setABI',
    [
      b32('node'),
      { name: 'contentType', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    [],
    'nonpayable',
  ),
  abiFunction('name', [b32('node')], [{ name: '', type: 'string' }], 'view'),
  abiFunction(
    'setName',
    [b32('node'), { name: 'name', type: 'string' }],
    [],
    'nonpayable',
  ),
  abiFunction(
    'contenthash',
    [b32('node')],
    [{ name: '', type: 'bytes' }],
    'view',
  ),
  abiFunction(
    'pubkey',
    [b32('node')],
    [
      { name: 'x', type: 'bytes32' },
      { name: 'y', type: 'bytes32' },
    ],
    'view',
  ),
  abiFunction(
    'setAddr',
    [b32('node'), { name: 'addr', type: 'address' }],
    [],
    'nonpayable',
  ),
  {
    inputs: [{ name: 'ensAddr', type: 'address' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  abiEvent('AddrChanged', [
    { indexed: true, name: 'node', type: 'bytes32' },
    { indexed: false, name: 'a', type: 'address' },
  ]),
  abiEvent('NameChanged', [
    { indexed: true, name: 'node', type: 'bytes32' },
    { indexed: false, name: 'name', type: 'string' },
  ]),
  abiEvent('ABIChanged', [
    { indexed: true, name: 'node', type: 'bytes32' },
    { indexed: true, name: 'contentType', type: 'uint256' },
  ]),
  abiEvent('PubkeyChanged', [
    { indexed: true, name: 'node', type: 'bytes32' },
    { indexed: false, name: 'x', type: 'bytes32' },
    { indexed: false, name: 'y', type: 'bytes32' },
  ]),
  abiEvent('TextChanged', [
    { indexed: true, name: 'node', type: 'bytes32' },
    { indexed: false, name: 'indexedKey', type: 'string' },
    { indexed: false, name: 'key', type: 'string' },
  ]),
  abiEvent('ContenthashChanged', [
    { indexed: true, name: 'node', type: 'bytes32' },
    { indexed: false, name: 'hash', type: 'bytes' },
  ]),
] as const;

export default abi;

module.exports = [
    {
        'constant': false,
        'inputs': [
        {
            'name': 'owner',
            'type': 'address'
        },
        {
            'name': '_threshold',
            'type': 'uint256'
        }
        ],
        'name': 'addOwnerWithThreshold',
        'outputs': [],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'DOMAIN_SEPARATOR_TYPEHASH',
        'outputs': [
        {
            'name': '',
            'type': 'bytes32'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [
        {
            'name': 'owner',
            'type': 'address'
        }
        ],
        'name': 'isOwner',
        'outputs': [
        {
            'name': '',
            'type': 'bool'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': 'to',
            'type': 'address'
        },
        {
            'name': 'value',
            'type': 'uint256'
        },
        {
            'name': 'data',
            'type': 'bytes'
        },
        {
            'name': 'operation',
            'type': 'uint8'
        }
        ],
        'name': 'execTransactionFromModule',
        'outputs': [
        {
            'name': 'success',
            'type': 'bool'
        }
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [
        {
            'name': '',
            'type': 'bytes32'
        }
        ],
        'name': 'signedMessages',
        'outputs': [
        {
            'name': '',
            'type': 'uint256'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': 'module',
            'type': 'address'
        }
        ],
        'name': 'enableModule',
        'outputs': [],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': '_threshold',
            'type': 'uint256'
        }
        ],
        'name': 'changeThreshold',
        'outputs': [],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [
        {
            'name': '',
            'type': 'address'
        },
        {
            'name': '',
            'type': 'bytes32'
        }
        ],
        'name': 'approvedHashes',
        'outputs': [
        {
            'name': '',
            'type': 'uint256'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': '_masterCopy',
            'type': 'address'
        }
        ],
        'name': 'changeMasterCopy',
        'outputs': [],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'SENTINEL_MODULES',
        'outputs': [
        {
            'name': '',
            'type': 'address'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'SENTINEL_OWNERS',
        'outputs': [
        {
            'name': '',
            'type': 'address'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'getOwners',
        'outputs': [
        {
            'name': '',
            'type': 'address[]'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'NAME',
        'outputs': [
        {
            'name': '',
            'type': 'string'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'nonce',
        'outputs': [
        {
            'name': '',
            'type': 'uint256'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'getModules',
        'outputs': [
        {
            'name': '',
            'type': 'address[]'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'SAFE_MSG_TYPEHASH',
        'outputs': [
        {
            'name': '',
            'type': 'bytes32'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'SAFE_TX_TYPEHASH',
        'outputs': [
        {
            'name': '',
            'type': 'bytes32'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': 'prevModule',
            'type': 'address'
        },
        {
            'name': 'module',
            'type': 'address'
        }
        ],
        'name': 'disableModule',
        'outputs': [],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': 'prevOwner',
            'type': 'address'
        },
        {
            'name': 'oldOwner',
            'type': 'address'
        },
        {
            'name': 'newOwner',
            'type': 'address'
        }
        ],
        'name': 'swapOwner',
        'outputs': [],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'getThreshold',
        'outputs': [
        {
            'name': '',
            'type': 'uint256'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'domainSeparator',
        'outputs': [
        {
            'name': '',
            'type': 'bytes32'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': 'prevOwner',
            'type': 'address'
        },
        {
            'name': 'owner',
            'type': 'address'
        },
        {
            'name': '_threshold',
            'type': 'uint256'
        }
        ],
        'name': 'removeOwner',
        'outputs': [],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'VERSION',
        'outputs': [
        {
            'name': '',
            'type': 'string'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'payable': true,
        'stateMutability': 'payable',
        'type': 'fallback'
    },
    {
        'anonymous': false,
        'inputs': [
        {
            'indexed': false,
            'name': 'txHash',
            'type': 'bytes32'
        }
        ],
        'name': 'ExecutionFailed',
        'type': 'event'
    },
    {
        'anonymous': false,
        'inputs': [
        {
            'indexed': false,
            'name': 'owner',
            'type': 'address'
        }
        ],
        'name': 'AddedOwner',
        'type': 'event'
    },
    {
        'anonymous': false,
        'inputs': [
        {
            'indexed': false,
            'name': 'owner',
            'type': 'address'
        }
        ],
        'name': 'RemovedOwner',
        'type': 'event'
    },
    {
        'anonymous': false,
        'inputs': [
        {
            'indexed': false,
            'name': 'threshold',
            'type': 'uint256'
        }
        ],
        'name': 'ChangedThreshold',
        'type': 'event'
    },
    {
        'anonymous': false,
        'inputs': [
        {
            'indexed': false,
            'name': 'module',
            'type': 'address'
        }
        ],
        'name': 'EnabledModule',
        'type': 'event'
    },
    {
        'anonymous': false,
        'inputs': [
        {
            'indexed': false,
            'name': 'module',
            'type': 'address'
        }
        ],
        'name': 'DisabledModule',
        'type': 'event'
    },
    {
        'anonymous': false,
        'inputs': [
        {
            'indexed': false,
            'name': 'newContract',
            'type': 'address'
        }
        ],
        'name': 'ContractCreation',
        'type': 'event'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': '_owners',
            'type': 'address[]'
        },
        {
            'name': '_threshold',
            'type': 'uint256'
        },
        {
            'name': 'to',
            'type': 'address'
        },
        {
            'name': 'data',
            'type': 'bytes'
        }
        ],
        'name': 'setup',
        'outputs': [],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': 'to',
            'type': 'address'
        },
        {
            'name': 'value',
            'type': 'uint256'
        },
        {
            'name': 'data',
            'type': 'bytes'
        },
        {
            'name': 'operation',
            'type': 'uint8'
        },
        {
            'name': 'safeTxGas',
            'type': 'uint256'
        },
        {
            'name': 'dataGas',
            'type': 'uint256'
        },
        {
            'name': 'gasPrice',
            'type': 'uint256'
        },
        {
            'name': 'gasToken',
            'type': 'address'
        },
        {
            'name': 'refundReceiver',
            'type': 'address'
        },
        {
            'name': 'signatures',
            'type': 'bytes'
        }
        ],
        'name': 'execTransaction',
        'outputs': [
        {
            'name': 'success',
            'type': 'bool'
        }
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': 'to',
            'type': 'address'
        },
        {
            'name': 'value',
            'type': 'uint256'
        },
        {
            'name': 'data',
            'type': 'bytes'
        },
        {
            'name': 'operation',
            'type': 'uint8'
        }
        ],
        'name': 'requiredTxGas',
        'outputs': [
        {
            'name': '',
            'type': 'uint256'
        }
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': 'hashToApprove',
            'type': 'bytes32'
        }
        ],
        'name': 'approveHash',
        'outputs': [],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': '_data',
            'type': 'bytes'
        }
        ],
        'name': 'signMessage',
        'outputs': [],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': false,
        'inputs': [
        {
            'name': '_data',
            'type': 'bytes'
        },
        {
            'name': '_signature',
            'type': 'bytes'
        }
        ],
        'name': 'isValidSignature',
        'outputs': [
        {
            'name': 'isValid',
            'type': 'bool'
        }
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [
        {
            'name': 'message',
            'type': 'bytes'
        }
        ],
        'name': 'getMessageHash',
        'outputs': [
        {
            'name': '',
            'type': 'bytes32'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [
        {
            'name': 'to',
            'type': 'address'
        },
        {
            'name': 'value',
            'type': 'uint256'
        },
        {
            'name': 'data',
            'type': 'bytes'
        },
        {
            'name': 'operation',
            'type': 'uint8'
        },
        {
            'name': 'safeTxGas',
            'type': 'uint256'
        },
        {
            'name': 'dataGas',
            'type': 'uint256'
        },
        {
            'name': 'gasPrice',
            'type': 'uint256'
        },
        {
            'name': 'gasToken',
            'type': 'address'
        },
        {
            'name': 'refundReceiver',
            'type': 'address'
        },
        {
            'name': '_nonce',
            'type': 'uint256'
        }
        ],
        'name': 'encodeTransactionData',
        'outputs': [
        {
            'name': '',
            'type': 'bytes'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'constant': true,
        'inputs': [
        {
            'name': 'to',
            'type': 'address'
        },
        {
            'name': 'value',
            'type': 'uint256'
        },
        {
            'name': 'data',
            'type': 'bytes'
        },
        {
            'name': 'operation',
            'type': 'uint8'
        },
        {
            'name': 'safeTxGas',
            'type': 'uint256'
        },
        {
            'name': 'dataGas',
            'type': 'uint256'
        },
        {
            'name': 'gasPrice',
            'type': 'uint256'
        },
        {
            'name': 'gasToken',
            'type': 'address'
        },
        {
            'name': 'refundReceiver',
            'type': 'address'
        },
        {
            'name': '_nonce',
            'type': 'uint256'
        }
        ],
        'name': 'getTransactionHash',
        'outputs': [
        {
            'name': '',
            'type': 'bytes32'
        }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    }
    ]
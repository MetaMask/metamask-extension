const { strict: assert } = require('assert');
const testCoverage = require('@open-rpc/test-coverage').default;
const { parseOpenRPCDocument } = require('@open-rpc/schema-utils-js');
const mockServer = require('@open-rpc/mock-server/build/index').default;

const FixtureBuilder = require('../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  // DAPP_ONE_URL,
  // regularDelayMs,
  // WINDOW_TITLES,
  defaultGanacheOptions,
  // largeDelayMs,
  // switchToNotificationWindow,
} = require('../helpers');
const { PAGES } = require('../webdriver/driver');

let openrpcDocument = {
  openrpc: '1.2.4',
  info: {
    title: 'JSON-RPC API',
    version: '1.0.0',
    description:
      "This section provides an interactive reference for the JSON-RPC API of MetaMask's [Wallet API](/wallet/concepts/wallet-api). The API builds on a set of standard Ethereum methods with MetaMask-specific enhancements, and is designed for seamless integration into dapps.\n\nView the JSON-RPC API methods by selecting a method in the left sidebar. You can test the methods directly in the page using the API playground, with pre-configured examples or custom parameters. You can also save URLs with custom parameters using your browser's bookmarks.\n\nEach method may have one or more of the following labels:\n\n- **MetaMask** - The functionalities of these methods are specific to MetaMask, and may or may not be supported by other wallets.\n- **Restricted** - These methods are restricted and require requesting permission using [`wallet_requestPermissions`](/wallet/reference/wallet_requestpermissions)\n- **Mobile** - These methods are only available on MetaMask Mobile.\n- **Snaps** - These methods are related to interacting with [Snaps](/snaps).\n- **Experimental** - These methods are experimental and may be changed in the future.\n- **Deprecated** - These methods are deprecated and may be removed in the future.\n- **Ethereum API** - These are standard Ethereum JSON-RPC API methods. See the [Ethereum wiki](https://eth.wiki/json-rpc/API#json-rpc-methods) for more information about these methods.",
  },
  servers: [
    {
      name: 'mock',
      url: 'http://localhost:3333',
    },
  ],
  methods: [
    {
      name: 'wallet_addEthereumChain',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
      ],
      summary: 'Adds an Ethereum chain to the wallet.',
      description:
        'Creates a confirmation asking the user to add the specified chain to the wallet application. The caller must specify a chain ID and some chain metadata. The wallet application may refuse or accept the request. `null` is returned if the chain is added, and an error otherwise. Introduced by [EIP-3085](https://eips.ethereum.org/EIPS/eip-3085).',
      params: [
        {
          name: 'AddEthereumChainParameter',
          schema: {
            $ref: '#/components/schemas/AddEthereumChainParameter',
          },
        },
      ],
      errors: [
        {
          code: -32602,
          message:
            "Expected null or array with at least one valid string HTTPS URL 'blockExplorerUrl'. Received: ${blockExplorerUrls}",
        },
        {
          code: -32602,
          message:
            "Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}",
        },
        {
          code: -32602,
          message:
            'Invalid chain ID "${_chainId}": numerical value greater than max safe value. Received:\n${chainId}',
        },
        {
          code: -32602,
          message: 'May not specify default MetaMask chain.',
        },
        {
          code: -32602,
          message:
            "Expected 2-6 character string 'nativeCurrency.symbol'. Received:\n${ticker}",
        },
        {
          code: -32602,
          message:
            'nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\n${ticker}',
        },
      ],
      result: {
        name: 'AddEthereumChainResult',
        schema: {
          type: 'null',
        },
      },
      examples: [
        {
          name: 'wallet_addEthereumChain example',
          params: [
            {
              name: 'AddEthereumChainParameter',
              value: {
                chainId: '0x64',
                chainName: 'Gnosis',
                rpcUrls: ['https://rpc.ankr.com/gnosis'],
                iconUrls: [
                  'https://xdaichain.com/fake/example/url/xdai.svg',
                  'https://xdaichain.com/fake/example/url/xdai.png',
                ],
                nativeCurrency: {
                  name: 'xDAI',
                  symbol: 'xDAI',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://blockscout.com/poa/xdai/'],
              },
            },
          ],
          result: {
            name: 'wallet_addEthereumChainExampleResult',
            value: 'null',
          },
        },
      ],
    },
    {
      name: 'wallet_switchEthereumChain',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
      ],
      summary: "Switches the wallet's active Ethereum chain.",
      description:
        'Requests that the wallet switches its active Ethereum chain. Introduced by [EIP-3326](https://ethereum-magicians.org/t/eip-3326-wallet-switchethereumchain).',
      params: [
        {
          name: 'SwitchEthereumChainParameter',
          schema: {
            title: 'SwitchEthereumChainParameter',
            type: 'object',
            required: ['chainId'],
            properties: {
              chainId: {
                description:
                  'The chain ID as a `0x`-prefixed hexadecimal string, per the `eth_chainId` method.',
                type: 'string',
              },
            },
          },
        },
      ],
      result: {
        name: 'SwitchEthereumChainResult',
        schema: {
          type: 'null',
        },
      },
      errors: [
        {
          code: 4902,
          message:
            'Unrecognized chain ID. Try adding the chain using wallet_addEthereumChain first.',
        },
      ],
      examples: [
        {
          name: 'wallet_switchEthereumChain example',
          params: [
            {
              name: 'SwitchEthereumChainParameter',
              value: {
                chainId: '0x64',
              },
            },
          ],
          result: {
            name: 'wallet_switchEthereumChainExampleResult',
            value: 'null',
          },
        },
      ],
    },
    {
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
      ],
      name: 'wallet_getPermissions',
      summary: "Gets the user's permissions.",
      description:
        "Gets the user's permissions. Introduced by [EIP-2255](https://eips.ethereum.org/EIPS/eip-2255).",
      params: [],
      result: {
        name: 'PermissionsList',
        schema: {
          $ref: '#/components/schemas/PermissionsList',
        },
      },
    },
    {
      name: 'wallet_requestPermissions',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
      ],
      summary: 'Requests additional permissions.',
      description:
        'Requests additional permissions from the user. Introduced by [EIP-2255](https://eips.ethereum.org/EIPS/eip-2255).',
      params: [
        {
          name: 'requestPermissionsObject',
          required: true,
          schema: {
            $ref: '#/components/schemas/PermissionObject',
          },
        },
      ],
      result: {
        name: 'PermissionsList',
        schema: {
          $ref: '#/components/schemas/PermissionsList',
        },
      },
      examples: [
        {
          name: 'wallet_requestPermissions example of requesting the eth_accounts permission',
          params: [
            {
              name: 'requestPermissionObject',
              value: {
                eth_accounts: {},
              },
            },
          ],
          result: {
            name: 'permissionList',
            value: {
              eth_accounts: {},
            },
          },
        },
        {
          name: 'wallet_requestPermissions example of requesting the wallet_snap permission',
          params: [
            {
              name: 'requestPermissionObject',
              value: {
                wallet_snap: {
                  caveats: [
                    {
                      type: 'snapIds',
                      value: {
                        'npm:@metamask/example-snap': {
                          version: '1.0.0',
                        },
                        'npm:fooSnap': {
                          version: '1.2.1',
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
          result: {
            name: 'permissionList',
            value: {
              wallet_snap: {
                caveats: [
                  {
                    type: 'snapIds',
                    value: {
                      'npm:@metamask/example-snap': {
                        version: '1.0.0',
                      },
                      'npm:fooSnap': {
                        version: '1.2.1',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      ],
      errors: [
        {
          $ref: '#/components/errors/UserRejected',
        },
      ],
    },
    {
      name: 'wallet_revokePermissions',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Experimental',
        },
      ],
      summary: 'Revokes the current dapp permissions.',
      description:
        'Revokes previously granted permissions for the current dapp identified by origin. This method is specified by [MIP-2](https://github.com/MetaMask/metamask-improvement-proposals/blob/main/MIPs/mip-2.md) and is only available for the browser extension.',
      params: [
        {
          name: 'revokePermissionObject',
          required: true,
          schema: {
            $ref: '#/components/schemas/PermissionObject',
          },
        },
      ],
      result: {
        name: 'RevokePermissionsResult',
        schema: {
          type: 'null',
        },
      },
      errors: [],
      examples: [
        {
          name: 'wallet_revokePermissions example of revoking the eth_accounts permission',
          params: [
            {
              name: 'revokePermissionObject',
              value: {
                eth_accounts: {},
              },
            },
          ],
          result: {
            name: 'RevokePermissionsResult',
            value: null,
          },
        },
      ],
    },
    {
      name: 'personal_sign',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Restricted',
        },
      ],
      summary: 'Presents a plain text signature challenge to the user.',
      description:
        'Presents a plain text signature challenge to the user and returns the signed response. Equivalent to `eth_sign` on some other wallets, and prepends a safe prefix to the signed message to prevent the challenge tricking users into signing a financial transaction. This method requires that the user has granted permission to interact with their account first, so make sure to call `eth_requestAccounts` first.',
      deprecated: false,
      params: [
        {
          name: 'Challenge',
          required: true,
          description:
            'A hex-encoded UTF-8 string to present to the user. See how to encode a string like this in the [`browser-string-hexer`](https://github.com/danfinlay/browser-string-hexer) module.',
          schema: {
            type: 'string',
            pattern: '^0x[a-fA-F\\d]+$',
          },
        },
        {
          name: 'Address',
          required: true,
          description: 'The address of the requested signing account.',
          schema: {
            $ref: '#/components/schemas/address',
          },
        },
      ],
      result: {
        name: 'Signature',
        description: 'A hex-encoded 129-byte array starting with `0x`.',
        schema: {
          $ref: '#/components/schemas/bytes',
        },
      },
    },
    {
      name: 'eth_signTypedData_v4',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Restricted',
        },
      ],
      summary: 'Presents a structured data message for the user to sign.',
      description:
        'Presents a data message for the user to sign in a structured and readable format and returns the signed response. Introduced by [EIP-712](https://eips.ethereum.org/EIPS/eip-712).',
      params: [
        {
          name: 'Address',
          required: true,
          description: 'The address of the requested signing account.',
          schema: {
            $ref: '#/components/schemas/address',
          },
        },
        {
          name: 'TypedData',
          required: true,
          schema: {
            $ref: '#/components/schemas/TypedData',
          },
        },
      ],
      result: {
        name: 'Signature',
        schema: {
          $ref: '#/components/schemas/bytes',
        },
      },
      examples: [
        {
          name: 'eth_SignTypedData_v4 example',
          params: [
            {
              name: 'Address',
              value: '0x0000000000000000000000000000000000000000',
            },
            {
              name: 'TypedData',
              value: {
                types: {
                  EIP712Domain: [
                    {
                      name: 'name',
                      type: 'string',
                    },
                    {
                      name: 'version',
                      type: 'string',
                    },
                    {
                      name: 'chainId',
                      type: 'uint256',
                    },
                    {
                      name: 'verifyingContract',
                      type: 'address',
                    },
                  ],
                  Person: [
                    {
                      name: 'name',
                      type: 'string',
                    },
                    {
                      name: 'wallet',
                      type: 'address',
                    },
                  ],
                  Mail: [
                    {
                      name: 'from',
                      type: 'Person',
                    },
                    {
                      name: 'to',
                      type: 'Person',
                    },
                    {
                      name: 'contents',
                      type: 'string',
                    },
                  ],
                },
                primaryType: 'Mail',
                domain: {
                  name: 'Ether Mail',
                  version: '1',
                  chainId: 1,
                  verifyingContract:
                    '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
                },
                message: {
                  from: {
                    name: 'Cow',
                    wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
                  },
                  to: {
                    name: 'Bob',
                    wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                  },
                  contents: 'Hello, Bob!',
                },
              },
            },
          ],
          result: {
            name: 'Signature',
            value:
              '0x4355c47d63924e8a72e509b65029052eb6c299d53a04e167c5775fd466751c9d07299936d304c153f6443dfa05f40ff007d72911b6f72307f996231605b915621c',
          },
        },
      ],
    },
    {
      name: 'wallet_registerOnboarding',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
      ],
      summary: 'Redirects the user back to the site after onboarding.',
      description:
        "Registers the requesting site with MetaMask as the initiator of onboarding, enabling MetaMask to redirect the user back to the site after onboarding. Returns a promise that resolves to `true`, or rejects if there's an error. Instead of calling this method directly, you should use the [`@metamask/onboarding`](https://github.com/MetaMask/metamask-onboarding) library.",
      params: [],
      result: {
        name: 'RegisterOnboardingResult',
        description: '`true` if the request was successful, `false` otherwise.',
        schema: {
          type: 'boolean',
        },
      },
    },
    {
      name: 'wallet_watchAsset',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Experimental',
        },
      ],
      summary: 'Tracks a token in MetaMask.',
      description:
        'Requests that the user track the specified token in MetaMask. Returns a boolean indicating if the token was successfully added. Once added, the token is indistinguishable from those added using legacy methods, such as a centralized registry. Introduced by [EIP-747](https://eips.ethereum.org/EIPS/eip-747).',
      paramStructure: 'by-name',
      params: [
        {
          name: 'type',
          schema: {
            type: 'string',
            description:
              'Supports ERC-20, ERC-721, and ERC-1155 tokens. Support for ERC-721 and ERC-1155 tokens is experimental and currently only available on the extension (not on mobile). See [MIP-1](https://github.com/MetaMask/metamask-improvement-proposals/blob/main/MIPs/mip-1.md) and [MIP proposal lifecycle](https://github.com/MetaMask/metamask-improvement-proposals/blob/main/PROCESS-GUIDE.md#proposal-lifecycle) for more information.',
            enum: ['ERC20', 'ERC721', 'ERC1155'],
          },
          required: true,
        },
        {
          name: 'options',
          schema: {
            title: 'WatchAssetOptions',
            type: 'object',
            required: ['address'],
            properties: {
              address: {
                description: 'The address of the token contract.',
                type: 'string',
              },
              symbol: {
                description:
                  'A ticker symbol or shorthand, up to 11 characters (optional for ERC-20 tokens).',
                minLength: 2,
                maxLength: 11,
                type: 'string',
              },
              decimals: {
                description:
                  'The number of token decimals (optional for ERC-20 tokens).',
                type: 'number',
              },
              image: {
                description:
                  'A string URL of the token logo (optional for ERC-20 tokens).',
                type: 'string',
              },
              tokenId: {
                description:
                  'The unique identifier of the NFT (required for ERC-721 and ERC-1155 tokens).',
                type: 'string',
              },
            },
          },
        },
      ],
      errors: [
        {
          code: -32602,
          message: 'Must specify address, symbol, and decimals.',
        },
        {
          code: -32602,
          message: 'Invalid symbol: not a string.',
        },
        {
          code: -32602,
          message: "Invalid symbol '${symbol}': longer than 11 characters.",
        },
        {
          code: -32602,
          message: "Invalid decimals '${decimals}': must be 0 <= 36.",
        },
        {
          code: -32602,
          message: "Invalid address '${address}'.",
        },
        {
          code: -32602,
          message: 'Asset type is required.',
        },
        {
          code: -32602,
          message: 'Both address and tokenId are required.',
        },
        {
          code: -32602,
          message: 'Invalid address.',
        },
        {
          code: -32000,
          message: 'Suggested NFT is not owned by the selected account.',
        },
        {
          code: -32000,
          message:
            'Suggested NFT of type ${standard} does not match received type ${type}.',
        },
        {
          code: -32002,
          message:
            "Unable to verify ownership. Possibly because the standard is not supported or the user's currently selected network does not match the chain of the asset in question.",
        },
      ],
      result: {
        name: 'WatchAssetResult',
        description: '`true` if the token was added, `false` otherwise.',
        schema: {
          type: 'boolean',
        },
      },
      examples: [
        {
          name: 'wallet_watchAsset ERC-20 example',
          params: [
            {
              name: 'type',
              value: 'ERC20',
            },
            {
              name: 'options',
              value: {
                address: '0xb60e8dd61c5d32be8058bb8eb970870f07233155',
                symbol: 'FOO',
                decimals: 18,
                image: 'https://foo.io/token-image.svg',
              },
            },
          ],
          result: {
            name: 'wallet_watchAssetExampleResult',
            value: true,
          },
        },
        {
          name: 'wallet_watchAsset ERC-721 example',
          params: [
            {
              name: 'type',
              value: 'ERC721',
            },
            {
              name: 'options',
              value: {
                address: '0x123456789abcdef0123456789abcdef01234567',
                tokenId: '42',
              },
            },
          ],
          result: {
            name: 'wallet_watchAssetERC721ExampleResult',
            value: true,
          },
        },
        {
          name: 'wallet_watchAsset ERC-1155 example',
          params: [
            {
              name: 'type',
              value: 'ERC1155',
            },
            {
              name: 'options',
              value: {
                address: '0xabcdef0123456789abcdef0123456789abcdef01',
                tokenId: '1337',
              },
            },
          ],
          result: {
            name: 'wallet_watchAssetERC1155ExampleResult',
            value: true,
          },
        },
      ],
    },
    {
      name: 'wallet_scanQRCode',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Mobile',
        },
      ],
      summary: 'Requests that the user scan a QR code.',
      description:
        'Requests that the user scan a QR code using their device camera. Introduced by [EIP-945](https://github.com/ethereum/EIPs/issues/945).',
      params: [
        {
          name: 'regex',
          required: false,
          description:
            'An array containing a regular expression (regex) string for matching arbitrary QR code strings.',
          schema: {
            type: 'array',
            title: 'regex',
          },
        },
      ],
      result: {
        name: 'ScanQRCodeResult',
        description:
          'A string corresponding to the scanned QR code. If a regex string is provided, the resulting string matches it. If no regex string is provided, the resulting string matches an Ethereum address. If neither condition is met, the method returns an error.',
        schema: {
          type: 'string',
          title: 'ScanQRCodeResult',
        },
      },
    },
    {
      name: 'wallet_getSnaps',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Snaps',
        },
      ],
      summary: "Gets the dapp's permitted Snaps.",
      description:
        "Returns the IDs of the dapp's permitted Snaps and some relevant metadata.",
      params: [],
      result: {
        name: 'GetSnapsResult',
        description:
          'An object mapping the IDs of permitted Snaps to their metadata.',
        schema: {
          $ref: '#/components/schemas/SnapsMap',
        },
      },
      examples: [
        {
          name: 'wallet_getSnaps example',
          params: [],
          result: {
            name: 'wallet_getSnapsResult',
            value: {
              'npm:@metamask/example-snap': {
                version: '1.0.0',
                id: 'npm:@metamask/example-snap',
                enabled: true,
                blocked: false,
              },
            },
          },
        },
      ],
    },
    {
      name: 'wallet_requestSnaps',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Snaps',
        },
      ],
      summary: 'Requests permission to communicate with Snaps.',
      description:
        "Requests permission for a dapp to communicate with the specified Snaps and attempts to install them if they're not already installed. If the installation of any Snap fails, returns the error that caused the failure.",
      params: [
        {
          name: 'RequestSnapsParameter',
          description:
            'An object mapping the IDs of requested Snaps to optional SemVer version ranges.',
          required: true,
          schema: {
            title: 'RequestSnapsParameter',
            type: 'object',
            properties: {
              id: {
                type: 'object',
                properties: {
                  version: {
                    description:
                      '(Optional) A SemVer version range for the Snap. This uses the same semantics as npm package.json ranges. If specified, MetaMask attempts to install a version of the Snap that satisfies the range. If a compatible version of the Snap is already installed, the request succeeds. If an incompatible version is installed, MetaMask attempts to update the Snap to the latest version that satisfies the range. The request succeeds if the Snap is succesfully installed.',
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      ],
      result: {
        name: 'RequestSnapsResult',
        description:
          'An object mapping the IDs of installed Snaps to their metadata.',
        schema: {
          $ref: '#/components/schemas/SnapsMap',
        },
      },
      examples: [
        {
          name: 'wallet_requestSnaps example',
          params: [
            {
              name: 'RequestSnapsParameter',
              value: {
                'npm:@metamask/example-snap': {},
                'npm:fooSnap': {
                  version: '^1.0.2',
                },
              },
            },
          ],
          result: {
            name: 'wallet_requestSnapsResult',
            value: {
              'npm:@metamask/example-snap': {
                version: '1.0.0',
                id: 'npm:@metamask/example-snap',
                enabled: true,
                blocked: false,
              },
              'npm:fooSnap': {
                version: '1.0.5',
                id: 'npm:fooSnap',
                enabled: true,
                blocked: false,
              },
            },
          },
        },
      ],
    },
    {
      name: 'wallet_snap',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Snaps',
        },
        {
          $ref: '#/components/tags/Restricted',
        },
      ],
      summary: 'Calls a Snap method.',
      description:
        'Calls the specified JSON-RPC API method of the specified Snap. The Snap must be installed and the dapp must have permission to communicate with the Snap, or the request is rejected. The dapp can install the Snap and request permission to communicate with it using `wallet_requestSnaps`.\n\n This method is synonymous to `wallet_invokeSnap`.',
      params: [
        {
          name: 'SnapParameter',
          required: true,
          schema: {
            title: 'SnapParameter',
            type: 'object',
            properties: {
              snapId: {
                description: 'The ID of the Snap to invoke.',
                type: 'string',
              },
              request: {
                description:
                  'The JSON-RPC request object to send to the invoked Snap.',
                type: 'object',
                properties: {
                  method: {
                    type: 'string',
                  },
                  params: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      ],
      result: {
        name: 'SnapResult',
        description: 'Result of the Snap method call.',
        schema: {
          title: 'SnapResult',
          type: 'object',
        },
      },
      examples: [
        {
          name: 'wallet_snap example',
          params: [
            {
              name: 'SnapParameter',
              value: {
                snapId: 'npm:@metamask/example-snap',
                request: {
                  method: 'hello',
                },
              },
            },
          ],
          result: {
            name: 'wallet_snapResult',
            value: {},
          },
        },
      ],
    },
    {
      name: 'wallet_invokeSnap',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Snaps',
        },
        {
          $ref: '#/components/tags/Restricted',
        },
      ],
      summary: 'Calls a Snap method.',
      description:
        'Calls the specified JSON-RPC API method of the specified Snap. The Snap must be installed and the dapp must have permission to communicate with the Snap, or the request is rejected. The dapp can install the Snap and request permission to communicate with it using `wallet_requestSnaps`.\n\n This method is synonymous to `wallet_snap`.',
      params: [
        {
          name: 'InvokeSnapParameter',
          required: true,
          schema: {
            title: 'InvokeSnapParameter',
            type: 'object',
            properties: {
              snapId: {
                description: 'The ID of the Snap to invoke.',
                type: 'string',
              },
              request: {
                description:
                  'The JSON-RPC request object to send to the invoked Snap.',
                type: 'object',
                properties: {
                  method: {
                    type: 'string',
                  },
                  params: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      ],
      result: {
        name: 'InvokeSnapResult',
        description: 'Result of the Snap method call.',
        schema: {
          title: 'InvokeSnapResult',
          type: 'object',
        },
      },
      examples: [
        {
          name: 'wallet_invokeSnap example',
          params: [
            {
              name: 'InvokeSnapParameter',
              value: {
                snapId: 'npm:@metamask/example-snap',
                request: {
                  method: 'hello',
                },
              },
            },
          ],
          result: {
            name: 'wallet_invokeSnapResult',
            value: {},
          },
        },
      ],
    },
    {
      name: 'eth_requestAccounts',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
      ],
      description:
        'Requests that the user provide an Ethereum address to be identified by. This method is specified by [EIP-1102](https://eips.ethereum.org/EIPS/eip-1102). Internally, this method calls `wallet_requestPermissions` for permission to call `eth_accounts`.',
      summary: 'Requests that the user provide an Ethereum address.',
      params: [],
      result: {
        name: 'AddressList',
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/address',
          },
        },
      },
      errors: [
        {
          $ref: '#/components/errors/UserRejected',
        },
      ],
    },
    {
      name: 'eth_accounts',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Restricted',
        },
      ],
      description:
        'Returns a list of addresses for the accounts owned by the user.',
      summary: "Gets a list of addresses for the user's accounts.",
      params: [],
      result: {
        name: 'AddressList',
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/address',
          },
        },
      },
    },
    {
      name: 'eth_sendTransaction',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Restricted',
        },
      ],
      description:
        "Creates a new wallet confirmation to make an Ethereum transaction from the user's account. This method requires that the user has granted permission to interact with their account first, so make sure to call `eth_requestAccounts` or `wallet_requestPermissions` first.",
      summary: 'Initiates a new transaction.',
      params: [
        {
          name: 'Transaction',
          required: true,
          description: 'The transaction object to sign and send.',
          schema: {
            type: 'object',
            title: 'Transaction',
            description:
              'The parameters to customize a transaction. If a `to` address is not provided. It will be assumed that the transaction is a contract creation transaction, and the `data` field of the transaction will be used as the contract initialization code. `gasPrice` cannot be used together with `maxPriorityFeePerGas` and `maxFeePerGas`.',
            required: ['from'],
            if: {
              properties: {
                to: {
                  not: {
                    type: 'string',
                  },
                },
              },
            },
            then: {
              required: ['data'],
            },
            properties: {
              to: {
                title: 'to address',
                $ref: '#/components/schemas/address',
              },
              from: {
                title: 'from address',
                $ref: '#/components/schemas/address',
              },
              gas: {
                title: 'gas limit',
                $ref: '#/components/schemas/uint',
              },
              value: {
                title: 'value',
                $ref: '#/components/schemas/uint',
              },
              data: {
                title: 'data',
                $ref: '#/components/schemas/bytes',
              },
              gasPrice: {
                title: 'gas price',
                description:
                  'The gas price the sender is willing to pay to miners in wei. Used in pre-1559 transactions.',
                $ref: '#/components/schemas/uint',
              },
              maxPriorityFeePerGas: {
                title: 'max priority fee per gas',
                description:
                  'Maximum fee per gas the sender is willing to pay to miners in wei. Used in 1559 transactions.',
                $ref: '#/components/schemas/uint',
              },
              maxFeePerGas: {
                title: 'max fee per gas',
                description:
                  'The maximum total fee per gas the sender is willing to pay (includes the network / base fee and miner / priority fee) in wei. Used in 1559 transactions.',
                $ref: '#/components/schemas/uint',
              },
            },
          },
        },
      ],
      result: {
        name: 'TransactionHash',
        description: 'The transaction hash of the sent transaction.',
        schema: {
          $ref: '#/components/schemas/bytes32',
        },
      },
    },
    {
      name: 'eth_decrypt',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Restricted',
        },
        {
          $ref: '#/components/tags/Deprecated',
        },
      ],
      summary: 'Decrypts an encrypted message.',
      description:
        'This method is deprecated and may be removed in the future.\n\n Requests that MetaMask decrypt the specified encrypted message. The message must have been encrypted using the public encryption key of the specified Ethereum address. Returns a promise that resolves to the decrypted message, or rejects if the decryption attempt fails.',
      params: [
        {
          name: 'EncryptedMessage',
          required: true,
          description: 'The encrypted message to decrypt.',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'Address',
          required: true,
          description:
            'The address of the Ethereum account that can decrypt the message.',
          schema: {
            $ref: '#/components/schemas/address',
          },
        },
      ],
      result: {
        name: 'PermissionsList',
        schema: {
          $ref: '#/components/schemas/PermissionsList',
        },
      },
    },
    {
      name: 'eth_getEncryptionPublicKey',
      tags: [
        {
          $ref: '#/components/tags/MetaMask',
        },
        {
          $ref: '#/components/tags/Restricted',
        },
        {
          $ref: '#/components/tags/Deprecated',
        },
      ],
      summary: 'Gets a public key used for encryption.',
      description:
        'This method is deprecated and may be removed in the future.\n\n Requests that the user share their public encryption key. Returns a public encryption key, or rejects if the user denies the request. The public key is computed from entropy associated with the specified user account, using the NaCl implementation of the `X25519_XSalsa20_Poly1305` algorithm.',
      params: [
        {
          name: 'Address',
          required: true,
          description:
            'The address of the Ethereum account that can decrypt the message.',
          schema: {
            $ref: '#/components/schemas/address',
          },
        },
      ],
      result: {
        name: 'EncryptionKey',
        schema: {
          type: 'string',
        },
      },
    },
    {
      name: 'web3_clientVersion',
      tags: [
        {
          $ref: '#/components/tags/Ethereum',
        },
      ],
      description:
        'Returns the current MetaMask client version. This differs slightly per client. For example, the browser extension returns a string like `MetaMask/v10.33.1`, while the mobile app returns a string like `MetaMask/8.1.2/Mobile`.',
      summary: 'Current client version.',
      params: [],
      examples: [
        {
          name: 'MetaMaskClientVersionExample',
          description: 'Example version response from MetaMask.',
          params: [],
          result: {
            name: 'MetaMaskClientVersion',
            description: 'The current client version.',
            value: 'MetaMask/v10.33.1',
          },
        },
        {
          name: 'MetaMaskMobileClientVersionExample',
          description: 'Example version response from MetaMask Mobile.',
          params: [],
          result: {
            name: 'MetaMaskClientVersion',
            description: 'The current client version.',
            value: 'MetaMask/8.1.2/Mobile',
          },
        },
      ],
      result: {
        name: 'CurrentVersion',
        description: 'The current client version.',
        schema: {
          title: 'CurrentClientVersion',
          type: 'string',
        },
      },
    },
    {
      name: 'eth_subscribe',
      tags: [
        {
          $ref: '#/components/tags/Ethereum',
        },
      ],
      summary:
        'Subscribes to specific Ethereum events, returning a subscription ID used to receive notifications.',
      description:
        'Subscribes to specific events on the Ethereum network, such as new blocks, new pending transactions, or changes in the state of an account. When an event occurs, a notification is sent to the client with the corresponding data. To stop receiving notifications, the client can unsubscribe using `eth_unsubscribe`.',
      params: [
        {
          name: 'subscriptionType',
          required: true,
          schema: {
            title: 'subscriptionType',
            type: 'string',
            enum: ['newHeads', 'logs', 'newPendingTransactions', 'syncing'],
            description:
              'The type of subscription to create. Must be one of the following:\n1. `newHeads` - New block headers.\n2. `logs` - Logs matching a filter object.\n3. `newPendingTransactions` - New pending transactions.\n4. `syncing` - Changes in syncing status.',
          },
        },
        {
          name: 'filterOptions',
          required: false,
          schema: {
            title: 'filterOptions',
            type: 'object',
            description:
              '(Optional) An object containing filter options specific to the subscription type. Only applicable for the `logs` subscription type.',
            required: ['topics'],
            properties: {
              address: {
                type: 'string',
                description:
                  '(Optional) A single address or an array of addresses to filter the logs by.',
              },
              topics: {
                type: 'array',
                description: 'An array of topics to filter the logs by.',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
      result: {
        name: 'subscriptionId',
        schema: {
          type: 'string',
        },
        description:
          'A unique subscription ID that can be used to unsubscribe or identify incoming notifications.',
      },
      examples: [
        {
          name: 'eth_subscribe example',
          params: [
            {
              name: 'subscriptionType',
              value: 'newHeads',
            },
          ],
          result: {
            name: 'eth_subscribeExampleResult',
            value: '0x1b84f2cdf29a204b79e450c1939b30c1',
          },
        },
      ],
    },
    {
      name: 'eth_unsubscribe',
      tags: [
        {
          $ref: '#/components/tags/Ethereum',
        },
      ],
      summary:
        'Unsubscribes from a specific Ethereum event, using the subscription ID provided by `eth_subscribe`.',
      description:
        'Unsubscribes from specific events on the Ethereum network, to which the client has been previously subscribed using `eth_subscribe`. The client must provide the subscription ID obtained from `eth_subscribe` to stop receiving notifications for the corresponding event.',
      params: [
        {
          name: 'subscriptionId',
          required: true,
          schema: {
            type: 'string',
            description:
              'The unique subscription ID obtained from `eth_subscribe`, used to identify the subscription to be unsubscribed.',
          },
        },
      ],
      result: {
        name: 'unsubscribed',
        schema: {
          type: 'boolean',
        },
        description:
          'A boolean value indicating whether the unsubscription was successful.',
      },
      examples: [
        {
          name: 'eth_unsubscribe example',
          params: [
            {
              name: 'subscriptionId',
              value: '0x1b84f2cdf29a204b79e450c1939b30c1',
            },
          ],
          result: {
            name: 'eth_unsubscribeExampleResult',
            value: true,
          },
        },
      ],
    },
    {
      name: 'eth_blobBaseFee',
      summary: 'Returns the base fee per blob gas in wei.',
      params: [],
      result: {
        name: 'Blob gas base fee',
        schema: {
          title: 'Blob gas base fee',
          $ref: '#/components/schemas/uint',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_blockNumber',
      summary: 'Returns the number of most recent block.',
      params: [],
      result: {
        name: 'Block number',
        schema: {
          $ref: '#/components/schemas/uint',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_call',
      summary:
        'Executes a new message call immediately without creating a transaction on the block chain.',
      params: [
        {
          name: 'Transaction',
          required: true,
          schema: {
            $ref: '#/components/schemas/GenericTransaction',
          },
        },
        {
          name: 'Block',
          required: false,
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTagOrHash',
          },
        },
      ],
      result: {
        name: 'Return data',
        schema: {
          $ref: '#/components/schemas/bytes',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_chainId',
      summary: 'Returns the chain ID of the current network.',
      params: [],
      result: {
        name: 'Chain ID',
        schema: {
          $ref: '#/components/schemas/uint',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_coinbase',
      summary: 'Returns the client coinbase address.',
      params: [],
      result: {
        name: 'Coinbase address',
        schema: {
          $ref: '#/components/schemas/address',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_estimateGas',
      summary:
        'Generates and returns an estimate of how much gas is necessary to allow the transaction to complete.',
      params: [
        {
          name: 'Transaction',
          required: true,
          schema: {
            $ref: '#/components/schemas/GenericTransaction',
          },
        },
        {
          name: 'Block',
          required: false,
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTag',
          },
        },
      ],
      result: {
        name: 'Gas used',
        schema: {
          $ref: '#/components/schemas/uint',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_feeHistory',
      summary: 'Transaction fee history',
      description:
        'Returns transaction base fee per gas and effective priority fee per gas for the requested/supported block range.',
      params: [
        {
          name: 'blockCount',
          description:
            'Requested range of blocks. Clients will return less than the requested range if not all blocks are available.',
          required: true,
          schema: {
            $ref: '#/components/schemas/uint',
          },
        },
        {
          name: 'newestBlock',
          description: 'Highest block of the requested range.',
          required: true,
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTag',
          },
        },
        {
          name: 'rewardPercentiles',
          description:
            'A monotonically increasing list of percentile values. For each block in the requested range, the transactions will be sorted in ascending order by effective tip per gas and the coresponding effective tip for the percentile will be determined, accounting for gas consumed.',
          required: true,
          schema: {
            title: 'rewardPercentiles',
            type: 'array',
            items: {
              title: 'rewardPercentile',
              description: 'Floating point value between 0 and 100.',
              type: 'number',
            },
          },
        },
      ],
      result: {
        name: 'feeHistoryResult',
        description:
          'Fee history for the returned block range. This can be a subsection of the requested range if not all blocks are available.',
        schema: {
          title: 'feeHistoryResults',
          description: 'Fee history results.',
          type: 'object',
          required: ['oldestBlock', 'baseFeePerGas', 'gasUsedRatio'],
          additionalProperties: false,
          properties: {
            oldestBlock: {
              title: 'oldestBlock',
              description: 'Lowest number block of returned range.',
              $ref: '#/components/schemas/uint',
            },
            baseFeePerGas: {
              title: 'baseFeePerGasArray',
              description:
                'An array of block base fees per gas. This includes the next block after the newest of the returned range, because this value can be derived from the newest block. Zeroes are returned for pre-EIP-1559 blocks.',
              type: 'array',
              items: {
                $ref: '#/components/schemas/uint',
              },
            },
            baseFeePerBlobGas: {
              title: 'baseFeePerBlobGasArray',
              description:
                'An array of block base fees per blob gas. This includes the next block after the newest of the returned range, because this value can be derived from the newest block. Zeroes are returned for pre-EIP-4844 blocks.',
              type: 'array',
              items: {
                $ref: '#/components/schemas/uint',
              },
            },
            gasUsedRatio: {
              title: 'gasUsedRatio',
              description:
                'An array of block gas used ratios. These are calculated as the ratio of gasUsed and gasLimit.',
              type: 'array',
              items: {
                $ref: '#/components/schemas/ratio',
              },
            },
            blobGasUsedRatio: {
              title: 'blobGasUsedRatio',
              description:
                'An array of block blob gas used ratios. These are calculated as the ratio of blobGasUsed and the max blob gas per block.',
              type: 'array',
              items: {
                $ref: '#/components/schemas/ratio',
              },
            },
            reward: {
              title: 'rewardArray',
              description:
                'A two-dimensional array of effective priority fees per gas at the requested block percentiles.',
              type: 'array',
              items: {
                title: 'rewardPercentile',
                description:
                  'An array of effective priority fee per gas data points from a single block. All zeroes are returned if the block is empty.',
                type: 'array',
                items: {
                  title: 'rewardPercentile',
                  description:
                    'A given percentile sample of effective priority fees per gas from a single block in ascending order, weighted by gas used. Zeroes are returned if the block is empty.',
                  $ref: '#/components/schemas/uint',
                },
              },
            },
          },
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_gasPrice',
      summary: 'Returns the current price per gas in wei.',
      params: [],
      result: {
        name: 'Gas price',
        schema: {
          title: 'Gas price',
          $ref: '#/components/schemas/uint',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getBalance',
      summary: 'Returns the balance of the account of given address.',
      params: [
        {
          name: 'Address',
          required: true,
          schema: {
            $ref: '#/components/schemas/address',
          },
        },
        {
          name: 'Block',
          required: true,
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTagOrHash',
          },
        },
      ],
      result: {
        name: 'Balance',
        schema: {
          $ref: '#/components/schemas/uint',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getBlockByHash',
      summary: 'Returns information about a block by hash.',
      params: [
        {
          name: 'Block hash',
          required: true,
          schema: {
            $ref: '#/components/schemas/hash32',
          },
        },
        {
          name: 'Hydrated transactions',
          required: true,
          schema: {
            title: 'hydrated',
            type: 'boolean',
          },
        },
      ],
      result: {
        name: 'Block information',
        schema: {
          oneOf: [
            {
              $ref: '#/components/schemas/notFound',
            },
            {
              $ref: '#/components/schemas/Block',
            },
          ],
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getBlockByNumber',
      summary: 'Returns information about a block by number.',
      params: [
        {
          name: 'Block',
          required: true,
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTag',
          },
        },
        {
          name: 'Hydrated transactions',
          required: true,
          schema: {
            title: 'hydrated',
            type: 'boolean',
          },
        },
      ],
      result: {
        name: 'Block information',
        schema: {
          oneOf: [
            {
              $ref: '#/components/schemas/notFound',
            },
            {
              $ref: '#/components/schemas/Block',
            },
          ],
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getBlockReceipts',
      summary: 'Returns the receipts of a block by number or hash.',
      params: [
        {
          name: 'Block',
          required: true,
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTagOrHash',
          },
        },
      ],
      result: {
        name: 'Receipts information',
        schema: {
          oneOf: [
            {
              $ref: '#/components/schemas/notFound',
            },
            {
              title: 'Receipts information',
              type: 'array',
              items: {
                $ref: '#/components/schemas/ReceiptInfo',
              },
            },
          ],
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getBlockTransactionCountByHash',
      summary:
        'Returns the number of transactions in a block from a block matching the given block hash.',
      params: [
        {
          name: 'Block hash',
          schema: {
            $ref: '#/components/schemas/hash32',
          },
        },
      ],
      result: {
        name: 'Transaction count',
        schema: {
          oneOf: [
            {
              $ref: '#/components/schemas/notFound',
            },
            {
              title: 'Transaction count',
              $ref: '#/components/schemas/uint',
            },
          ],
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getBlockTransactionCountByNumber',
      summary:
        'Returns the number of transactions in a block matching the given block number.',
      params: [
        {
          name: 'Block',
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTag',
          },
        },
      ],
      result: {
        name: 'Transaction count',
        schema: {
          oneOf: [
            {
              $ref: '#/components/schemas/notFound',
            },
            {
              title: 'Transaction count',
              $ref: '#/components/schemas/uint',
            },
          ],
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getCode',
      summary: 'Returns code at a given address.',
      params: [
        {
          name: 'Address',
          required: true,
          schema: {
            $ref: '#/components/schemas/address',
          },
        },
        {
          name: 'Block',
          required: true,
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTagOrHash',
          },
        },
      ],
      result: {
        name: 'Bytecode',
        schema: {
          $ref: '#/components/schemas/bytes',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getFilterChanges',
      summary:
        'Polling method for a filter, which returns an array of logs which occurred since last poll.',
      params: [
        {
          name: 'Filter Identifier',
          schema: {
            $ref: '#/components/schemas/uint',
          },
        },
      ],
      result: {
        name: 'Log objects',
        schema: {
          $ref: '#/components/schemas/FilterResults',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getFilterLogs',
      summary: 'Returns an array of all logs matching filter with given id.',
      params: [
        {
          name: 'Filter Identifier',
          schema: {
            $ref: '#/components/schemas/uint',
          },
        },
      ],
      result: {
        name: 'Log objects',
        schema: {
          $ref: '#/components/schemas/FilterResults',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getLogs',
      summary: 'Returns an array of all logs matching filter with given id.',
      params: [
        {
          name: 'Filter',
          schema: {
            $ref: '#/components/schemas/Filter',
          },
        },
      ],
      result: {
        name: 'Log objects',
        schema: {
          $ref: '#/components/schemas/FilterResults',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getProof',
      summary:
        'Returns the merkle proof for a given account and optionally some storage keys.',
      params: [
        {
          name: 'Address',
          required: true,
          schema: {
            $ref: '#/components/schemas/address',
          },
        },
        {
          name: 'StorageKeys',
          required: true,
          schema: {
            title: 'Storage keys',
            type: 'array',
            items: {
              $ref: '#/components/schemas/bytesMax32',
            },
          },
        },
        {
          name: 'Block',
          required: true,
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTagOrHash',
          },
        },
      ],
      result: {
        name: 'Account',
        schema: {
          $ref: '#/components/schemas/AccountProof',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getStorageAt',
      summary: 'Returns the value from a storage position at a given address.',
      params: [
        {
          name: 'Address',
          required: true,
          schema: {
            $ref: '#/components/schemas/address',
          },
        },
        {
          name: 'Storage slot',
          required: true,
          schema: {
            $ref: '#/components/schemas/uint256',
          },
        },
        {
          name: 'Block',
          required: true,
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTagOrHash',
          },
        },
      ],
      result: {
        name: 'Value',
        schema: {
          $ref: '#/components/schemas/bytes',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getTransactionByBlockHashAndIndex',
      summary:
        'Returns information about a transaction by block hash and transaction index position.',
      params: [
        {
          name: 'Block hash',
          required: true,
          schema: {
            $ref: '#/components/schemas/hash32',
          },
        },
        {
          name: 'Transaction index',
          required: true,
          schema: {
            $ref: '#/components/schemas/uint',
          },
        },
      ],
      result: {
        name: 'Transaction information',
        schema: {
          oneOf: [
            {
              $ref: '#/components/schemas/notFound',
            },
            {
              $ref: '#/components/schemas/TransactionInfo',
            },
          ],
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getTransactionByBlockNumberAndIndex',
      summary:
        'Returns information about a transaction by block number and transaction index position.',
      params: [
        {
          name: 'Block',
          required: true,
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTag',
          },
        },
        {
          name: 'Transaction index',
          required: true,
          schema: {
            $ref: '#/components/schemas/uint',
          },
        },
      ],
      result: {
        name: 'Transaction information',
        schema: {
          oneOf: [
            {
              $ref: '#/components/schemas/notFound',
            },
            {
              $ref: '#/components/schemas/TransactionInfo',
            },
          ],
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getTransactionByHash',
      summary:
        'Returns the information about a transaction requested by transaction hash.',
      params: [
        {
          name: 'Transaction hash',
          required: true,
          schema: {
            $ref: '#/components/schemas/hash32',
          },
        },
      ],
      result: {
        name: 'Transaction information',
        schema: {
          oneOf: [
            {
              $ref: '#/components/schemas/notFound',
            },
            {
              $ref: '#/components/schemas/TransactionInfo',
            },
          ],
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getTransactionCount',
      summary: 'Returns the number of transactions sent from an address.',
      params: [
        {
          name: 'Address',
          required: true,
          schema: {
            $ref: '#/components/schemas/address',
          },
        },
        {
          name: 'Block',
          required: true,
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTagOrHash',
          },
        },
      ],
      result: {
        name: 'Transaction count',
        schema: {
          $ref: '#/components/schemas/uint',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getTransactionReceipt',
      summary: 'Returns the receipt of a transaction by transaction hash.',
      params: [
        {
          name: 'Transaction hash',
          required: true,
          schema: {
            $ref: '#/components/schemas/hash32',
          },
        },
      ],
      result: {
        name: 'Receipt information',
        schema: {
          oneOf: [
            {
              $ref: '#/components/schemas/notFound',
            },
            {
              $ref: '#/components/schemas/ReceiptInfo',
            },
          ],
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getUncleCountByBlockHash',
      summary:
        'Returns the number of uncles in a block from a block matching the given block hash.',
      params: [
        {
          name: 'Block hash',
          schema: {
            $ref: '#/components/schemas/hash32',
          },
        },
      ],
      result: {
        name: 'Uncle count',
        schema: {
          oneOf: [
            {
              $ref: '#/components/schemas/notFound',
            },
            {
              title: 'Uncle count',
              $ref: '#/components/schemas/uint',
            },
          ],
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_getUncleCountByBlockNumber',
      summary:
        'Returns the number of transactions in a block matching the given block number.',
      params: [
        {
          name: 'Block',
          schema: {
            $ref: '#/components/schemas/BlockNumberOrTag',
          },
        },
      ],
      result: {
        name: 'Uncle count',
        schema: {
          oneOf: [
            {
              $ref: '#/components/schemas/notFound',
            },
            {
              title: 'Uncle count',
              $ref: '#/components/schemas/uint',
            },
          ],
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_maxPriorityFeePerGas',
      summary: 'Returns the current maxPriorityFeePerGas per gas in wei.',
      params: [],
      result: {
        name: 'Max priority fee per gas',
        schema: {
          title: 'Max priority fee per gas',
          $ref: '#/components/schemas/uint',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_newBlockFilter',
      summary:
        'Creates a filter in the node, to notify when a new block arrives.',
      params: [],
      result: {
        name: 'Filter Identifier',
        schema: {
          $ref: '#/components/schemas/uint',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_newFilter',
      summary:
        'Creates a filter object, based on filter options, to notify when the state changes (logs).',
      params: [
        {
          name: 'Filter',
          schema: {
            $ref: '#/components/schemas/Filter',
          },
        },
      ],
      result: {
        name: 'Filter Identifier',
        schema: {
          $ref: '#/components/schemas/uint',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_newPendingTransactionFilter',
      summary:
        'Creates a filter in the node, to notify when new pending transactions arrive.',
      params: [],
      result: {
        name: 'Filter Identifier',
        schema: {
          $ref: '#/components/schemas/uint',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_sendRawTransaction',
      summary:
        'Submits a raw transaction. For EIP-4844 transactions, the raw form must be the network form. This means it includes the blobs, KZG commitments, and KZG proofs.',
      params: [
        {
          name: 'Transaction',
          required: true,
          schema: {
            $ref: '#/components/schemas/bytes',
          },
        },
      ],
      result: {
        name: 'Transaction hash',
        schema: {
          $ref: '#/components/schemas/hash32',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_syncing',
      summary: 'Returns an object with data about the sync status or false.',
      params: [],
      result: {
        name: 'Syncing status',
        schema: {
          $ref: '#/components/schemas/SyncingStatus',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
    {
      name: 'eth_uninstallFilter',
      summary: 'Uninstalls a filter with given id.',
      params: [
        {
          name: 'Filter Identifier',
          schema: {
            $ref: '#/components/schemas/uint',
          },
        },
      ],
      result: {
        name: 'Success',
        schema: {
          type: 'boolean',
        },
      },
      tags: [
        {
          name: 'Ethereum API',
          description: 'Ethereum Node JSON-RPC method',
        },
      ],
    },
  ],
  components: {
    errors: {
      UserRejected: {
        code: 4001,
        message: 'User rejected the request.',
      },
    },
    schemas: {
      TypedData: {
        title: 'TypedData',
        type: 'object',
        required: ['types', 'primaryType', 'domain', 'message'],
        properties: {
          types: {
            type: 'object',
            required: ['EIP712Domain'],
            properties: {
              EIP712Domain: {
                type: 'array',
                description:
                  'An array specifying one or more of the following domain separator values: 1) `name` - The user-readable name of signing domain, i.e., the name of the dapp or the protocol. 2) `version` - The current major version of the signing domain. 3) `chainId` - The chain ID of the network. 4) `verifyingContract` - The address of the contract that will verify the signature. 5) `salt` - A disambiguating salt for the protocol.',
              },
            },
            additionalProperties: {
              type: 'array',
              required: ['name', 'type'],
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  type: {
                    type: 'string',
                  },
                },
              },
            },
          },
          domain: {
            type: 'object',
            description:
              'Contains the domain separator values specified in the `EIP712Domain` type.',
          },
          primaryType: {
            type: 'string',
          },
          message: {
            type: 'object',
            description: "The message you're proposing the user to sign.",
          },
        },
      },
      AddEthereumChainParameter: {
        title: 'AddEthereumChainParameter',
        type: 'object',
        required: ['chainId', 'chainName', 'nativeCurrency', 'rpcUrls'],
        properties: {
          chainId: {
            description:
              "The chain ID as a `0x`-prefixed hexadecimal string, per the `eth_chainId` method. MetaMask compares this chain ID value with the `eth_chainId` return value. If these values aren't identical, MetaMask rejects the request.",
            type: 'string',
          },
          blockExplorerUrls: {
            description:
              '(Optional) One or more URLs pointing to block explorer sites for the chain.',
            type: 'array',
            items: {
              type: 'string',
            },
          },
          chainName: {
            description: 'A human-readable name for the chain.',
            type: 'string',
          },
          iconUrls: {
            description:
              '(Optional) One or more URLs pointing to reasonably sized images that can be used to visually identify the chain. NOTE: MetaMask will not  currently display these images. Values can still be included so  that they are utilized if MetaMask incorporates them into the display of custom networks in the future.',
            type: 'array',
            items: {
              format: 'uri',
              type: 'string',
            },
          },
          nativeCurrency: {
            $ref: '#/components/schemas/NativeCurrency',
          },
          rpcUrls: {
            description:
              'One or more URLs pointing to RPC endpoints that can be used to communicate with the chain. At least one item is required, and only the first item is used.',
            type: 'array',
            minItems: 1,
            items: {
              format: 'uri',
              type: 'string',
            },
          },
        },
      },
      NativeCurrency: {
        title: 'NativeCurrency',
        type: 'object',
        description:
          'Describes the native currency of the chain using the name, symbol, and decimals fields.',
        required: ['decimals', 'symbol'],
        properties: {
          decimals: {
            description: 'A non-negative integer.',
            min: 0,
            type: 'integer',
          },
          name: {
            description: 'A human-readable name.',
            type: 'string',
          },
          symbol: {
            description: 'A human-readable symbol.',
            type: 'string',
          },
        },
      },
      Caveats: {
        title: 'Caveats',
        description:
          'A capability document modifies the caveat property to specify usage restrictions. Capabilities inherit restrictions from the caveat properties of their parent documents and can add new caveats in addition to those inherited from their parents.',
        type: 'array',
        items: {
          title: 'Caveat',
          type: 'object',
          properties: {
            type: {
              title: 'Type',
              type: 'string',
              description: 'Type of caveat.',
            },
            value: {
              title: 'CaveatValue',
              description: 'Value of the caveat.',
            },
            name: {
              title: 'Name',
              type: 'string',
              description: 'Name of the caveat.',
            },
          },
        },
      },
      PermissionObject: {
        type: 'object',
        title: 'PermissionObject',
        additionalProperties: {
          type: 'object',
          additionalProperties: true,
        },
        properties: {
          permission: {
            description: 'The requested permission.',
            type: 'object',
            additionalProperties: true,
          },
        },
      },
      Permission: {
        title: 'Permission',
        type: 'object',
        properties: {
          id: {
            description: 'The permission ID.',
            type: 'string',
          },
          '@context': {
            description:
              "When two people communicate with one another, the conversation takes place in a shared environment, typically called 'the context of the conversation.' This shared context allows the individuals to use shortcut terms, such as the first name of a mutual friend, to communicate more quickly without losing accuracy. A context in JSON-LD works the same way: it allows two applications to use shortcut terms to communicate more efficiently without losing accuracy.",
            type: 'array',
            items: {
              type: 'string',
            },
          },
          invoker: {
            description: 'A URI of the dapp being granted this permission.',
            type: 'string',
          },
          caveats: {
            $ref: '#/components/schemas/Caveats',
          },
        },
      },
      PermissionsList: {
        title: 'PermissionsList',
        type: 'array',
        items: {
          $ref: '#/components/schemas/Permission',
        },
      },
      SnapsMap: {
        title: 'SnapsMap',
        type: 'object',
        properties: {
          id: {
            type: 'object',
            properties: {
              id: {
                description: 'The ID of the Snap.',
                type: 'string',
              },
              initialPermissions: {
                description:
                  'The initial permissions of the Snap, which will be requested when the Snap is installed.',
                type: 'object',
              },
              version: {
                description: 'The version of the Snap.',
                type: 'string',
              },
              enabled: {
                description: 'Indicates whether the Snap is enabled.',
                type: 'boolean',
              },
              blocked: {
                description: 'Indicates whether the Snap is blocked.',
                type: 'boolean',
              },
            },
          },
        },
      },
      address: {
        title: 'hex encoded address',
        type: 'string',
        pattern: '^0x[0-9,a-f,A-F]{40}$',
      },
      addresses: {
        title: 'hex encoded address',
        type: 'array',
        items: {
          $ref: '#/components/schemas/address',
        },
      },
      byte: {
        title: 'hex encoded byte',
        type: 'string',
        pattern: '^0x([0-9,a-f,A-F]?){1,2}$',
      },
      bytes: {
        title: 'hex encoded bytes',
        type: 'string',
        pattern: '^0x[0-9a-f]*$',
      },
      bytesMax32: {
        title: '32 hex encoded bytes',
        type: 'string',
        pattern: '^0x[0-9a-f]{0,64}$',
      },
      bytes8: {
        title: '8 hex encoded bytes',
        type: 'string',
        pattern: '^0x[0-9a-f]{16}$',
      },
      bytes32: {
        title: '32 hex encoded bytes',
        type: 'string',
        pattern: '^0x[0-9a-f]{64}$',
      },
      bytes48: {
        title: '48 hex encoded bytes',
        type: 'string',
        pattern: '^0x[0-9a-f]{96}$',
      },
      bytes256: {
        title: '256 hex encoded bytes',
        type: 'string',
        pattern: '^0x[0-9a-f]{512}$',
      },
      bytes65: {
        title: '65 hex encoded bytes',
        type: 'string',
        pattern: '^0x[0-9a-f]{130}$',
      },
      ratio: {
        title: 'normalized ratio',
        type: 'number',
        minimum: 0,
        maximum: 1,
      },
      uint: {
        title: 'hex encoded unsigned integer',
        type: 'string',
        pattern: '^0x([1-9a-f]+[0-9a-f]*|0)$',
      },
      uint64: {
        title: 'hex encoded 64 bit unsigned integer',
        type: 'string',
        pattern: '^0x([1-9a-f]+[0-9a-f]{0,15})|0$',
      },
      uint256: {
        title: 'hex encoded 256 bit unsigned integer',
        type: 'string',
        pattern: '^0x([1-9a-f]+[0-9a-f]{0,31})|0$',
      },
      hash32: {
        title: '32 byte hex value',
        type: 'string',
        pattern: '^0x[0-9a-f]{64}$',
      },
      notFound: {
        title: 'Not Found (null)',
        type: 'null',
      },
      Block: {
        title: 'Block object',
        type: 'object',
        required: [
          'hash',
          'parentHash',
          'sha3Uncles',
          'miner',
          'stateRoot',
          'transactionsRoot',
          'receiptsRoot',
          'logsBloom',
          'number',
          'gasLimit',
          'gasUsed',
          'timestamp',
          'extraData',
          'mixHash',
          'nonce',
          'size',
          'transactions',
          'uncles',
        ],
        additionalProperties: false,
        properties: {
          hash: {
            title: 'Hash',
            $ref: '#/components/schemas/hash32',
          },
          parentHash: {
            title: 'Parent block hash',
            $ref: '#/components/schemas/hash32',
          },
          sha3Uncles: {
            title: 'Ommers hash',
            $ref: '#/components/schemas/hash32',
          },
          miner: {
            title: 'Coinbase',
            $ref: '#/components/schemas/address',
          },
          stateRoot: {
            title: 'State root',
            $ref: '#/components/schemas/hash32',
          },
          transactionsRoot: {
            title: 'Transactions root',
            $ref: '#/components/schemas/hash32',
          },
          receiptsRoot: {
            title: 'Receipts root',
            $ref: '#/components/schemas/hash32',
          },
          logsBloom: {
            title: 'Bloom filter',
            $ref: '#/components/schemas/bytes256',
          },
          difficulty: {
            title: 'Difficulty',
            $ref: '#/components/schemas/uint',
          },
          number: {
            title: 'Number',
            $ref: '#/components/schemas/uint',
          },
          gasLimit: {
            title: 'Gas limit',
            $ref: '#/components/schemas/uint',
          },
          gasUsed: {
            title: 'Gas used',
            $ref: '#/components/schemas/uint',
          },
          timestamp: {
            title: 'Timestamp',
            $ref: '#/components/schemas/uint',
          },
          extraData: {
            title: 'Extra data',
            $ref: '#/components/schemas/bytes',
          },
          mixHash: {
            title: 'Mix hash',
            $ref: '#/components/schemas/hash32',
          },
          nonce: {
            title: 'Nonce',
            $ref: '#/components/schemas/bytes8',
          },
          totalDifficulty: {
            title: 'Total difficulty',
            $ref: '#/components/schemas/uint',
          },
          baseFeePerGas: {
            title: 'Base fee per gas',
            $ref: '#/components/schemas/uint',
          },
          withdrawalsRoot: {
            title: 'Withdrawals root',
            $ref: '#/components/schemas/hash32',
          },
          blobGasUsed: {
            title: 'Blob gas used',
            $ref: '#/components/schemas/uint',
          },
          excessBlobGas: {
            title: 'Excess blob gas',
            $ref: '#/components/schemas/uint',
          },
          parentBeaconBlockRoot: {
            title: 'Parent Beacon Block Root',
            $ref: '#/components/schemas/hash32',
          },
          size: {
            title: 'Block size',
            $ref: '#/components/schemas/uint',
          },
          transactions: {
            anyOf: [
              {
                title: 'Transaction hashes',
                type: 'array',
                items: {
                  $ref: '#/components/schemas/hash32',
                },
              },
              {
                title: 'Full transactions',
                type: 'array',
                items: {
                  $ref: '#/components/schemas/TransactionInfo',
                },
              },
            ],
          },
          withdrawals: {
            title: 'Withdrawals',
            type: 'array',
            items: {
              $ref: '#/components/schemas/Withdrawal',
            },
          },
          uncles: {
            title: 'Uncles',
            type: 'array',
            items: {
              $ref: '#/components/schemas/hash32',
            },
          },
        },
      },
      BlockTag: {
        title: 'Block tag',
        type: 'string',
        enum: ['earliest', 'finalized', 'safe', 'latest', 'pending'],
        description:
          '`earliest`: The lowest numbered block the client has available; `finalized`: The most recent crypto-economically secure block, cannot be re-orged outside of manual intervention driven by community coordination; `safe`: The most recent block that is safe from re-orgs under honest majority and certain synchronicity assumptions; `latest`: The most recent block in the canonical chain observed by the client, this block may be re-orged out of the canonical chain even under healthy/normal conditions; `pending`: A sample next block built by the client on top of `latest` and containing the set of transactions usually taken from local mempool. Before the merge transition is finalized, any call querying for `finalized` or `safe` block MUST be responded to with `-39001: Unknown block` error',
      },
      BlockNumberOrTag: {
        title: 'Block number or tag',
        oneOf: [
          {
            title: 'Block number',
            $ref: '#/components/schemas/uint',
          },
          {
            title: 'Block tag',
            $ref: '#/components/schemas/BlockTag',
          },
        ],
      },
      BlockNumberOrTagOrHash: {
        title: 'Block number, tag, or block hash',
        anyOf: [
          {
            title: 'Block number',
            $ref: '#/components/schemas/uint',
          },
          {
            title: 'Block tag',
            $ref: '#/components/schemas/BlockTag',
          },
          {
            title: 'Block hash',
            $ref: '#/components/schemas/hash32',
          },
        ],
      },
      BadBlock: {
        title: 'Bad block',
        type: 'object',
        required: ['block', 'hash', 'rlp'],
        additionalProperties: false,
        properties: {
          block: {
            title: 'Block',
            $ref: '#/components/schemas/Block',
          },
          hash: {
            title: 'Hash',
            $ref: '#/components/schemas/hash32',
          },
          rlp: {
            title: 'RLP',
            $ref: '#/components/schemas/bytes',
          },
        },
      },
      SyncingStatus: {
        title: 'Syncing status',
        oneOf: [
          {
            title: 'Syncing progress',
            type: 'object',
            additionalProperties: false,
            properties: {
              startingBlock: {
                title: 'Starting block',
                $ref: '#/components/schemas/uint',
              },
              currentBlock: {
                title: 'Current block',
                $ref: '#/components/schemas/uint',
              },
              highestBlock: {
                title: 'Highest block',
                $ref: '#/components/schemas/uint',
              },
            },
          },
          {
            title: 'Not syncing',
            description: 'Should always return false if not syncing.',
            type: 'boolean',
          },
        ],
      },
      FilterResults: {
        title: 'Filter results',
        oneOf: [
          {
            title: 'new block or transaction hashes',
            type: 'array',
            items: {
              $ref: '#/components/schemas/hash32',
            },
          },
          {
            title: 'new logs',
            type: 'array',
            items: {
              $ref: '#/components/schemas/Log',
            },
          },
        ],
      },
      Filter: {
        title: 'filter',
        type: 'object',
        additionalProperties: false,
        properties: {
          fromBlock: {
            title: 'from block',
            $ref: '#/components/schemas/uint',
          },
          toBlock: {
            title: 'to block',
            $ref: '#/components/schemas/uint',
          },
          address: {
            title: 'Address(es)',
            oneOf: [
              {
                title: 'Any Address',
                type: 'null',
              },
              {
                title: 'Address',
                $ref: '#/components/schemas/address',
              },
              {
                title: 'Addresses',
                $ref: '#/components/schemas/addresses',
              },
            ],
          },
          topics: {
            title: 'Topics',
            $ref: '#/components/schemas/FilterTopics',
          },
        },
      },
      FilterTopics: {
        title: 'Filter Topics',
        oneOf: [
          {
            title: 'Any Topic Match',
            type: 'null',
          },
          {
            title: 'Specified Filter Topics',
            type: 'array',
            items: {
              $ref: '#/components/schemas/FilterTopic',
            },
          },
        ],
      },
      FilterTopic: {
        title: 'Filter Topic List Entry',
        oneOf: [
          {
            title: 'Single Topic Match',
            $ref: '#/components/schemas/bytes32',
          },
          {
            title: 'Multiple Topic Match',
            type: 'array',
            items: {
              $ref: '#/components/schemas/bytes32',
            },
          },
        ],
      },
      Log: {
        title: 'log',
        type: 'object',
        required: ['transactionHash'],
        additionalProperties: false,
        properties: {
          removed: {
            title: 'removed',
            type: 'boolean',
          },
          logIndex: {
            title: 'log index',
            $ref: '#/components/schemas/uint',
          },
          transactionIndex: {
            title: 'transaction index',
            $ref: '#/components/schemas/uint',
          },
          transactionHash: {
            title: 'transaction hash',
            $ref: '#/components/schemas/hash32',
          },
          blockHash: {
            title: 'block hash',
            $ref: '#/components/schemas/hash32',
          },
          blockNumber: {
            title: 'block number',
            $ref: '#/components/schemas/uint',
          },
          address: {
            title: 'address',
            $ref: '#/components/schemas/address',
          },
          data: {
            title: 'data',
            $ref: '#/components/schemas/bytes',
          },
          topics: {
            title: 'topics',
            type: 'array',
            items: {
              $ref: '#/components/schemas/bytes32',
            },
          },
        },
      },
      ReceiptInfo: {
        type: 'object',
        title: 'Receipt information',
        required: [
          'blockHash',
          'blockNumber',
          'from',
          'cumulativeGasUsed',
          'gasUsed',
          'logs',
          'logsBloom',
          'transactionHash',
          'transactionIndex',
          'effectiveGasPrice',
        ],
        additionalProperties: false,
        properties: {
          type: {
            title: 'type',
            $ref: '#/components/schemas/byte',
          },
          transactionHash: {
            title: 'transaction hash',
            $ref: '#/components/schemas/hash32',
          },
          transactionIndex: {
            title: 'transaction index',
            $ref: '#/components/schemas/uint',
          },
          blockHash: {
            title: 'block hash',
            $ref: '#/components/schemas/hash32',
          },
          blockNumber: {
            title: 'block number',
            $ref: '#/components/schemas/uint',
          },
          from: {
            title: 'from',
            $ref: '#/components/schemas/address',
          },
          to: {
            title: 'to',
            description:
              'Address of the receiver or null in a contract creation transaction.',
            oneOf: [
              {
                title: 'Contract Creation (null)',
                type: 'null',
              },
              {
                title: 'Recipient Address',
                $ref: '#/components/schemas/address',
              },
            ],
          },
          cumulativeGasUsed: {
            title: 'cumulative gas used',
            description:
              'The sum of gas used by this transaction and all preceding transactions in the same block.',
            $ref: '#/components/schemas/uint',
          },
          gasUsed: {
            title: 'gas used',
            description:
              'The amount of gas used for this specific transaction alone.',
            $ref: '#/components/schemas/uint',
          },
          blobGasUsed: {
            title: 'blob gas used',
            description:
              'The amount of blob gas used for this specific transaction. Only specified for blob transactions as defined by EIP-4844.',
            $ref: '#/components/schemas/uint',
          },
          contractAddress: {
            title: 'contract address',
            description:
              'The contract address created, if the transaction was a contract creation, otherwise null.',
            oneOf: [
              {
                $ref: '#/components/schemas/address',
              },
              {
                title: 'Null',
                type: 'null',
              },
            ],
          },
          logs: {
            title: 'logs',
            type: 'array',
            items: {
              $ref: '#/components/schemas/Log',
            },
          },
          logsBloom: {
            title: 'logs bloom',
            $ref: '#/components/schemas/bytes256',
          },
          root: {
            title: 'state root',
            description:
              'The post-transaction state root. Only specified for transactions included before the Byzantium upgrade.',
            $ref: '#/components/schemas/hash32',
          },
          status: {
            title: 'status',
            description:
              'Either 1 (success) or 0 (failure). Only specified for transactions included after the Byzantium upgrade.',
            $ref: '#/components/schemas/uint',
          },
          effectiveGasPrice: {
            title: 'effective gas price',
            description:
              "The actual value per gas deducted from the sender's account. Before EIP-1559, this is equal to the transaction's gas price. After, it is equal to baseFeePerGas + min(maxFeePerGas - baseFeePerGas, maxPriorityFeePerGas).",
            $ref: '#/components/schemas/uint',
          },
          blobGasPrice: {
            title: 'blob gas price',
            description:
              "The actual value per gas deducted from the sender's account for blob gas. Only specified for blob transactions as defined by EIP-4844.",
            $ref: '#/components/schemas/uint',
          },
        },
      },
      AccountProof: {
        title: 'Account proof',
        type: 'object',
        required: [
          'address',
          'accountProof',
          'balance',
          'codeHash',
          'nonce',
          'storageHash',
          'storageProof',
        ],
        additionalProperties: false,
        properties: {
          address: {
            title: 'address',
            $ref: '#/components/schemas/address',
          },
          accountProof: {
            title: 'accountProof',
            type: 'array',
            items: {
              $ref: '#/components/schemas/bytes',
            },
          },
          balance: {
            title: 'balance',
            $ref: '#/components/schemas/uint256',
          },
          codeHash: {
            title: 'codeHash',
            $ref: '#/components/schemas/hash32',
          },
          nonce: {
            title: 'nonce',
            $ref: '#/components/schemas/uint64',
          },
          storageHash: {
            title: 'storageHash',
            $ref: '#/components/schemas/hash32',
          },
          storageProof: {
            title: 'Storage proofs',
            type: 'array',
            items: {
              $ref: '#/components/schemas/StorageProof',
            },
          },
        },
      },
      StorageProof: {
        title: 'Storage proof',
        type: 'object',
        required: ['key', 'value', 'proof'],
        additionalProperties: false,
        properties: {
          key: {
            title: 'key',
            $ref: '#/components/schemas/bytesMax32',
          },
          value: {
            title: 'value',
            $ref: '#/components/schemas/uint256',
          },
          proof: {
            title: 'proof',
            type: 'array',
            items: {
              $ref: '#/components/schemas/bytes',
            },
          },
        },
      },
      Transaction4844Unsigned: {
        type: 'object',
        title: 'EIP-4844 transaction.',
        required: [
          'type',
          'nonce',
          'to',
          'gas',
          'value',
          'input',
          'maxPriorityFeePerGas',
          'maxFeePerGas',
          'maxFeePerBlobGas',
          'accessList',
          'blobVersionedHashes',
          'chainId',
        ],
        properties: {
          type: {
            title: 'type',
            $ref: '#/components/schemas/byte',
          },
          nonce: {
            title: 'nonce',
            $ref: '#/components/schemas/uint',
          },
          to: {
            title: 'to address',
            $ref: '#/components/schemas/address',
          },
          gas: {
            title: 'gas limit',
            $ref: '#/components/schemas/uint',
          },
          value: {
            title: 'value',
            $ref: '#/components/schemas/uint',
          },
          input: {
            title: 'input data',
            $ref: '#/components/schemas/bytes',
          },
          maxPriorityFeePerGas: {
            title: 'max priority fee per gas',
            description:
              'Maximum fee per gas the sender is willing to pay to miners in wei',
            $ref: '#/components/schemas/uint',
          },
          maxFeePerGas: {
            title: 'max fee per gas',
            description:
              'The maximum total fee per gas the sender is willing to pay (includes the network / base fee and miner / priority fee) in wei',
            $ref: '#/components/schemas/uint',
          },
          maxFeePerBlobGas: {
            title: 'max fee per blob gas',
            description:
              'The maximum total fee per gas the sender is willing to pay for blob gas in wei',
            $ref: '#/components/schemas/uint',
          },
          accessList: {
            title: 'accessList',
            description: 'EIP-2930 access list',
            $ref: '#/components/schemas/AccessList',
          },
          blobVersionedHashes: {
            title: 'blobVersionedHashes',
            description:
              "List of versioned blob hashes associated with the transaction's EIP-4844 data blobs.",
            type: 'array',
            items: {
              $ref: '#/components/schemas/hash32',
            },
          },
          chainId: {
            title: 'chainId',
            description: 'Chain ID that this transaction is valid on.',
            $ref: '#/components/schemas/uint',
          },
        },
      },
      AccessListEntry: {
        title: 'Access list entry',
        type: 'object',
        additionalProperties: false,
        properties: {
          address: {
            $ref: '#/components/schemas/address',
          },
          storageKeys: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/hash32',
            },
          },
        },
      },
      AccessList: {
        title: 'Access list',
        type: 'array',
        items: {
          $ref: '#/components/schemas/AccessListEntry',
        },
      },
      Transaction1559Unsigned: {
        type: 'object',
        title: 'EIP-1559 transaction.',
        required: [
          'type',
          'nonce',
          'gas',
          'value',
          'input',
          'maxFeePerGas',
          'maxPriorityFeePerGas',
          'gasPrice',
          'chainId',
          'accessList',
        ],
        properties: {
          type: {
            title: 'type',
            type: 'string',
            pattern: '^0x2$',
          },
          nonce: {
            title: 'nonce',
            $ref: '#/components/schemas/uint',
          },
          to: {
            title: 'to address',
            oneOf: [
              {
                title: 'Contract Creation (null)',
                type: 'null',
              },
              {
                title: 'Address',
                $ref: '#/components/schemas/address',
              },
            ],
          },
          gas: {
            title: 'gas limit',
            $ref: '#/components/schemas/uint',
          },
          value: {
            title: 'value',
            $ref: '#/components/schemas/uint',
          },
          input: {
            title: 'input data',
            $ref: '#/components/schemas/bytes',
          },
          maxPriorityFeePerGas: {
            title: 'max priority fee per gas',
            description:
              'Maximum fee per gas the sender is willing to pay to miners in wei',
            $ref: '#/components/schemas/uint',
          },
          maxFeePerGas: {
            title: 'max fee per gas',
            description:
              'The maximum total fee per gas the sender is willing to pay (includes the network / base fee and miner / priority fee) in wei',
            $ref: '#/components/schemas/uint',
          },
          gasPrice: {
            title: 'gas price',
            description:
              'The effective gas price paid by the sender in wei. For transactions not yet included in a block, this value should be set equal to the max fee per gas. This field is DEPRECATED, please transition to using effectiveGasPrice in the receipt object going forward.',
            $ref: '#/components/schemas/uint',
          },
          accessList: {
            title: 'accessList',
            description: 'EIP-2930 access list',
            $ref: '#/components/schemas/AccessList',
          },
          chainId: {
            title: 'chainId',
            description: 'Chain ID that this transaction is valid on.',
            $ref: '#/components/schemas/uint',
          },
        },
      },
      Transaction2930Unsigned: {
        type: 'object',
        title: 'EIP-2930 transaction.',
        required: [
          'type',
          'nonce',
          'gas',
          'value',
          'input',
          'gasPrice',
          'chainId',
          'accessList',
        ],
        properties: {
          type: {
            title: 'type',
            type: 'string',
            pattern: '^0x1$',
          },
          nonce: {
            title: 'nonce',
            $ref: '#/components/schemas/uint',
          },
          to: {
            title: 'to address',
            oneOf: [
              {
                title: 'Contract Creation (null)',
                type: 'null',
              },
              {
                title: 'Address',
                $ref: '#/components/schemas/address',
              },
            ],
          },
          gas: {
            title: 'gas limit',
            $ref: '#/components/schemas/uint',
          },
          value: {
            title: 'value',
            $ref: '#/components/schemas/uint',
          },
          input: {
            title: 'input data',
            $ref: '#/components/schemas/bytes',
          },
          gasPrice: {
            title: 'gas price',
            description:
              'The gas price willing to be paid by the sender in wei',
            $ref: '#/components/schemas/uint',
          },
          accessList: {
            title: 'accessList',
            description: 'EIP-2930 access list',
            $ref: '#/components/schemas/AccessList',
          },
          chainId: {
            title: 'chainId',
            description: 'Chain ID that this transaction is valid on.',
            $ref: '#/components/schemas/uint',
          },
        },
      },
      TransactionLegacyUnsigned: {
        type: 'object',
        title: 'Legacy transaction.',
        required: ['type', 'nonce', 'gas', 'value', 'input', 'gasPrice'],
        properties: {
          type: {
            title: 'type',
            type: 'string',
            pattern: '^0x0$',
          },
          nonce: {
            title: 'nonce',
            $ref: '#/components/schemas/uint',
          },
          to: {
            title: 'to address',
            oneOf: [
              {
                title: 'Contract Creation (null)',
                type: 'null',
              },
              {
                title: 'Address',
                $ref: '#/components/schemas/address',
              },
            ],
          },
          gas: {
            title: 'gas limit',
            $ref: '#/components/schemas/uint',
          },
          value: {
            title: 'value',
            $ref: '#/components/schemas/uint',
          },
          input: {
            title: 'input data',
            $ref: '#/components/schemas/bytes',
          },
          gasPrice: {
            title: 'gas price',
            description:
              'The gas price willing to be paid by the sender in wei',
            $ref: '#/components/schemas/uint',
          },
          chainId: {
            title: 'chainId',
            description: 'Chain ID that this transaction is valid on.',
            $ref: '#/components/schemas/uint',
          },
        },
      },
      TransactionUnsigned: {
        oneOf: [
          {
            $ref: '#/components/schemas/Transaction4844Unsigned',
          },
          {
            $ref: '#/components/schemas/Transaction1559Unsigned',
          },
          {
            $ref: '#/components/schemas/Transaction2930Unsigned',
          },
          {
            $ref: '#/components/schemas/TransactionLegacyUnsigned',
          },
        ],
      },
      Transaction4844Signed: {
        title: 'Signed 4844 Transaction',
        type: 'object',
        allOf: [
          {
            $ref: '#/components/schemas/Transaction4844Unsigned',
          },
          {
            title: 'EIP-4844 transaction signature properties.',
            required: ['yParity', 'r', 's'],
            properties: {
              yParity: {
                title: 'yParity',
                description:
                  'The parity (0 for even, 1 for odd) of the y-value of the secp256k1 signature.',
                $ref: '#/components/schemas/uint',
              },
              r: {
                title: 'r',
                $ref: '#/components/schemas/uint',
              },
              s: {
                title: 's',
                $ref: '#/components/schemas/uint',
              },
            },
          },
        ],
      },
      Transaction1559Signed: {
        title: 'Signed 1559 Transaction',
        type: 'object',
        allOf: [
          {
            $ref: '#/components/schemas/Transaction1559Unsigned',
          },
          {
            title: 'EIP-1559 transaction signature properties.',
            required: ['yParity', 'r', 's'],
            properties: {
              yParity: {
                title: 'yParity',
                description:
                  'The parity (0 for even, 1 for odd) of the y-value of the secp256k1 signature.',
                $ref: '#/components/schemas/uint',
              },
              v: {
                title: 'v',
                description:
                  'For backwards compatibility, `v` is optionally provided as an alternative to `yParity`. This field is DEPRECATED and all use of it should migrate to `yParity`.',
                $ref: '#/components/schemas/uint',
              },
              r: {
                title: 'r',
                $ref: '#/components/schemas/uint',
              },
              s: {
                title: 's',
                $ref: '#/components/schemas/uint',
              },
            },
          },
        ],
      },
      Transaction2930Signed: {
        title: 'Signed 2930 Transaction',
        type: 'object',
        allOf: [
          {
            $ref: '#/components/schemas/Transaction2930Unsigned',
          },
          {
            title: 'EIP-2930 transaction signature properties.',
            required: ['yParity', 'r', 's'],
            properties: {
              yParity: {
                title: 'yParity',
                description:
                  'The parity (0 for even, 1 for odd) of the y-value of the secp256k1 signature.',
                $ref: '#/components/schemas/uint',
              },
              v: {
                title: 'v',
                description:
                  'For backwards compatibility, `v` is optionally provided as an alternative to `yParity`. This field is DEPRECATED and all use of it should migrate to `yParity`.',
                $ref: '#/components/schemas/uint',
              },
              r: {
                title: 'r',
                $ref: '#/components/schemas/uint',
              },
              s: {
                title: 's',
                $ref: '#/components/schemas/uint',
              },
            },
          },
        ],
      },
      TransactionLegacySigned: {
        title: 'Signed Legacy Transaction',
        type: 'object',
        allOf: [
          {
            $ref: '#/components/schemas/TransactionLegacyUnsigned',
          },
          {
            title: 'Legacy transaction signature properties.',
            required: ['v', 'r', 's'],
            properties: {
              v: {
                title: 'v',
                $ref: '#/components/schemas/uint',
              },
              r: {
                title: 'r',
                $ref: '#/components/schemas/uint',
              },
              s: {
                title: 's',
                $ref: '#/components/schemas/uint',
              },
            },
          },
        ],
      },
      TransactionSigned: {
        oneOf: [
          {
            $ref: '#/components/schemas/Transaction4844Signed',
          },
          {
            $ref: '#/components/schemas/Transaction1559Signed',
          },
          {
            $ref: '#/components/schemas/Transaction2930Signed',
          },
          {
            $ref: '#/components/schemas/TransactionLegacySigned',
          },
        ],
      },
      TransactionInfo: {
        type: 'object',
        title: 'Transaction information',
        allOf: [
          {
            title: 'Contextual information',
            required: [
              'blockHash',
              'blockNumber',
              'from',
              'hash',
              'transactionIndex',
            ],
            properties: {
              blockHash: {
                title: 'block hash',
                $ref: '#/components/schemas/hash32',
              },
              blockNumber: {
                title: 'block number',
                $ref: '#/components/schemas/uint',
              },
              from: {
                title: 'from address',
                $ref: '#/components/schemas/address',
              },
              hash: {
                title: 'transaction hash',
                $ref: '#/components/schemas/hash32',
              },
              transactionIndex: {
                title: 'transaction index',
                $ref: '#/components/schemas/uint',
              },
            },
          },
          {
            $ref: '#/components/schemas/TransactionSigned',
          },
        ],
      },
      GenericTransaction: {
        type: 'object',
        title: 'Transaction object generic to all types',
        additionalProperties: false,
        properties: {
          type: {
            title: 'type',
            $ref: '#/components/schemas/byte',
          },
          nonce: {
            title: 'nonce',
            $ref: '#/components/schemas/uint',
          },
          to: {
            title: 'to address',
            oneOf: [
              {
                title: 'Contract Creation (null)',
                type: 'null',
              },
              {
                title: 'Address',
                $ref: '#/components/schemas/address',
              },
            ],
          },
          from: {
            title: 'from address',
            $ref: '#/components/schemas/address',
          },
          gas: {
            title: 'gas limit',
            $ref: '#/components/schemas/uint',
          },
          value: {
            title: 'value',
            $ref: '#/components/schemas/uint',
          },
          input: {
            title: 'input data',
            $ref: '#/components/schemas/bytes',
          },
          gasPrice: {
            title: 'gas price',
            description:
              'The gas price willing to be paid by the sender in wei',
            $ref: '#/components/schemas/uint',
          },
          maxPriorityFeePerGas: {
            title: 'max priority fee per gas',
            description:
              'Maximum fee per gas the sender is willing to pay to miners in wei',
            $ref: '#/components/schemas/uint',
          },
          maxFeePerGas: {
            title: 'max fee per gas',
            description:
              'The maximum total fee per gas the sender is willing to pay (includes the network / base fee and miner / priority fee) in wei',
            $ref: '#/components/schemas/uint',
          },
          maxFeePerBlobGas: {
            title: 'max fee per blob gas',
            description:
              'The maximum total fee per gas the sender is willing to pay for blob gas in wei',
            $ref: '#/components/schemas/uint',
          },
          accessList: {
            title: 'accessList',
            description: 'EIP-2930 access list',
            $ref: '#/components/schemas/AccessList',
          },
          blobVersionedHashes: {
            title: 'blobVersionedHashes',
            description:
              "List of versioned blob hashes associated with the transaction's EIP-4844 data blobs.",
            type: 'array',
            items: {
              $ref: '#/components/schemas/hash32',
            },
          },
          blobs: {
            title: 'blobs',
            description: 'Raw blob data.',
            type: 'array',
            items: {
              $ref: '#/components/schemas/bytes',
            },
          },
          chainId: {
            title: 'chainId',
            description: 'Chain ID that this transaction is valid on.',
            $ref: '#/components/schemas/uint',
          },
        },
      },
      Withdrawal: {
        type: 'object',
        title: 'Validator withdrawal',
        required: ['index', 'validatorIndex', 'address', 'amount'],
        additionalProperties: false,
        properties: {
          index: {
            title: 'index of withdrawal',
            $ref: '#/components/schemas/uint64',
          },
          validatorIndex: {
            title: 'index of validator that generated withdrawal',
            $ref: '#/components/schemas/uint64',
          },
          address: {
            title: 'recipient address for withdrawal value',
            $ref: '#/components/schemas/address',
          },
          amount: {
            title: 'value contained in withdrawal',
            $ref: '#/components/schemas/uint256',
          },
        },
      },
      ForkchoiceStateV1: {
        title: 'Forkchoice state object V1',
        type: 'object',
        required: ['headBlockHash', 'safeBlockHash', 'finalizedBlockHash'],
        properties: {
          headBlockHash: {
            title: 'Head block hash',
            $ref: '#/components/schemas/hash32',
          },
          safeBlockHash: {
            title: 'Safe block hash',
            $ref: '#/components/schemas/hash32',
          },
          finalizedBlockHash: {
            title: 'Finalized block hash',
            $ref: '#/components/schemas/hash32',
          },
        },
      },
      ForkchoiceUpdatedResponseV1: {
        title: 'Forkchoice updated response',
        type: 'object',
        required: ['payloadStatus'],
        properties: {
          payloadStatus: {
            title: 'Payload status',
            $ref: '#/components/schemas/RestrictedPayloadStatusV1',
          },
          payloadId: {
            title: 'Payload id',
            $ref: '#/components/schemas/bytes8',
          },
        },
      },
      PayloadAttributesV1: {
        title: 'Payload attributes object V1',
        type: 'object',
        required: ['timestamp', 'prevRandao', 'suggestedFeeRecipient'],
        properties: {
          timestamp: {
            title: 'Timestamp',
            $ref: '#/components/schemas/uint64',
          },
          prevRandao: {
            title: 'Previous randao value',
            $ref: '#/components/schemas/bytes32',
          },
          suggestedFeeRecipient: {
            title: 'Suggested fee recipient',
            $ref: '#/components/schemas/address',
          },
        },
      },
      PayloadAttributesV2: {
        title: 'Payload attributes object V2',
        type: 'object',
        required: [
          'timestamp',
          'prevRandao',
          'suggestedFeeRecipient',
          'withdrawals',
        ],
        properties: {
          timestamp: {
            $ref: '#/components/schemas/PayloadAttributesV1/properties/timestamp',
          },
          prevRandao: {
            $ref: '#/components/schemas/PayloadAttributesV1/properties/prevRandao',
          },
          suggestedFeeRecipient: {
            $ref: '#/components/schemas/PayloadAttributesV1/properties/suggestedFeeRecipient',
          },
          withdrawals: {
            title: 'Withdrawals',
            type: 'array',
            items: {
              $ref: '#/components/schemas/WithdrawalV1',
            },
          },
        },
      },
      PayloadAttributesV3: {
        title: 'Payload attributes object V3',
        type: 'object',
        required: [
          'timestamp',
          'prevRandao',
          'suggestedFeeRecipient',
          'withdrawals',
          'parentBeaconBlockRoot',
        ],
        properties: {
          timestamp: {
            $ref: '#/components/schemas/PayloadAttributesV2/properties/timestamp',
          },
          prevRandao: {
            $ref: '#/components/schemas/PayloadAttributesV2/properties/prevRandao',
          },
          suggestedFeeRecipient: {
            $ref: '#/components/schemas/PayloadAttributesV2/properties/suggestedFeeRecipient',
          },
          withdrawals: {
            $ref: '#/components/schemas/PayloadAttributesV2/properties/withdrawals',
          },
          parentBeaconBlockRoot: {
            title: 'Parent beacon block root',
            $ref: '#/components/schemas/hash32',
          },
        },
      },
      PayloadStatusV1: {
        title: 'Payload status object V1',
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            title: 'Payload validation status',
            type: 'string',
            enum: [
              'VALID',
              'INVALID',
              'SYNCING',
              'ACCEPTED',
              'INVALID_BLOCK_HASH',
            ],
          },
          latestValidHash: {
            title: 'The hash of the most recent valid block',
            $ref: '#/components/schemas/hash32',
          },
          validationError: {
            title: 'Validation error message',
            type: 'string',
          },
        },
      },
      RestrictedPayloadStatusV1: {
        $ref: '#/components/schemas/PayloadStatusV1',
        properties: {
          status: {
            $ref: '#/components/schemas/PayloadStatusV1/properties/status',
            description:
              'Set of possible values is restricted to VALID, INVALID, SYNCING',
            enum: ['VALID', 'INVALID', 'SYNCING'],
          },
          latestValidHash: {
            $ref: '#/components/schemas/PayloadStatusV1/properties/latestValidHash',
          },
          validationError: {
            $ref: '#/components/schemas/PayloadStatusV1/properties/validationError',
          },
        },
      },
      PayloadStatusNoInvalidBlockHash: {
        $ref: '#/components/schemas/PayloadStatusV1',
        title: 'Payload status object deprecating INVALID_BLOCK_HASH status',
        properties: {
          status: {
            $ref: '#/components/schemas/PayloadStatusV1/properties/status',
            enum: ['VALID', 'INVALID', 'SYNCING', 'ACCEPTED'],
          },
          latestValidHash: {
            $ref: '#/components/schemas/PayloadStatusV1/properties/latestValidHash',
          },
          validationError: {
            $ref: '#/components/schemas/PayloadStatusV1/properties/validationError',
          },
        },
      },
      ExecutionPayloadV1: {
        title: 'Execution payload object V1',
        type: 'object',
        required: [
          'parentHash',
          'feeRecipient',
          'stateRoot',
          'receiptsRoot',
          'logsBloom',
          'prevRandao',
          'blockNumber',
          'gasLimit',
          'gasUsed',
          'timestamp',
          'extraData',
          'baseFeePerGas',
          'blockHash',
          'transactions',
        ],
        properties: {
          parentHash: {
            title: 'Parent block hash',
            $ref: '#/components/schemas/hash32',
          },
          feeRecipient: {
            title: 'Recipient of transaction priority fees',
            $ref: '#/components/schemas/address',
          },
          stateRoot: {
            title: 'State root',
            $ref: '#/components/schemas/hash32',
          },
          receiptsRoot: {
            title: 'Receipts root',
            $ref: '#/components/schemas/hash32',
          },
          logsBloom: {
            title: 'Bloom filter',
            $ref: '#/components/schemas/bytes256',
          },
          prevRandao: {
            title: 'Previous randao value',
            $ref: '#/components/schemas/bytes32',
          },
          blockNumber: {
            title: 'Block number',
            $ref: '#/components/schemas/uint64',
          },
          gasLimit: {
            title: 'Gas limit',
            $ref: '#/components/schemas/uint64',
          },
          gasUsed: {
            title: 'Gas used',
            $ref: '#/components/schemas/uint64',
          },
          timestamp: {
            title: 'Timestamp',
            $ref: '#/components/schemas/uint64',
          },
          extraData: {
            title: 'Extra data',
            $ref: '#/components/schemas/bytesMax32',
          },
          baseFeePerGas: {
            title: 'Base fee per gas',
            $ref: '#/components/schemas/uint256',
          },
          blockHash: {
            title: 'Block hash',
            $ref: '#/components/schemas/hash32',
          },
          transactions: {
            title: 'Transactions',
            type: 'array',
            items: {
              $ref: '#/components/schemas/bytes',
            },
          },
        },
      },
      WithdrawalV1: {
        title: 'Withdrawal object V1',
        type: 'object',
        required: ['index', 'validatorIndex', 'address', 'amount'],
        properties: {
          index: {
            title: 'Withdrawal index',
            $ref: '#/components/schemas/uint64',
          },
          validatorIndex: {
            title: 'Validator index',
            $ref: '#/components/schemas/uint64',
          },
          address: {
            title: 'Withdrawal address',
            $ref: '#/components/schemas/address',
          },
          amount: {
            title: 'Withdrawal amount',
            $ref: '#/components/schemas/uint64',
          },
        },
      },
      ExecutionPayloadV2: {
        title: 'Execution payload object V2',
        type: 'object',
        required: [
          'parentHash',
          'feeRecipient',
          'stateRoot',
          'receiptsRoot',
          'logsBloom',
          'prevRandao',
          'blockNumber',
          'gasLimit',
          'gasUsed',
          'timestamp',
          'extraData',
          'baseFeePerGas',
          'blockHash',
          'transactions',
          'withdrawals',
        ],
        properties: {
          parentHash: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/parentHash',
          },
          feeRecipient: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/feeRecipient',
          },
          stateRoot: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/stateRoot',
          },
          receiptsRoot: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/receiptsRoot',
          },
          logsBloom: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/logsBloom',
          },
          prevRandao: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/prevRandao',
          },
          blockNumber: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/blockNumber',
          },
          gasLimit: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/gasLimit',
          },
          gasUsed: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/gasUsed',
          },
          timestamp: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/timestamp',
          },
          extraData: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/extraData',
          },
          baseFeePerGas: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/baseFeePerGas',
          },
          blockHash: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/blockHash',
          },
          transactions: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/transactions',
          },
          withdrawals: {
            title: 'Withdrawals',
            type: 'array',
            items: {
              $ref: '#/components/schemas/WithdrawalV1',
            },
          },
        },
      },
      ExecutionPayloadV3: {
        title: 'Execution payload object V3',
        type: 'object',
        required: [
          'parentHash',
          'feeRecipient',
          'stateRoot',
          'receiptsRoot',
          'logsBloom',
          'prevRandao',
          'blockNumber',
          'gasLimit',
          'gasUsed',
          'timestamp',
          'extraData',
          'baseFeePerGas',
          'blockHash',
          'transactions',
          'withdrawals',
          'blobGasUsed',
          'excessBlobGas',
        ],
        properties: {
          parentHash: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/parentHash',
          },
          feeRecipient: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/feeRecipient',
          },
          stateRoot: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/stateRoot',
          },
          receiptsRoot: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/receiptsRoot',
          },
          logsBloom: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/logsBloom',
          },
          prevRandao: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/prevRandao',
          },
          blockNumber: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/blockNumber',
          },
          gasLimit: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/gasLimit',
          },
          gasUsed: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/gasUsed',
          },
          timestamp: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/timestamp',
          },
          extraData: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/extraData',
          },
          baseFeePerGas: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/baseFeePerGas',
          },
          blockHash: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/blockHash',
          },
          transactions: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/transactions',
          },
          withdrawals: {
            $ref: '#/components/schemas/ExecutionPayloadV2/properties/withdrawals',
          },
          blobGasUsed: {
            title: 'Blob gas used',
            $ref: '#/components/schemas/uint64',
          },
          excessBlobGas: {
            title: 'Excess blob gas',
            $ref: '#/components/schemas/uint64',
          },
        },
      },
      ExecutionPayloadBodyV1: {
        title: 'Execution payload body object V1',
        type: 'object',
        required: ['transactions'],
        properties: {
          transactions: {
            $ref: '#/components/schemas/ExecutionPayloadV1/properties/transactions',
          },
          withdrawals: {
            title: 'Withdrawals',
            type: ['array', 'null'],
            items: {
              $ref: '#/components/schemas/WithdrawalV1',
            },
          },
        },
      },
      BlobsBundleV1: {
        title: 'Blobs bundle object V1',
        type: 'object',
        required: ['commitments', 'proofs', 'blobs'],
        properties: {
          commitments: {
            title: 'Commitments',
            type: 'array',
            items: {
              $ref: '#/components/schemas/bytes48',
            },
          },
          proofs: {
            title: 'Proofs',
            type: 'array',
            items: {
              $ref: '#/components/schemas/bytes48',
            },
          },
          blobs: {
            title: 'Blobs',
            type: 'array',
            items: {
              $ref: '#/components/schemas/bytes',
            },
          },
        },
      },
      TransitionConfigurationV1: {
        title: 'Transition configuration object',
        type: 'object',
        required: [
          'terminalTotalDifficulty',
          'terminalBlockHash',
          'terminalBlockNumber',
        ],
        properties: {
          terminalTotalDifficulty: {
            title: 'Terminal total difficulty',
            $ref: '#/components/schemas/uint256',
          },
          terminalBlockHash: {
            title: 'Terminal block hash',
            $ref: '#/components/schemas/hash32',
          },
          terminalBlockNumber: {
            title: 'Terminal block number',
            $ref: '#/components/schemas/uint64',
          },
        },
      },
    },
    tags: {
      MetaMask: {
        name: 'MetaMask',
        description: 'MetaMask-specific methods.',
      },
      Restricted: {
        name: 'Restricted',
        description:
          'Restricted methods. If a method is restricted, the caller must have the corresponding permission via `wallet_requestPermissions` in order to call it.',
      },
      Mobile: {
        name: 'Mobile',
        description: 'Mobile-specific methods.',
      },
      Snaps: {
        name: 'Snaps',
        description: 'Methods related to interacting with Snaps.',
      },
      Experimental: {
        name: 'Experimental',
        description: 'Experimental methods.',
      },
      Deprecated: {
        name: 'Deprecated',
        description: 'Deprecated methods.',
      },
      Ethereum: {
        name: 'Ethereum API',
        description: 'Ethereum execution API methods.',
      },
    },
    contentDescriptors: {},
    examplePairings: {},
    links: {},
    examples: {},
  },
};

async function main() {
  const port = 8545;
  const chainId = 1337;
  await withFixtures(
    {
      dapp: true,
      fixtures: new FixtureBuilder().build(),
      disableGanache: true,
      title: 'api-specs coverage',
    },
    async ({ driver }) => {
      await unlockWallet(driver);

      // Navigate to extension home screen
      await driver.navigate(PAGES.HOME);

      // Open Dapp One
      await openDapp(driver, undefined, DAPP_URL);
      let id = 0;

      const transport = async (_, method, params) => {
        const { result, error } = await driver.executeAsyncScript(
          ([m, p], done) => {
            window.ethereum
              .request({ method: m, params: p })
              .then((r) => {
                done({ result: r });
              })
              .catch((e) => {
                done({ error: e });
              });
          },
          method,
          params,
        );
        return { id: id++, result, error, jsonrpc: '2.0' };
      };

      const chainIdMethod = openrpcDocument.methods.find(
        (m) => m.name === 'eth_chainId',
      );
      chainIdMethod.examples = [
        {
          name: 'chainIdExample',
          description: 'Example of a chainId request',
          params: [],
          result: {
            name: 'chainIdResult',
            value: `0x${chainId.toString(16)}`,
          },
        },
      ];

      const getBalanceMethod = openrpcDocument.methods.find(
        (m) => m.name === 'eth_getBalance',
      );

      getBalanceMethod.examples = [
        {
          name: 'getBalanceExample',
          description: 'Example of a getBalance request',
          params: [
            {
              name: 'address',
              value: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
            },
            {
              name: 'tag',
              value: 'latest',
            },
          ],
          result: {
            name: 'getBalanceResult',
            value: '0x1a8819e0c9bab700',
          },
        },
      ];

      const blockNumber = openrpcDocument.methods.find(
        (m) => m.name === 'eth_blockNumber',
      );

      blockNumber.examples = [
        {
          name: 'blockNumberExample',
          description: 'Example of a blockNumber request',
          params: [],
          result: {
            name: 'blockNumberResult',
            value: '0x1',
          },
        },
      ];

      // add net_version
      openrpcDocument.methods.push({
        name: 'net_version',
        params: [],
        result: {
          description: 'Returns the current network ID.',
          name: 'net_version',
          schema: {
            type: 'string',
          },
        },
        description: 'Returns the current network ID.',
        examples: [
          {
            name: 'net_version',
            description: 'Example of a net_version request',
            params: [],
            result: {
              name: 'net_version',
              value: '0x1',
            },
          },
        ],
      });

      openrpcDocument = await parseOpenRPCDocument(openrpcDocument);
      const server = mockServer(port, openrpcDocument);
      try {
        server.start();
      } catch (e) {
        // do nothing
      }

      process.on('exit', () => {
        driver.quit();
      });

      await testCoverage({
        exampleCalls: [],
        openrpcDocument,
        transport,
        reporter: 'console',
        skip: openrpcDocument.methods
          .filter(
            (m) =>
              m.name.startsWith('wallet_') ||
              m.name.startsWith('snap_') ||
              m.name.toLowerCase().includes('account') ||
              m.name.includes('personal') ||
              m.name.includes('signTypedData') ||
              m.name.includes('crypt') ||
              m.name.includes('blob') ||
              m.name.includes('sendTransaction'),
          )
          .map((m) => m.name),
      });
      await driver.quit();
    },
  );
}

main();

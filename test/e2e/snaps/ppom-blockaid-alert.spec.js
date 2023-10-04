const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const {
  defaultGanacheOptions,
  getWindowHandles,
  openDapp,
  unlockWallet,
  withFixtures,
} = require('../helpers');

const {
  CHAIN_IDS,
  NETWORK_TYPES,
} = require('../../../shared/constants/network');

const bannerAlertSelector = '[data-testid="security-provider-banner-alert"]';
const selectedAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

const mainnetProviderConfig = {
  providerConfig: {
    chainId: CHAIN_IDS.MAINNET,
    nickname: '',
    rpcUrl: '',
    type: NETWORK_TYPES.MAINNET,
  },
};

async function mockInfura(mockServer) {
  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_estimateGas' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x5cec',
        },
      };
    });
  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_feeHistory' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: {
            baseFeePerGas: [
              '0x69b11e562',
              '0x666a7c239',
              '0x6d9e609f6',
              '0x6e9ab5408',
              '0x6bca983cb',
              '0x6a6f790c3',
            ],
            gasUsedRatio: [
              0.37602026666666666, 0.7813118333333333, 0.5359671,
              0.39827006666666664, 0.44968263333333336,
            ],
            oldestBlock: '0x115e9c0',
            reward: [
              ['0xfbc521', '0x21239e6', '0x5f5e100'],
              ['0x5f5e100', '0x68e7780', '0x314050eb'],
              ['0xfbc521', '0xfbc521', '0xfbc521'],
              ['0x21239e6', '0x5f5e100', '0x5f5e100'],
              ['0x21239e6', '0x5f5e100', '0x5f5e100'],
            ],
          },
        },
      };
    });
  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x55DE6A779BBAC0000',
        },
      };
    });
  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_getTransactionCount' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x115e89f',
        },
      };
    });
  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_blockNumber' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x1',
          // result: '0x115e89f',
        },
      };
    });
  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_call' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x4563918244F40000',
        },
      };
    });

  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_gasPrice' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x09184e72a000',
        },
      };
    });
  // maybe unlock for malicious
  // mock transfer USDC
  // await mockServer
  //   .forPost()
  //   .withJsonBodyIncluding({ method: 'eth_getCode' })
  //   .thenCallback((req) => {
  //     return {
  //       statusCode: 200,
  //       json: {
  //         jsonrpc: '2.0',
  //         id: req.body.json.id,
  //         result:
  //           '0x60806040526004361061004e5760003560e01c80632d2c55651461008d578063819d4cc6146100de5780638980f11f146101005780638b21f170146101205780639342c8f41461015457600080fd5b36610088576040513481527f27f12abfe35860a9a927b465bb3d4a9c23c8428174b83f278fe45ed7b4da26629060200160405180910390a1005b600080fd5b34801561009957600080fd5b506100c17f0000000000000000000000003e40d73eb977dc6a537af587d48316fee66e9c8c81565b6040516001600160a01b0390911681526020015b60405180910390f35b3480156100ea57600080fd5b506100fe6100f93660046106bb565b610182565b005b34801561010c57600080fd5b506100fe61011b3660046106bb565b61024e565b34801561012c57600080fd5b506100c17f000000000000000000000000ae7ab96520de3a18e5e111b5eaab095312d7fe8481565b34801561016057600080fd5b5061017461016f3660046106f3565b610312565b6040519081526020016100d5565b6040518181526001600160a01b0383169033907f6a30e6784464f0d1f4158aa4cb65ae9239b0fa87c7f2c083ee6dde44ba97b5e69060200160405180910390a36040516323b872dd60e01b81523060048201526001600160a01b037f0000000000000000000000003e40d73eb977dc6a537af587d48316fee66e9c8c81166024830152604482018390528316906323b872dd90606401600060405180830381600087803b15801561023257600080fd5b505af1158015610246573d6000803e3d6000fd5b505050505050565b6000811161029a5760405162461bcd60e51b815260206004820152601460248201527316915493d7d49150d3d591549657d05353d5539560621b60448201526064015b60405180910390fd5b6040518181526001600160a01b0383169033907faca8fb252cde442184e5f10e0f2e6e4029e8cd7717cae63559079610702436aa9060200160405180910390a361030e6001600160a01b0383167f0000000000000000000000003e40d73eb977dc6a537af587d48316fee66e9c8c83610418565b5050565b6000336001600160a01b037f000000000000000000000000ae7ab96520de3a18e5e111b5eaab095312d7fe8416146103855760405162461bcd60e51b81526020600482015260166024820152754f4e4c595f4c49444f5f43414e5f574954484452415760501b6044820152606401610291565b478281116103935780610395565b825b91508115610412577f000000000000000000000000ae7ab96520de3a18e5e111b5eaab095312d7fe846001600160a01b0316634ad509b2836040518263ffffffff1660e01b81526004016000604051808303818588803b1580156103f857600080fd5b505af115801561040c573d6000803e3d6000fd5b50505050505b50919050565b604080516001600160a01b038416602482015260448082018490528251808303909101815260649091019091526020810180516001600160e01b031663a9059cbb60e01b17905261046a90849061046f565b505050565b60006104c4826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166105419092919063ffffffff16565b80519091501561046a57808060200190518101906104e2919061070c565b61046a5760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b6064820152608401610291565b6060610550848460008561055a565b90505b9392505050565b6060824710156105bb5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b6064820152608401610291565b843b6106095760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401610291565b600080866001600160a01b03168587604051610625919061075e565b60006040518083038185875af1925050503d8060008114610662576040519150601f19603f3d011682016040523d82523d6000602084013e610667565b606091505b5091509150610677828286610682565b979650505050505050565b60608315610691575081610553565b8251156106a15782518084602001fd5b8160405162461bcd60e51b8152600401610291919061077a565b600080604083850312156106ce57600080fd5b82356001600160a01b03811681146106e557600080fd5b946020939093013593505050565b60006020828403121561070557600080fd5b5035919050565b60006020828403121561071e57600080fd5b8151801515811461055357600080fd5b60005b83811015610749578181015183820152602001610731565b83811115610758576000848401525b50505050565b6000825161077081846020870161072e565b9190910192915050565b602081526000825180602084015261079981604085016020870161072e565b601f01601f1916919091016040019291505056fea2646970667358221220c0f03149dd58fa21e9bfb72a010b74b1e518d704a2d63d8cc44c0ad3a2f573da64736f6c63430008090033',
  //       },
  //     };
  //   });
  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: {
            jsonrpc: '2.0',
            id: 6622123502601732,
            result: {
              baseFeePerGas: '0x27a9c704e',
              difficulty: '0x0',
              extraData: '0x546974616e2028746974616e6275696c6465722e78797a29',
              gasLimit: '0x1c9c380',
              gasUsed: '0xa5ccfa',
              hash: '0xef3c13739a74dbf832e68d02c07bdc5678d1652c3991cd2952ea049c144be952',
              logsBloom:
                '0x8165153a553ac220500845a4e90c762f9ad05c0a0ea041405099850cf590031c01a4011cc459118180181c001016411c3e198071bac6ec690812a7801928f941a456d51848801dace9924f38c43488f88d52f00d1c54df2c048a2c0ca2bd87a00b0c04e092b4eb0061419880a8a2d94ff23300224a0f4c00105b4dd09e4c1c20520306f50e645808c471046c09180f2f914ad181eb0110c86028084e93924819df25036f7e4a6280dcb246c49412b442c440e09a8303084201304011c74c12f059127a0338cf4ac50842190a450a864414f1292c348bdd51d86b100e0a61a7661d32a10e8e00c480453532ac0f4790182822d6856342c65582394909445074f2',
              miner: '0x4838b106fce9647bdf1e7877bf73ce8b0bad5f97',
              mixHash:
                '0xd378cf6d2d0f265bdc929fb873ff700cf333f9f2ffb08c3aebfa9139a1597ff4',
              nonce: '0x0000000000000000',
              number: '0x115e89f',
              parentHash:
                '0xaaa44a9a2105d050eb4caa2adfee14844fc847e1f71f9c7cd84886c768b8d079',
              receiptsRoot:
                '0x98b093e81dc5fbe163fda0deecb4eca92faf1cb8a868d4516518abf9a35143bf',
              sha3Uncles:
                '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
              size: '0xb900',
              stateRoot:
                '0x178ee15b5dcd2073e59f1418eb12f65c7da2e15be02db8dd50a10da509cdab12',
              timestamp: '0x65118773',
              totalDifficulty: '0xc70d815d562d3cfa955',
              transactions: [
                '0x9059d41aa4cc37b5d73eec038065831d0983605d9376fc0ec93478a05b301e64',
                '0xa9c808e9c1e5173b8ce763f3d40989e0941d0491cbb9e2f98c77ac5734112794',
                '0xc74b63f548fd6634bc3c09a2a820b1551c3204bf3169160365e3332c71ebfee5',
                '0xc7f567d9c1762d60b51e0bad13ffaca9eeec085f33d9cd7aae0567072bf00b6b',
                '0xe08579fbc938cbe731e9b67352b106e3caea7405cd65b13e55e911ee0fe2268f',
                '0x83d5a7862c8e4d60a5f0caf970d5c0685d44b749ec17bdc0f02d13ac6f5a64ad',
                '0x6b71ed1b23418b479dafc3ced6ce29869a77f767885bd7da1e7d019f06f83c6b',
                '0xd09f871501d31efb3a1ef03aeb6b5437e71f4cb58979dbfed55012169564403e',
                '0xb429ebd2c7550ef09f2f72e0cbac1502e0ef466644e9f111e7f7b97eb5a8bb07',
                '0x926d6be3ddc69d9484016ab30468349c71a2eaeb7f39d8153d45cf4ae0db9ecd',
                '0x23d61a76af18909f178803ee884e8d22e34aa607d48c2af14431ad79e85c3fad',
                '0x563cce3431a50a76334f1c7cc92fefa3036ae26ffc3c0613109482d64c938a60',
                '0xc2ddde804079246f657eabb34d8597390b36f695baa86193bc551976e40d0c93',
                '0x14100757dc6dbfe2cba6a70ac9e378963af9caad1dd55b1ccb24db478a360c36',
                '0x8e92e1cf862b0a89d1d6d39af02128ecc5e0dcfcd08e8ab784f27fe81c27d388',
                '0x9e1b2c6ec1f592be10f3fd545d1fb7c4e93f0dd2005fd8f0975d3ea75fda361e',
                '0xd9de58ae9910150937aa802d9a4ed83b2e8ea63a1436f3f90f7f91e0ba155571',
                '0xf29e19275f87ff0ffc254b34e4c15944623c925a2fdc3c03426b2e7f3d79072b',
                '0xde7904e3c34779c37f87bb8681bbf4ae0fa918e5ead0f2de43000f1acb144701',
                '0x0f98c38ffa54e8fe0a7080e4547f9f51ca3d1be077da7dc4bfa546bb296fef96',
                '0x0567bda26f7eb051a33de40a436a9c8d3d017db397482c28e60c1610a35027a6',
                '0xf52de2d7f88736bded2389619d2e09612d32f77ce5a75909da5b8d72b47d7a42',
                '0x67b11a07c3e81ede52b988b5dcf2409f119d80f6aa412c7e39e6091c3c930c62',
                '0x6d49119a87395ec6056525a463772632b5013f2f5f377365aba8e52008357ba7',
                '0xe8bde325875792ede464275ca5424c61d9522947f896c7550fbb9bb6d5d5940b',
                '0xe425bd83acc0a4ff67479168ea70c0779c271a0ce23038f756621e994176c371',
                '0xb36333325d36df5b185d260231ab2ff1b119c85159e6c494e87d2f96fced1286',
                '0x698d576e93de24fbaa13eb0e48f0a30b76cb619724d5a2eb2b3c7f5ca3392801',
                '0xa99738c93d9a2a5a3ceb49deaebbaa1d8116e15009144e1b09ddd809899a61a0',
                '0xd894a8a05ca15ef451c209094545946e1bc4926185473052b590c0fe43ed1c51',
                '0xf842d0ce3994c38bd99ff800fae41667c7cc7acb3a78cded1182601a35d87a30',
                '0xad6816e09048b1d4e6b5b4363fe6eb6026fab8f5f5f6155e7f05bf3678b1eb0c',
                '0x52a95ffe6f4db250b980b55efbb9808883efc9bba061a8bfec2ef35dadbfd3ce',
                '0xc09b494f7bb236c4d79b339276c165b7ead928c5483815fd92d80c3fd72546e5',
                '0x10548ddb89d16a45351b7052e7807fc6dcceab0b679d563d880f5bd8ac966c2f',
                '0x6d209701e59419e3bf32a97c10483310510677ebee08b24f9d3efcfea3a044c8',
                '0xea60d3b0c6312b6eacd7e058e42069803e429bf48e04ca0db1c21b4edea0315b',
                '0x483be9f5b64408c98891a361a70b843fcba66a35c5235970422947f85bbe521d',
                '0x62ee4f24e2df2ae42b629b61461aaf2bfa19b66c45b2d84dc59cd31c8ef53a69',
                '0x87b1c10f716e5016e1f20a37e94d3ab4405c06a4748ab4c643eb50586f897d75',
                '0xdf800a1252a8191b76295e9bcf4316ccf8102480f86cbebaf23a8a1795976210',
                '0xc877b85c960a25decdd143e4d5701a2ebbae90db9131060e8fe37be831a8b9d4',
                '0x53719cbe936e7f33a3aac949c713a53c5b5c0c106df035a3bb54341e09d4b2d9',
                '0x5c1e4843256716cec2005ac26cb32db7836feb5a3a5198f41383036045340606',
                '0xf7bb5bc16cdc248e05e4b445cb765b70ecfb337611896ddb277d5c75b558421a',
                '0x1735052b0c47ccdc5d3ea1b340a482c8ca9b22427c2692b396e144c75c320690',
                '0x070dbc89d73e41063a1a92c35291bf00d83a19b227e0e5c6ed275b44ce9479b8',
                '0x3623b4b349a84338bae01db0d02cdae0f0eddb5821809f028347dfe52a030dcc',
                '0xd08d4f2149e5c2b013254fbd918e0fc8f05871d9dadd099150a7cc2fe449cb45',
                '0x8cb137eb48bfda0cc702cf93daf2d48046d4a05608a584e4669b00d62967a380',
                '0x2e9da39b5a5a85cd711a731586d6a21bdca0be635482df45420adad50718ed4c',
                '0xf9a715ad7e88a95e8bd106708f4ffe084298e8986a2eefad14ad7c9035a87a9e',
                '0x2adcf8a6cc92345f015d55da6433b434c3ca41b47658776d86a748625391e04c',
                '0xb0a2df9e633e2f0c7601a00f2d2633911007c44abcdeb52dcc5a0877b23cdcf9',
                '0xa95fe3bdf90a29b0a5b3998d0eee781d0bb4b7abfdea007175d9cce8a7ae0262',
                '0xb01314bb3d1879181d7fbb4ca110f526c8e1632ef45d90a1ba67dbc16be7e222',
                '0x7bb98a9ad94f5414f1d2edcc132a217624c629ab8d123531330058593ae64912',
                '0xbe401169c7be4bffee0ad72784063f0e130e8691bd5db40de7c73ab27d4046e1',
                '0xa3ac77dc802b49a62d2bb24f864d9ce874d3725d650f46a554e734673ab7cdc8',
                '0xa1fd1b1417fee352aaeaba54490b83bbd1a50af419bec62345334a1ecc23b4c8',
                '0x3d241480221a5e925c8cb415f2198a5d6ff70d65463cce7131bade13fab1ce28',
                '0x439912c160c450c014e3432354b4bbb4997e95e61218eb1d7b459039c6fcead4',
                '0x97b537e13866262cbea26205e17b7993dd0e8ff8367edca05b1ea472707f3a4a',
                '0x4aaa307d354fc265d724426e536b834e5f392b1627b20760cc504a6e72061cbf',
                '0x9fec699b819fe9002fe202cd8f6b0394ca835d4ada419cf7cf320bfc26e98e1e',
                '0x6f054b8fe4edb55a661d8db00759a69e0d448771557f2d057e55722468cdd606',
                '0xac68b84a0b9dc7a4d0ac715849d64cce72a39f873b80ff1587ef971846f6b385',
                '0x552ad6f2f6cd4f74cd9352e5c68a91cffc20f85c4e813a688f5c55107d0a1c8d',
                '0x2df1343d23eb9ed0a8946487e57dfb981595e3766bd9d8dc13d373f1cdb2ba02',
                '0x4ff1c5c48cd60e39cc657e406b08bd2d57ada1b96b07e30fdf402cc4d3e684fc',
                '0x8b59282f0d96a2351544e4bcb10be81a8495f7345150c2128fa5c8c5fda95449',
                '0xcae4a5c4853769b802be70cd5431cabdeabecddeb7042bbba8e491c2233eadf6',
                '0x4da724c3637182287fd8bf52a540fab03e2d6a64d69774333dae12620b3e4540',
                '0x519529afad70e7bd9abb5ee8e5a014b6cad752a8794b709f42ca65979e533b28',
                '0x5d4a4001456bde0bee48e9482bcf68de009eada66165c74ad4d007105f191026',
                '0xb50b0a67ac4331ea505f873d100c202768b1212d1fe9c8807f07ab8037e42ff4',
                '0xafe3b3fd3efcc3b01b171699a3a84a49b1114b812e6d706730079b980ac15bea',
                '0x343a9fb9a78e6c96f83140bf3ad84f36a2e598a07c680a5a2734ebd552f434c9',
                '0xddf5294551ed61126e9c49959efc3afdb83bf091d0525e86aecce7f74c45bff3',
                '0x98e94b0d3fa9c1a039a1536144e385eb9bda125df7e910e4fb59a637c6e70bb7',
                '0x9afd658cc775f12e3126e6a11b6659d3e1abe75d7e7a794034e7e1d9fb88c21e',
                '0xdf4f6c975ae5da50ef284d4ccc2d4c463b9db647cf8581288906336b20d6c8f3',
                '0x69736f3f5285de38bdf551f03d80119542835da90502cbbb63e00d0f910d0176',
                '0x869d7e8a44e901d7d2a63059de4919ecfec3ee7d2bc0d0038ebee552ad5a5e33',
                '0xc2348c825d40d202e8734c891f47a0ebd8406632f6d443862290591aa838bb77',
                '0xce8bae249e584b5e5a9f238a9c7a8fcc8bfb4965b5b8741722e31e39bc07a18d',
                '0x6df9016cfe938873c382c420a0cb2ab74d2b574f161bd8da46c0908772db66cb',
                '0x412e00daca21b6ebb693e4b22e7a8d6257a86fe22ae6c5f4c0d3a1301a93af47',
                '0x04bf55567cbd6891bee91170b4b977d9eb4ef2e9f570873b4ddb3b1e1b76820a',
                '0x0dad74e0645a37f7612879fde59594428c07ef4fc5417100f1bf984c5cf101a1',
                '0xa111b5cd8e619db42d8943cf8b2659d3edd7a89ecb0906259e69398ab3449633',
                '0xf2d4bf5289820254f3833115c173722b416055a784e88580bec2cb35407c628f',
                '0x3b394efb60c8d87faed0daf4852d2570abdce93689eb6095f5b3358423decb1a',
                '0x8109dbd4c7792175c63ce81be0b84ae19707b2489aa969e6d11c3b8474a163c7',
                '0xed5ca7b5bbde8d8d0d886b07e08323a42a604323ab13c3d133aa66a9e772ac07',
                '0x67c61c57ca9309bc7d4c87b5e3858ff4b6b7a1f37f9a286d2a4dd19bc52b3ed9',
                '0x49ab472f6ff2d1d4b36d18c61571e413b0ecc289fc494abacd06afe0d1871bbb',
                '0x5550680280bcae4e4c3c6374cd1f52152f332c5268ea6841f3f5cdaf83b5dd51',
                '0x43f3114ccdbac01aa75c99df6b6aa6f5f674c9e3416b6f06cd85a2d33baa8376',
                '0xd28568972ecc67b0bb1881c8e86d8e55e980a2ca980d4ec1edae45c0caff1c43',
                '0xc102a68670f101123acb5f7b7a457d8856807275b8171299c86f3f533b00e9c9',
                '0xe09bd884e2a2d54974a9a5cdef6362d771ef8cb7ca4b25480463229c4ebe961e',
                '0x12be17cbd5e4585d8e749fb6614f33a0ab15b1796726247f81b153a06ececccc',
                '0x7f20fbab8ce1d187c245b7b4e94dc171f122661117942f6664794236cb6647d5',
                '0x0fe717208d0802aa5106e2d492e8e66a83d83c37ea0a48688649c8cc1aef5b5d',
                '0xb3cb37e51392de161266feada62e9000baaf8239f33821ffcaeafe5cb30b8c90',
                '0x5f1730696ab4d561b1046030fdc9a7b6f97124767a55f5a6681541f30cc70815',
                '0xb6b97fe12d5cd9a5a7b82acc1fa9b10a5e0136174508972b111f6005e53d9a8e',
                '0xf38feeafd7919d5d9d504e10ada37b6a14bfec7894e12f355e054741b0969b16',
                '0x20e2698413971b9551ebfc0c5cde0dbd2aaefa57068b06224da9683b8dd82407',
                '0x4fa92401a6352e9e174eac983f5bdb234f4e5299d73be86868426dcd2b69fe88',
                '0xa2117a62b5db1e69bca456b1c9b7493f213f604e2d480bb16936ae2d99e09196',
                '0xbcc266e8bbb69ed7e8b8c2f0a294935f463525309be6306ef719b7ec23643cd4',
                '0x1f9f40603924e15d8b033037a4f2cffe48e2da008b754641214e9287112aef17',
                '0x99548bf0b175e63b2087d24371c923cd1b57ee55d0b8aa58e65bf42448ded795',
                '0xc2db2bf70a381d691a2516355fd9dd3a97a217ef8a369e0471fb9adad148231a',
                '0xff4b7aa0685599ea1f0584f61c80d6514392ab0d83af84e8e9b2519b3e5e574c',
              ],
              transactionsRoot:
                '0x6d3ec1bc27db9969de9559a9e543b95803ba112322a6051fa24a0969d7d41c9e',
              uncles: [],
              withdrawals: [
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfa6749',
                  index: '0x11f9ce6',
                  validatorIndex: '0x3f68c',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfb1c39',
                  index: '0x11f9ce7',
                  validatorIndex: '0x3f68d',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfa4f9f',
                  index: '0x11f9ce8',
                  validatorIndex: '0x3f68e',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfac9b2',
                  index: '0x11f9ce9',
                  validatorIndex: '0x3f68f',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xf9d05f',
                  index: '0x11f9cea',
                  validatorIndex: '0x3f690',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xf93c85',
                  index: '0x11f9ceb',
                  validatorIndex: '0x3f691',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfb311b',
                  index: '0x11f9cec',
                  validatorIndex: '0x3f692',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfabeea',
                  index: '0x11f9ced',
                  validatorIndex: '0x3f693',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfaadbe',
                  index: '0x11f9cee',
                  validatorIndex: '0x3f694',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfaf166',
                  index: '0x11f9cef',
                  validatorIndex: '0x3f695',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfb1baa',
                  index: '0x11f9cf0',
                  validatorIndex: '0x3f696',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfb4637',
                  index: '0x11f9cf1',
                  validatorIndex: '0x3f697',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfb38e8',
                  index: '0x11f9cf2',
                  validatorIndex: '0x3f698',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfb12bd',
                  index: '0x11f9cf3',
                  validatorIndex: '0x3f699',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfb83e9',
                  index: '0x11f9cf4',
                  validatorIndex: '0x3f69a',
                },
                {
                  address: '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
                  amount: '0xfb46fb',
                  index: '0x11f9cf5',
                  validatorIndex: '0x3f69b',
                },
              ],
              withdrawalsRoot:
                '0xbfd69cb62b005a45493a6740e04c63a9c430d9c6898a4650fbc740111e8aa503',
            },
          },
        },
      };
    });
}

/**
 * Tests various Blockaid PPOM security alerts. Data for the E2E test requests and responses are provided here:
 *
 * @see {@link https://wobbly-nutmeg-8a5.notion.site/MM-E2E-Testing-1e51b617f79240a49cd3271565c6e12d}
 */
describe('Confirmation Security Alert - Blockaid', function () {
  it('should not show security alerts for benign requests', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkController(mainnetProviderConfig)
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .build(),
        defaultGanacheOptions,
        testSpecificMock: mockInfura,
        title: this.test.title,
      },

      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        const testBenignConfigs = [
          {
            logExpectedDetail: 'Benign 1',
            method: 'eth_sendTransaction',
            params: [
              {
                from: selectedAddress,
                data: '0x095ea7b3000000000000000000000000000000000022d473030f116ddee9f6b43ac78ba3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                to: '0x6b175474e89094c44da98b954eedeac495271d0f',
                value: '0x0',
              },
            ],
          },
          // {
          //   logExpectedDetail: 'Benign 2',
          //   method: 'eth_sendTransaction',
          //   params: [
          //     {
          //       from: selectedAddress,
          //       to: '0xf977814e90da44bfa03b6295a0616a897441acec',
          //       value: '0x9184e72a000',
          //     },
          //   ],
          //   block: '16000000',
          // },
          // {
          //   logExpectedDetail: 'eth_signTypedData',
          //   method: 'eth_signTypedData',
          //   params: [
          //     selectedAddress,
          //     '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Permit":[{"name":"holder","type":"address"},{"name":"spender","type":"address"},{"name":"nonce","type":"uint256"},{"name":"expiry","type":"uint256"},{"name":"allowed","type":"bool"}]},"primaryType":"Permit","domain":{"name":"Dai Stablecoin","verifyingContract":"0x6b175474e89094c44da98b954eedeac495271d0f","chainId":1,"version":"1"},"message":{"expiry":1683011683,"nonce":3,"spender":"0x1111111254eeb25477b68fb85ed929f73a960582","holder":"0x3bbec29ab82db1f0be3f67261cc902c4e35ab70d","allowed":true}}',
          //   ],
          //   block: '17181852',
          // },
          {
            logExpectedDetail: 'blur',
            method: 'eth_signTypedData_v4',
            params: [
              selectedAddress,
              '{"types":{"Order":[{"name":"trader","type":"address"},{"name":"side","type":"uint8"},{"name":"matchingPolicy","type":"address"},{"name":"collection","type":"address"},{"name":"tokenId","type":"uint256"},{"name":"amount","type":"uint256"},{"name":"paymentToken","type":"address"},{"name":"price","type":"uint256"},{"name":"listingTime","type":"uint256"},{"name":"expirationTime","type":"uint256"},{"name":"fees","type":"Fee[]"},{"name":"salt","type":"uint256"},{"name":"extraParams","type":"bytes"},{"name":"nonce","type":"uint256"}],"Fee":[{"name":"rate","type":"uint16"},{"name":"recipient","type":"address"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Blur Exchange","version":"1.0","chainId":"1","verifyingContract":"0x000000000000ad05ccc4f10045630fb830b95127"},"primaryType":"Order","message":{"trader":"0xd854343f41b2138b686f2d3ba38402a9f7fb4337","side":"1","matchingPolicy":"0x0000000000dab4a563819e8fd93dba3b25bc3495","collection":"0xc4a5025c4563ad0acc09d92c2506e6744dad58eb","tokenId":"30420","amount":"1","paymentToken":"0x0000000000000000000000000000000000000000","price":"1000000000000000000","listingTime":"1679418212","expirationTime":"1680023012","salt":"154790208154270131670189427454206980105","extraParams":"0x01","nonce":"0"}}',
            ],
          },
          {
            logExpectedDetail: 'seaport',
            method: 'eth_signTypedData_v4',
            params: [
              selectedAddress,
              '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"OrderComponents":[{"name":"offerer","type":"address"},{"name":"zone","type":"address"},{"name":"offer","type":"OfferItem[]"},{"name":"consideration","type":"ConsiderationItem[]"},{"name":"orderType","type":"uint8"},{"name":"startTime","type":"uint256"},{"name":"endTime","type":"uint256"},{"name":"zoneHash","type":"bytes32"},{"name":"salt","type":"uint256"},{"name":"conduitKey","type":"bytes32"},{"name":"counter","type":"uint256"}],"OfferItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"}],"ConsiderationItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"},{"name":"recipient","type":"address"}]},"primaryType":"OrderComponents","domain":{"name":"Seaport","version":"1.4","chainId":"1","verifyingContract":"0x00000000000001ad428e4906aE43D8F9852d0dD6"},"message":{"offerer":"0xCaFca5eDFb361E8A39a735233f23DAf86CBeD5FC","offer":[{"itemType":"1","token":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","identifierOrCriteria":"0","startAmount":"2500000000000000","endAmount":"2500000000000000"}],"consideration":[{"itemType":"2","token":"0xaA7200ee500dE2dcde75E996De83CBD73BCa9705","identifierOrCriteria":"11909","startAmount":"1","endAmount":"1","recipient":"0xCaFca5eDFb361E8A39a735233f23DAf86CBeD5FC"},{"itemType":"1","token":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","identifierOrCriteria":"0","startAmount":"62500000000000","endAmount":"62500000000000","recipient":"0x0000a26b00c1F0DF003000390027140000fAa719"},{"itemType":"1","token":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","identifierOrCriteria":"0","startAmount":"12500000000000","endAmount":"12500000000000","recipient":"0x8324BdEF2F30E08E368f2Fa2F14143cDCA77423D"}],"startTime":"1681835413","endTime":"1682094598","orderType":"0","zone":"0x004C00500000aD104D7DBd00e3ae0A5C00560C00","zoneHash":"0x0000000000000000000000000000000000000000000000000000000000000000","salt":"24446860302761739304752683030156737591518664810215442929812618382526293324216","conduitKey":"0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000","totalOriginalConsiderationItems":"3","counter":"0"}}',
            ],
          },
        ];

        for (const config of testBenignConfigs) {
          const { logExpectedDetail, method, params } = config;

          // Send JSON-RPC request
          const request = JSON.stringify({
            jsonrpc: '2.0',
            method,
            params,
          });
          await driver.executeScript(
            `window.transactionHash = window.ethereum.request(${request})`,
          );

          // Wait for confirmation pop-up
          await driver.waitUntilXWindowHandles(3);
          const windowHandles = await getWindowHandles(driver, 3);
          await driver.switchToWindowWithTitle('MetaMask Notification');

          const isPresent = await driver.isElementPresent(bannerAlertSelector);
          assert.equal(
            isPresent,
            false,
            `Banner alert unexpectedly found. \nExpected detail: ${logExpectedDetail}`,
          );

          // Wait for confirmation pop-up to close
          await driver.clickElement({ text: 'Reject', tag: 'button' });
          await driver.switchToWindow(windowHandles.dapp);
        }
      },
    );
  });

  /**
   * Disclaimer: this test may be missing checks for some reason types. e.g. blur, domain, and failed
   */
  it('should show security alerts for malicious requests', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkController(mainnetProviderConfig)
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .build(),
        defaultGanacheOptions,
        testSpecificMock: mockInfura,
        title: this.test.title,
      },

      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        const expectedTitle = 'This is a deceptive request';

        const testMaliciousConfigs = [
          // {
          //   btnSelector: '#maliciousApprovalButton',
          //   expectedDescription:
          //     'If you approve this request, a third party known for scams might take all your assets.',
          //   expectedReason: 'approval_farming',
          // },

          // PPOM Error: block does not exist
          // Sending ETH - Contract at 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 could not be found in the project information
          // {
          //   expectedDescription:
          //     'If you approve this request, a third party known for scams will take all your assets.',
          //   expectedReason: 'transfer_farming of ERC20',
          //   btnSelector: '#maliciousERC20TransferButton',
          // },

          // Error from PPOM: block does not exist
          // Sending ETH - Contract at 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB could not be found in the project information
          // transferPunk(address _to, uint _tokenId)
          // {
          //   btnSelector: '#maliciousERC721Transfer',
          //   expectedDescription:
          //     'If you approve this request, a third party known for scams will take all your assets.',
          //   expectedReason: 'transfer_farming of ERC721',
          // },
          {
            btnSelector: '#maliciousPermit',
            expectedDescription:
              'If you approve this request, a third party known for scams might take all your assets.',
            expectedReason: 'permit_farming',
          },
          // PPOM Error: block does not exist
          // {
          //   btnSelector: '#maliciousRawEthButton',
          //   expectedDescription:
          //     'If you approve this request, you might lose your assets.',
          //   expectedReason: 'raw_ether_transfer',
          // },
          {
            btnSelector: '#maliciousSeaport',
            expectedDescription:
              'If you approve this request, someone can steal your assets listed on OpenSea.',
            expectedReason: 'seaport_farming',
          },
          // {
          //   btnSelector: '#maliciousSetApprovalForAll',
          //   expectedDescription:
          //     'If you approve this request, someone can steal your assets listed on OpenSea.',
          //   expectedReason: 'set_approval_for_all'
          // },
          {
            btnSelector: '#maliciousTradeOrder',
            expectedDescription:
              'If you approve this request, you might lose your assets.',
            expectedReason: 'trade_order_farming',
          },
        ];

        for (const config of testMaliciousConfigs) {
          const { expectedDescription, expectedReason, btnSelector } = config;

          // Click TestDapp button to send JSON-RPC request
          await driver.clickElement(btnSelector);

          // Wait for confirmation pop-up
          await driver.waitUntilXWindowHandles(3);
          const windowHandles = await getWindowHandles(driver, 3);
          await driver.switchToWindowWithTitle('MetaMask Notification');

          const bannerAlert = await driver.findElement(bannerAlertSelector);
          const bannerAlertText = await bannerAlert.getText();

          assert(
            bannerAlertText.includes(expectedTitle),
            `Expected banner alert title: ${expectedTitle} \nExpected reason: ${expectedReason}\n`,
          );
          assert(
            bannerAlertText.includes(expectedDescription),
            `Expected banner alert description: ${expectedDescription} \nExpected reason: ${expectedReason}\n`,
          );

          // Wait for confirmation pop-up to close
          await driver.clickElement({ text: 'Reject', tag: 'button' });
          await driver.switchToWindow(windowHandles.dapp);
        }
      },
    );
  });
});

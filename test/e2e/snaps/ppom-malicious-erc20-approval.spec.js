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
const BUSD_ADDRESS = '0x4fabb145d64652a948d72533023f6e7a623c7c53';

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
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x27d17a5b79f77509541',
        },
      };
    });

    await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
      params: [{accessList:[],data:"0x00000000"}]
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: {
            calls: [
                {
                    error: "execution reverted",
                    from: BUSD_ADDRESS,
                    gas: "0x1d55c2cb",
                    gasUsed: "0x39c",
                    input: "0x00000000",
                    to: "0x2a3f1a37c04f82aa274f5353834b2d002db91015",
                    type: "DELEGATECALL",
                    value: "0x0"
                }
            ],
            error: "execution reverted",
            from: "0x0000000000000000000000000000000000000000",
            gas: "0x1dcd6500",
            gasUsed: "0x721e",
            input: "0x00000000",
            to: BUSD_ADDRESS,
            type: "CALL",
            value: "0x0"
          }
        },
      };
    });

    await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
      params: [{data:"0x095ea7b3000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6000000000000000000000000000000000000000000000000ffffffffffffffff"}]
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: {
            calls: [
                {
                    from: BUSD_ADDRESS,
                    gas: "0x291ee",
                    gasUsed: "0x79bb",
                    input: "0x095ea7b3000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6000000000000000000000000000000000000000000000000ffffffffffffffff",
                    logs: [
                        {
                            address: BUSD_ADDRESS,
                            data: "0x000000000000000000000000000000000000000000000000ffffffffffffffff",
                            topics: [
                                "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
                                "0x0000000000000000000000005cfe73b6021e818b776b421b1c4db2474086a7e1",
                                "0x000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6"
                            ]
                        }
                    ],
                    output: "0x0000000000000000000000000000000000000000000000000000000000000001",
                    to: "0x2a3f1a37c04f82aa274f5353834b2d002db91015",
                    type: "DELEGATECALL",
                    value: "0x0"
                }
            ],
            from: selectedAddress,
            gas: "0x30d40",
            gasUsed: "0xeac5",
            input: "0x095ea7b3000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6000000000000000000000000000000000000000000000000ffffffffffffffff",
            output: "0x0000000000000000000000000000000000000000000000000000000000000001",
            to: BUSD_ADDRESS,
            type: "CALL",
            value: "0x0"
        }
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
          result: '0x116fecf',
        },
      };
    });

  // balanceOf (address) to BUSD
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [{accessList:[], data:`0x70a082310000000000000000000000005cfe73b6021e818b776b421b1c4db2474086a7e1`, to: BUSD_ADDRESS}]
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x000000000000000000000000000000000000000000000000000000000001ea4c',
        },
      };
    });


  // get contract code BUSD
  await mockServer
  .forPost()
  .withJsonBodyIncluding({
    method: 'eth_getCode',
    params: [BUSD_ADDRESS]
  })
  .thenCallback((req) => {
    return {
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: req.body.json.id,
        result: '0x60806040526004361061006c5763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416633659cfe681146100765780634f1ef286146100975780635c60da1b146100b75780638f283970146100e8578063f851a44014610109575b61007461011e565b005b34801561008257600080fd5b50610074600160a060020a0360043516610138565b61007460048035600160a060020a03169060248035908101910135610172565b3480156100c357600080fd5b506100cc6101ea565b60408051600160a060020a039092168252519081900360200190f35b3480156100f457600080fd5b50610074600160a060020a0360043516610227565b34801561011557600080fd5b506100cc610339565b610126610364565b610136610131610411565b610436565b565b61014061045a565b600160a060020a031633600160a060020a03161415610167576101628161047f565b61016f565b61016f61011e565b50565b61017a61045a565b600160a060020a031633600160a060020a031614156101dd5761019c8361047f565b30600160a060020a03163483836040518083838082843782019150509250505060006040518083038185875af19250505015156101d857600080fd5b6101e5565b6101e561011e565b505050565b60006101f461045a565b600160a060020a031633600160a060020a0316141561021c57610215610411565b9050610224565b61022461011e565b90565b61022f61045a565b600160a060020a031633600160a060020a0316141561016757600160a060020a03811615156102e557604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603660248201527f43616e6e6f74206368616e6765207468652061646d696e206f6620612070726f60448201527f787920746f20746865207a65726f206164647265737300000000000000000000606482015290519081900360840190fd5b7f7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f61030e61045a565b60408051600160a060020a03928316815291841660208301528051918290030190a1610162816104c7565b600061034361045a565b600160a060020a031633600160a060020a0316141561021c5761021561045a565b61036c61045a565b600160a060020a031633141561040957604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603260248201527f43616e6e6f742063616c6c2066616c6c6261636b2066756e6374696f6e20667260448201527f6f6d207468652070726f78792061646d696e0000000000000000000000000000606482015290519081900360840190fd5b610136610136565b7f7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c35490565b3660008037600080366000845af43d6000803e808015610455573d6000f35b3d6000fd5b7f10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b5490565b610488816104eb565b60408051600160a060020a038316815290517fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b9181900360200190a150565b7f10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b55565b60006104f6826105ae565b151561058957604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603b60248201527f43616e6e6f742073657420612070726f787920696d706c656d656e746174696f60448201527f6e20746f2061206e6f6e2d636f6e747261637420616464726573730000000000606482015290519081900360840190fd5b507f7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c355565b6000903b11905600a165627a7a72305820b274fe16b200679a229fcce27c65314a32b3cff995c434133f535dd565bba4740029',
      },
    };
  });

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

    await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 1,
              created_at: null,
              text_signature: 'approve()',
              hex_signature: null,
              bytes_signature: null,
            },
          ],
        },
      };
    });

   await mockServer
     .forPost()
     .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
     .thenCallback((req) => {
       return {
         statusCode: 200,
         json: {
            jsonrpc: "2.0",
            id: 7631292168577930,
            result: {
                baseFeePerGas: "0x16c696eb7",
                difficulty: "0x0",
                extraData: "0x6631622e696f",
                gasLimit: "0x1c9c380",
                gasUsed: "0xa0056a",
                hash: "0x46be2982228b663026adae2bcedf1fcff63e244deeb1092a9bf498be54215d0c",
                logsBloom: "0x2937858c6d9cfb38c4d80264a351d63c9128489348959c00413114802722281e0048c4e3038ac093709089b0809a2192e6c185500811b86e2074c92d092a386c0342f1084e3828786823ee6b77080b7cbc9732020058d48c4d5348e78a6440c83bc06011ba0abbc94145107218404cf306b00a63216604053e4aa018000e902795c30170819001002bce21443b1aa083e84029559b61182c694110c0d8340efa8f0d117328a464460c1ec6f4305bac8275b4ce2ec90740a694e2884f810b0320c0c68492e781434908a160a30ced3a1c5041628bb4bc201d9e1502121421e6472e59ac58b6240680128499a9a4fb892083e692155b58a3559eaa123be01f0619",
                miner: "0x5124fcc2b3f99f571ad67d075643c743f38f1c34",
                mixHash: "0xdcf58909059bf2c21d9f84862e5f038b622443395b8e91a147353d0403019c6f",
                nonce: "0x0000000000000000",
                number: "0x116f841",
                parentHash: "0x40bbc17240a659f2df8f3392a9d6d97f1ec60dd6407ee4553ddf40f32187a5cc",
                receiptsRoot: "0x8daf2c9ec0110723e3332be6de9d2ec7cc616bd6f2cab65c8db3f1116cc92076",
                sha3Uncles: "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
                size: "0xf903",
                stateRoot: "0x8329c5c0838396dd640d00ab34f7aad71bf5d3d98a121e182a171f96e811e1dd",
                timestamp: "0x651e594f",
                totalDifficulty: "0xc70d815d562d3cfa955",
                transactions: [
                    "0x025d6db129bae563f653c7d0095a308f0fb605a6e519269753df46e9aaa7aeaf",
                    "0xe01dbeef9af2c47742a1c26069a71a9f70c544c6d80c4f63e5cfb56a6ba5e3db",
                    "0xc68b76b00344181378fc50e4914e99b6720470bb01d064f42fe721c5473918e2",
                    "0xe2d4323739c218a04013803f9961309f60b99db49b43e0b2215ac3624ff2da2f",
                    "0xd132b4a8f258e379bd0d4995347b333abca91b3d83ddba245595dafbb6cdac1a",
                    "0x0d9e5189abcf712e938bacd595240cd5467fb33ecac8f49ecd828db9eae5d842",
                    "0x4b9da2de3480e6431e0edc74c6000229417a761372701777dabe0fcc8582d228",
                    "0x4ab6221a5a2a1bb00e1b6583e9dc6dec05b27873b59ddf8955bfb0173d8f0f69",
                    "0x3e98a84a91cd8d6a54824804776c22a2f4dbe6d4b62b665d6fa41793c2ed64cc",
                    "0xb80f1371a9b541dd83c45fe450b54040a0bb949b697896874f73169156829225",
                    "0x60801d230e5a87cc0f5acae9e9be25a8ff89728a8e8a7f7694452a469cc890a7",
                    "0x089cb61bababa3a5d9f9aa2c65bba1fe4f659d2931069242d614fa53c991c858",
                    "0xb301035281c8001d8b1f8bd9423f00c56d144f92da40411a49ef73884dad0565",
                    "0x994553a9b9aa2348c9eb62165915af53d6aeba33558005fac5fa53953ba87eab",
                    "0x9f367bfc18e62885a8f9d71edfdeb86bf8256d218dd637015bbb185f1c228e1e",
                    "0x0c21e73c66d009dab799574510ed5b533256da2332e46f265d2a2ecf4df2f5d4",
                    "0x54e1fad4103782f1fe2304d1da249e6948dcb7d27646307f7c0f111460ab27e3",
                    "0xe793c71314eb429a249f26d62c82d588f76022eec775013f25841a441307ac20",
                    "0x9c33cb549884f94f4b05f095b75735b59ca01341cd8f3399bf9f7b4685f8017b",
                    "0x2f91e57ef968004af9105642f5b12d9955ff57799b1e983fe74ad3430ffe531c",
                    "0x617af6cf35eecbed22ac1b1d94e54ec105edf05a6c0d9cc4a5b7bcfdae942942",
                    "0xd31edbb8f112de1bd194853a0c4d50e9ee3e9a7a079253d50d5b10cb77afa3cd",
                    "0x0c37629d50b0c9e755c727522112cc381cd7f2ca3b201f1f0332e5b76b0d2eba",
                    "0xe6ae038c038df8d0091bb043b95c3c335e4ce538324fb1048ca98662a5d3fd8a",
                    "0xdb369684b55c236cfbcd6a9871621d796a626c43ecf8048d3365bd6854106e77",
                    "0xe084e6a6c86b9896d8ad654e348f29bba534431d187d32cc348b4c1fbdfb6ac2",
                    "0x137cbc7fb3cfbc868787c2a35cebc881ce3c130b4eade5592c004d348113e6cc",
                    "0xe037a224f579ebb494fb7789c99f059039204efca53c69a80259944d866397d6",
                    "0xc1f78a716f9b14e2f06947212c90b4c06c067574932e9a3d16aa111ea7a08325",
                    "0x74f30f6f2810711bd580b07cf0df42d71fc1404e555b6bcafbe8f83fbbf0613a",
                    "0x258ac5c91a8c34c4ece04b66882522d55639051468244a2adfbd421e96411c03",
                    "0x3eb7f91ae3d16d453d0ca327d02efe4cc46368c8d0148450afd4fbe23b6cd189",
                    "0x69b9d46d3a380cb836475fd8d7d89230f3cb1d12955ece13adba5ef289b7171f",
                    "0x9f3196f0211844deb3a84a00efd0224c4c2a1b4bd4ce4ab8289b36cb4083c202",
                    "0x4c203a40e9affc4f4be28ba9ba22f1c4a5c9e6c4226ebada8e63170e6e127183",
                    "0xc40a188843a35d90ac44e86b4ef738bf183bf3f44a037a8c5bf172fa1e6b3d82",
                    "0x87663321079a2233fd0c62f0714508aa03681ba17bbaf1b136668200ec91f94f",
                    "0xdd6ff72cab1d17bdcb274b67e9daedf142c909a05e0e9f1143c819f42ddc5d85",
                    "0xb4a922f6582276fdc2dd4d2f8cc87fc318a213e7ba0d87adb388cc2afa948aad",
                    "0xf48c8fd81c25dc5134d4327696f95cb90345b765658890ccba4842b09a3ee79e",
                    "0x1cdc4c9ec42401ee52a730c40062054826c518020704ff5afd706037299a3f4c",
                    "0x4384719429ce682f300c72a4e6d1de302571c53dcb9b925ac19919243027898f",
                    "0x2d1c5e589bbf1c3d84ac6a48cf6fffe73848add4d2606f2bc164d45d0a539bc5",
                    "0xcf095997048953d46637f4b23de28a7a0937387ee673aeac78956a4a2d18938e",
                    "0x4af3b1a11feabd6cdff5957737064abebbb3707aecf8f6f1d19d427f3ea6b88d",
                    "0xc8d426d5c0b342b1e34e205fec815a4e81dc440d14b2464eda894817746d583c",
                    "0xc1c83af1aff7327d5ad44eea78290eb25f308ef1d037fd152dc00db23163fac7",
                    "0x7b612d292c8bc245aac485a48c93e6ab510f79d260f0039c2dbc88cc53153ccf",
                    "0xcea5beff384c7defa0c290f803303531d68cdd3ea824c1169283206128edb824",
                    "0xc7ec7fca044fbe37bfeec938a9792f42ab1a3d8255feb00be93e68152ef130f2",
                    "0x370411cf89cd5e75b12136a0ba61070c0f072ebe877a313d2c55f2b0db96c233",
                    "0x62ded18451fb7ef92c5f8b3c888f8a304437095725c33691a9cacdc0665174eb",
                    "0x3be8d2cd758594cedd8a3e249f47ebed0d95ca1c8cbf109941811f0974daae6d",
                    "0x7eebdbdedf238af9ec6e0fb8860660db88d613b9a1c747de5b38b02763f2901b",
                    "0x337f14eab5bfdd58af32f28e115a1e2735c6bd52818e407a090d991bcacf900d",
                    "0xf9b377921e51e97b9a302d69dc55b99eeb96f8232b5fa8518f1cfddc4acd78aa",
                    "0x6a957b8481ad0935c6c864308ff09e78123daeb64a349b007ed714d810d14f54",
                    "0x3fafa02783759c232e9d06b65b3104f554e24410eb0ba8a6f02ba33f3e5f0bdb",
                    "0xaa3dff89f379cbb1f4c916885bb83763455c6cbd2ab4fb466032ada29c16bce0",
                    "0xc559e193f4abb05bd90f82525a3e14e345106da19cf405c73c462b7e17d4896a",
                    "0xfd487c02e24f2fbc8306027c459bb6559f8641596051e5dc56477c807324841a",
                    "0xfd62e1e1c9050034f11cb9e0109bd64cb727b261ca1c94fb4dbe6cdd2e4f8199",
                    "0xeaf0a50c8b204989689d827cd9ef7704d4fd0ee33fbfd1b6dc49c5ccd025068b",
                    "0x3fec28b8a00046992cb68b594cd98bf5aa9c11813c88e6d2a3a83a8ff2b1efd8",
                    "0x43cbfd77dbab4fca9cc310e90ce3e7b5b05e390968bfd43b71bd4e17ce73ae77",
                    "0x808e4b342458f54c258ce1dafc865d6cac2bdc263a488a988f1c2862fe02beda",
                    "0xafe2a9c974044d255669e8033d6c2a367c82ba2708f2a7d98c4cab2e1f8e1426",
                    "0x1aeb33eb00070c71fbb4649f718dff2e559bdfab80027932bbd8bff3e74ea6a6",
                    "0x9a64a51fdc0ad112b0ac516114e16efe281ed68f0a3eb39837aebbaab1bcbf9c",
                    "0xa0fe376754f08bbd2d9154283802e4259e46b178580169be0c21abdb8ef1ded8",
                    "0x8c68f0fbbfbe4ecfb2bc4c859538ee62531bd32dd488dd1b029d9bc2a639db64",
                    "0xa49bf5d42110fd52c30573bf2aba77b17d4ab081c0b8f68436eb40cf9b5ba3d6",
                    "0x115bc870a989ae86ad745015bf11cf3c66773ed2d26e80e11b8bc5a065194c13",
                    "0x316ac31966733f8c6b47aa75d5326a696bf5c4a651cb964df18f90f267dec789",
                    "0x8008670e8eba15b6d06bf6a7a3cbe9aca543d4e83a3a7369b0433e0b3e3ceae1",
                    "0x554ff6c269a97976ed8284cbfd024b04024bcf3b25d515d72dbcf038e47a1a08",
                    "0xa8b227e912c564b0a80aac19e3a618299985264d02a1b6baacf86df40e1ad758",
                    "0xf1cf308519a9025566d5210f7daf8195fe9c44e38e9cdc6f471c6b2699a7e5f0",
                    "0x7223a0b7cd4e47fc7b40ded2784cb2af6cb3ffd14674171f1c4c60b1ddb97b9c",
                    "0xc507db1b36a662139c09c232c00a2ae6c7dd45c1bc05e8d942037fae9d2c8833",
                    "0xbc15f576fb8e63dc0f7b70255ea0de87efb1082d86ca7f70f1bdef563b584426",
                    "0xa8d7889cf487e501ce6e3f019eed74f570def855fd47415fed45f3e0cd6e9e7f",
                    "0x52f950bd0ecb8ba81e6cd20ecf7a6e66371807c624123065adbe3c3d6c288500",
                    "0xfee006db800181afc124844c31b06924d25f60e8d2296288338af0e7e9f7044f",
                    "0x82d8d09880a7cab32dd3be06dac2dea0afea41e9f3fd9707a5e25f032dcb966f",
                    "0x7da65bbc41064b24bb5f272b187fa05df30ea22c768d2e6d336df313a266cb82",
                    "0x3c13b7c7e236d68d8c4799b71b9b6bd4ce36c520f3b2f29635421950f8a56e03",
                    "0x72aaefd1673c10dd0d8e5d4726a5eafd3a8726022ab382cf38cbce96c16dc728",
                    "0x90b5a4a70051fcc4e8312b563e43a1dd02c366f14659111225052d4bcac3a258",
                    "0xf4aa46063de8baa2ad61b3eabd1f12113e20a16eafd4c2a2e3b93cf94d8c9fcd",
                    "0xc18d5fa6f953d257cdb4699b58eb3132ad763c20fface4ec13b722e954aefbcf",
                    "0xd12e95ec8bfea56f712171dbc36c90a5c4bfa945e1dd6b87de9a01568856c23f",
                    "0x0142e97265b78e5e49b2bd552829753974872b0ebbeebb60257008fed298a203",
                    "0x532a433729da0def288b673ccbc5a192dffee962c93f1977719b6f8f76269a3d",
                    "0x1154125dcacd088953bb3eb1b28c547efe50bd40f74ac7e582154d22bcc15c36",
                    "0xd4bd5c72901df585e344a20125a4be4bc582a7d5ebf07d7999fae27daa31cce5",
                    "0x4fb02170dfd47274e00db7a23a9ec3446b8d89032438f6b9b5822178e8ad7e77",
                    "0xc8e62f9804f5e9934601245222a381c2571069fd4a939563517cc59f7b024cde",
                    "0x86ad26c2223eb7830306e57964e2050acc699ff5a50068ea8e940221fb08679e",
                    "0x7b96fd3e0f467ee48b6e249175feae53b6cc2a12482d2b2e4ba71774cfbd62cc",
                    "0xa0336d44a6f2f804fb0b1d83eadc27423242f79676545002da772899dfeea0b3",
                    "0x28e47bdefa59405e0e3267f047bf46d20304c98661f920fd87fd9f8bbc29e9d3",
                    "0xb498d5300881fd5f8482b991504876cbe51edcd14b6abda326f48201fc9f2234",
                    "0xd94762cee129d65e8178eba2c7b2aed14d340cea0bd8e777869003919b186712",
                    "0x47b50e56928b2b5bfa63adfb411ebf5b20b0fd9e1d3b445867cdfae52ae0aeef",
                    "0x56cf1b42f63e7718400fd465fa1af37397e5fa2cbe85fd6879f83473f5e3995a",
                    "0x8a1490011374ffe25b45862d41be4735e08d9e18b1b8b726d4a9d4d8e0194a27",
                    "0x3489042ecae7846b58488aa770bedd81ad7f1783efd1bee7756b00de4024b65d",
                    "0x44f85f310884644c48efe8f07cf549408ce942652a8f1f7ad7b01b4bc78399de"
                ],
                transactionsRoot: "0xfc1f88c241dff40c33cc8cf48b18b1a59c86346f0f4ea15317142265f20f8b03",
                uncles: [],
                withdrawals: [
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0xfbd866",
                        "index": "0x1309706",
                        "validatorIndex": "0x90fe9"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0xfbb65d",
                        "index": "0x1309707",
                        "validatorIndex": "0x90fea"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0xfc42ba",
                        "index": "0x1309708",
                        "validatorIndex": "0x90feb"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0x3682aae",
                        "index": "0x1309709",
                        "validatorIndex": "0x90fec"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0xfc16c5",
                        "index": "0x130970a",
                        "validatorIndex": "0x90fed"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0xfc672a",
                        "index": "0x130970b",
                        "validatorIndex": "0x90fee"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0xfbf672",
                        "index": "0x130970c",
                        "validatorIndex": "0x90fef"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0x3664440",
                        "index": "0x130970d",
                        "validatorIndex": "0x90ff0"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0xfbf9c4",
                        "index": "0x130970e",
                        "validatorIndex": "0x90ff1"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0xfc54c4",
                        "index": "0x130970f",
                        "validatorIndex": "0x90ff2"
                    },
                    {
                        "address": "0xd33cd8e9accd0b58a501e6076ad5c41a8702ca62",
                        "amount": "0xdde150",
                        "index": "0x1309710",
                        "validatorIndex": "0x90ff3"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0xfc4959",
                        "index": "0x1309711",
                        "validatorIndex": "0x90ff4"
                    },
                    {
                        "address": "0xd33cd8e9accd0b58a501e6076ad5c41a8702ca62",
                        "amount": "0xde3e8c",
                        "index": "0x1309712",
                        "validatorIndex": "0x90ff5"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0xfc7dbb",
                        "index": "0x1309713",
                        "validatorIndex": "0x90ff6"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0xfc8f5b",
                        "index": "0x1309714",
                        "validatorIndex": "0x90ff7"
                    },
                    {
                        "address": "0x036c9c0aae7a8268f332ba968dac5963c6adaca5",
                        "amount": "0xfc9028",
                        "index": "0x1309715",
                        "validatorIndex": "0x90ff8"
                    }
                ],
                withdrawalsRoot: "0x43efdf43ed0f1ede09f4ab425311ea16ea229cda5878a44eecc2d0f6d5fc618f"
            }
          }
        }
     });

     // balance checker
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [{ to: "0xb1f8e55c7f64d203c1400b9d8555d050f94adf39"}]
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000091d6cb8fbf55100000000000000000000000000000000000000000000000000014e4d6652a8200000000000000000000000000000000000000000000000000001beca58919dc000000000000000000000000000000000000000000000000000177480e2c2667f0000000000000000000000000000000000000000000000000001d9ae54845818000000000000000000000000000000000000000000000000000009184e72a000',
        },
      };
    });

// Balance of BUSD
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [{ to: BUSD_ADDRESS}]
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x000000000000000000000000000000000000000000000000000000000001ea4c',
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
           {
             btnSelector: '#maliciousApprovalButton',
            expectedDescription:
               'If you approve this request, a third party known for scams might take all your assets.',
             expectedReason: 'approval_farming',
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

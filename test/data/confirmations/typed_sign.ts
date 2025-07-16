import { CHAIN_IDS, TransactionType } from '@metamask/transaction-controller';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { SignatureRequestType } from '../../../ui/pages/confirmations/types/confirm';

export const unapprovedTypedSignMsgV1 = {
  id: '82ab2400-e2c6-11ee-9627-73cc88f00492',
  chainId: CHAIN_IDS.GOERLI,
  securityAlertResponse: {
    reason: 'loading',
    result_type: 'validation_in_progress',
    securityAlertId: '3a938cfc-301d-4af0-96c4-b51fe1a5d6ad',
  },
  status: 'unapproved',
  time: 1710505271872,
  type: TransactionType.signTypedData,
  securityProviderResponse: null,
  msgParams: {
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    data: [
      { type: 'string', name: 'Message', value: 'Hi, Alice!' },
      { type: 'uint32', name: 'A number', value: '1337' },
    ],
    requestId: 11,
    signatureMethod: 'eth_signTypedData',
    version: 'V1',
    origin: 'https://metamask.github.io',
  },
} as SignatureRequestType;

const rawMessageV3 = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  message: {
    from: { name: 'Cow', wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826' },
    to: { name: 'Bob', wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB' },
    contents: 'Hello, Bob!',
  },
};

export const unapprovedTypedSignMsgV3 = {
  id: '17e41af0-e073-11ee-9eec-5fd284826685',
  chainId: CHAIN_IDS.GOERLI,
  securityAlertResponse: {
    reason: 'loading',
    result_type: 'validation_in_progress',
    securityAlertId: 'efefe1db-6c6e-4a2c-aa0d-6183ad3ec810',
  },
  status: 'unapproved',
  time: 1710249542175,
  type: TransactionType.signTypedData,
  securityProviderResponse: null,
  msgParams: {
    data: JSON.stringify(rawMessageV3),
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    version: 'V3',
    requestId: 12,
    signatureMethod: 'eth_signTypedData_v3',
    origin: 'https://metamask.github.io',
  },
} as SignatureRequestType;

export const rawMessageV4 = {
  domain: {
    chainId: 97,
    name: 'Ether Mail',
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    version: '1',
  },
  message: {
    contents: 'Hello, Bob!',
    from: {
      name: 'Cow',
      wallets: [
        '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
        '0x06195827297c7A80a443b6894d3BDB8824b43896',
      ],
    },
    to: [
      {
        name: 'Bob',
        wallets: [
          '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
          '0xB0B0b0b0b0b0B000000000000000000000000000',
        ],
      },
    ],
  },
  primaryType: 'Mail',
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person[]' },
      { name: 'contents', type: 'string' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallets', type: 'address[]' },
    ],
  },
};

export const unapprovedTypedSignMsgV4 = {
  id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
  chainId: CHAIN_IDS.GOERLI,
  status: 'unapproved',
  time: new Date().getTime(),
  chainid: '0x5',
  type: TransactionType.signTypedData,
  securityProviderResponse: null,
  msgParams: {
    from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    data: JSON.stringify(rawMessageV4),
    origin: 'https://metamask.github.io',
    requestId: 123456789,
    signatureMethod: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
  },
} as SignatureRequestType;

export const orderSignatureMsg = {
  id: 'e5249ae0-4b6b-11ef-831f-65b48eb489ec',
  chainId: CHAIN_IDS.GOERLI,
  securityAlertResponse: {
    result_type: 'loading',
    reason: 'validation_in_progress',
    securityAlertId: 'dadfc03d-43f9-4515-9aa2-cb00715c3e07',
  },
  status: 'unapproved',
  time: 1722011224974,
  type: TransactionType.signTypedData,
  msgParams: {
    data: '{"types":{"Order":[{"type":"uint8","name":"direction"},{"type":"address","name":"maker"},{"type":"address","name":"taker"},{"type":"uint256","name":"expiry"},{"type":"uint256","name":"nonce"},{"type":"address","name":"erc20Token"},{"type":"uint256","name":"erc20TokenAmount"},{"type":"Fee[]","name":"fees"},{"type":"address","name":"erc721Token"},{"type":"uint256","name":"erc721TokenId"},{"type":"Property[]","name":"erc721TokenProperties"}],"Fee":[{"type":"address","name":"recipient"},{"type":"uint256","name":"amount"},{"type":"bytes","name":"feeData"}],"Property":[{"type":"address","name":"propertyValidator"},{"type":"bytes","name":"propertyData"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"ZeroEx","version":"1.0.0","chainId":"0x1","verifyingContract":"0xdef1c0ded9bec7f1a1670819833240f027b25eff"},"primaryType":"Order","message":{"direction":"0","maker":"0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc","taker":"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826","expiry":"2524604400","nonce":"100131415900000000000000000000000000000083840314483690155566137712510085002484","erc20Token":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","erc20TokenAmount":"42000000000000","fees":[],"erc721Token":"0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e","erc721TokenId":"2516","erc721TokenProperties":[]}}',
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    version: 'V4',
    requestId: 13,
    signatureMethod: 'eth_signTypedData_v4',
    origin: 'https://metamask.github.io',
  },
};

export const permitSignatureMsg = {
  id: '0b1787a0-1c44-11ef-b70d-e7064bd7b659',
  chainId: CHAIN_IDS.GOERLI,
  securityAlertResponse: {
    reason: 'loading',
    result_type: 'validation_in_progress',
    securityAlertId: 'ab21395f-2190-472f-8cfa-3d224e7529d8',
  },
  status: 'unapproved',
  time: 1716826404122,
  type: TransactionType.signTypedData,
  msgParams: {
    data: '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Permit":[{"name":"owner","type":"address"},{"name":"spender","type":"address"},{"name":"value","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"primaryType":"Permit","domain":{"name":"MyToken","version":"1","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","chainId":1},"message":{"owner":"0x935e73edb9ff52e23bac7f7e043a1ecd06d05477","spender":"0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","value":3000,"nonce":0,"deadline":50000000000}}',
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    version: 'V4',
    requestId: 14,
    signatureMethod: 'eth_signTypedData_v4',
    origin: 'https://metamask.github.io',
  },
} as SignatureRequestType;

export const seaportSignatureMsg = {
  chainId: '0x1',
  id: 'e9297d91-aca0-11ef-9ac4-417a173450d3',
  messageParams: {
    data: '{"types":{"OrderComponents":[{"name":"offerer","type":"address"},{"name":"zone","type":"address"},{"name":"offer","type":"OfferItem[]"},{"name":"consideration","type":"ConsiderationItem[]"},{"name":"orderType","type":"uint8"},{"name":"startTime","type":"uint256"},{"name":"endTime","type":"uint256"},{"name":"zoneHash","type":"bytes32"},{"name":"salt","type":"uint256"},{"name":"conduitKey","type":"bytes32"},{"name":"counter","type":"uint256"}],"OfferItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"}],"ConsiderationItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"},{"name":"recipient","type":"address"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Seaport","version":"1.1","chainId":"0x1","verifyingContract":"0x00000000006c3852cbef3e08e8df289169ede581"},"primaryType":"OrderComponents","message":{"offerer":"0x935E73EDb9fF52E23BaC7F7e043A1ecD06d05477","zone":"0x004c00500000ad104d7dbd00e3ae0a5c00560c00","offer":[{"itemType":"2","token":"0x922dc160f2ab743312a6bb19dd5152c1d3ecca33","identifierOrCriteria":"176","startAmount":"1","endAmount":"1"}],"consideration":[{"itemType":"0","token":"0x0000000000000000000000000000000000000000","identifierOrCriteria":"0","startAmount":"0","endAmount":"0","recipient":"0x935E73EDb9fF52E23BaC7F7e043A1ecD06d05477"},{"itemType":"0","token":"0x0000000000000000000000000000000000000000","identifierOrCriteria":"0","startAmount":"25000000000000000","endAmount":"25000000000000000","recipient":"0x8de9c5a032463c561423387a9648c5c7bcc5bc90"},{"itemType":"0","token":"0x0000000000000000000000000000000000000000","identifierOrCriteria":"0","startAmount":"50000000000000000","endAmount":"50000000000000000","recipient":"0x5c6139cd9ff1170197f13935c58f825b422c744c"}],"orderType":"3","startTime":"1660565524","endTime":"1661170320","zoneHash":"0x3000000000000000000000000000000000000000000000000000000000000000","salt":"5965482869793190759363249887602871532","conduitKey":"0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000","counter":"0"}}',
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    version: 'V4',
    signatureMethod: 'eth_signTypedData_v4',
    metamaskId: 'e9297d90-aca0-11ef-9ac4-417a173450d3',
    origin: 'https://develop.d3bkcslj57l47p.amplifyapp.com',
    requestId: 1376479613,
  },
  networkClientId: 'mainnet',
  securityAlertResponse: {
    result_type: 'loading',
    reason: 'CheckingChain',
    securityAlertId: 'def3b0ef-c96b-4c87-b1b1-c69cc02a0f78',
  },
  status: 'unapproved',
  time: 1732699257833,
  type: 'eth_signTypedData',
  version: 'V4',
  decodingLoading: false,
  decodingData: {
    stateChanges: [
      {
        assetType: 'NATIVE',
        changeType: 'RECEIVE',
        address: '',
        amount: '0',
        contractAddress: '',
      },
      {
        assetType: 'ERC721',
        changeType: 'LISTING',
        address: '',
        amount: '',
        contractAddress: '0x922dc160f2ab743312a6bb19dd5152c1d3ecca33',
        tokenID: '176',
      },
    ],
  },
  msgParams: {
    data: '{"types":{"OrderComponents":[{"name":"offerer","type":"address"},{"name":"zone","type":"address"},{"name":"offer","type":"OfferItem[]"},{"name":"consideration","type":"ConsiderationItem[]"},{"name":"orderType","type":"uint8"},{"name":"startTime","type":"uint256"},{"name":"endTime","type":"uint256"},{"name":"zoneHash","type":"bytes32"},{"name":"salt","type":"uint256"},{"name":"conduitKey","type":"bytes32"},{"name":"counter","type":"uint256"}],"OfferItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"}],"ConsiderationItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"},{"name":"recipient","type":"address"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Seaport","version":"1.4","chainId":"0x1","verifyingContract":"0x00000000006c3852cbef3e08e8df289169ede581"},"primaryType":"OrderComponents","message":{"offerer":"0x935E73EDb9fF52E23BaC7F7e043A1ecD06d05477","zone":"0x004c00500000ad104d7dbd00e3ae0a5c00560c00","offer":[{"itemType":"2","token":"0x922dc160f2ab743312a6bb19dd5152c1d3ecca33","identifierOrCriteria":"176","startAmount":"1","endAmount":"1"}],"consideration":[{"itemType":"0","token":"0x0000000000000000000000000000000000000000","identifierOrCriteria":"0","startAmount":"0","endAmount":"0","recipient":"0x935E73EDb9fF52E23BaC7F7e043A1ecD06d05477"},{"itemType":"0","token":"0x0000000000000000000000000000000000000000","identifierOrCriteria":"0","startAmount":"25000000000000000","endAmount":"25000000000000000","recipient":"0x8de9c5a032463c561423387a9648c5c7bcc5bc90"},{"itemType":"0","token":"0x0000000000000000000000000000000000000000","identifierOrCriteria":"0","startAmount":"50000000000000000","endAmount":"50000000000000000","recipient":"0x5c6139cd9ff1170197f13935c58f825b422c744c"}],"orderType":"3","startTime":"1660565524","endTime":"1661170320","zoneHash":"0x3000000000000000000000000000000000000000000000000000000000000000","salt":"5965482869793190759363249887602871532","conduitKey":"0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000","counter":"0"}}',
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    version: 'V4',
    signatureMethod: 'eth_signTypedData_v4',
    metamaskId: 'e9297d90-aca0-11ef-9ac4-417a173450d3',
    origin: 'https://develop.d3bkcslj57l47p.amplifyapp.com',
    requestId: 1376479613,
  },
} as SignatureRequestType;

export const permitNFTSignatureMsg = {
  id: 'c5067710-87cf-11ef-916c-71f266571322',
  chainId: CHAIN_IDS.GOERLI,
  status: 'unapproved',
  time: 1728651190529,
  type: 'eth_signTypedData',
  msgParams: {
    data: '{"domain":{"name":"Uniswap V3 Positions NFT-V1","version":"1","chainId":1,"verifyingContract":"0xC36442b4a4522E871399CD717aBDD847Ab11FE88"},"types":{"Permit":[{"name":"spender","type":"address"},{"name":"tokenId","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"primaryType":"Permit","message":{"spender":"0x00000000Ede6d8D217c60f93191C060747324bca","tokenId":"3606393","nonce":"0","deadline":"1734995006"}}',
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    version: 'V4',
    signatureMethod: 'eth_signTypedData_v4',
    requestId: 2874791875,
    origin: 'https://metamask.github.io',
  },
} as SignatureRequestType;

export const permitSignatureMsgWithNoDeadline = {
  id: '0b1787a0-1c44-11ef-b70d-e7064bd7b659',
  chainId: CHAIN_IDS.GOERLI,
  securityAlertResponse: {
    reason: 'loading',
    result_type: 'validation_in_progress',
    securityAlertId: 'ab21395f-2190-472f-8cfa-3d224e7529d8',
  },
  status: 'unapproved',
  time: 1716826404122,
  type: 'eth_signTypedData',
  msgParams: {
    data: '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Permit":[{"name":"owner","type":"address"},{"name":"spender","type":"address"},{"name":"value","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"primaryType":"Permit","domain":{"name":"MyToken","version":"1","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","chainId":1},"message":{"owner":"0x935e73edb9ff52e23bac7f7e043a1ecd06d05477","spender":"0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","value":3000,"nonce":0,"deadline":-1}}',
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    version: 'V4',
    signatureMethod: 'eth_signTypedData_v4',
    origin: 'https://metamask.github.io',
  },
} as SignatureRequestType;

export const permitBatchSignatureMsg = {
  id: '0b1787a0-1c44-11ef-b70d-e7064bd7b659',
  chainId: CHAIN_IDS.GOERLI,
  securityAlertResponse: {
    reason: 'loading',
    result_type: 'validation_in_progress',
    securityAlertId: 'ab21395f-2190-472f-8cfa-3d224e7529d8',
  },
  status: 'unapproved',
  time: 1716826404122,
  type: TransactionType.signTypedData,
  msgParams: {
    data: '{"types":{"PermitBatch":[{"name":"details","type":"PermitDetails[]"},{"name":"spender","type":"address"},{"name":"sigDeadline","type":"uint256"}],"PermitDetails":[{"name":"token","type":"address"},{"name":"amount","type":"uint160"},{"name":"expiration","type":"uint48"},{"name":"nonce","type":"uint48"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Permit2","chainId":"1","verifyingContract":"0x000000000022d473030f116ddee9f6b43ac78ba3"},"primaryType":"PermitBatch","message":{"details":[{"token":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","amount":"1461501637330902918203684832716283019655932542975","expiration":"1722887542","nonce":"5"},{"token":"0xb0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","amount":"2461501637330902918203684832716283019655932542975","expiration":"1722887642","nonce":"6"}],"spender":"0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad","sigDeadline":"1720297342"}}',
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    version: 'V4',
    requestId: 15,
    signatureMethod: 'eth_signTypedData_v4',
    origin: 'https://metamask.github.io',
  },
} as SignatureRequestType;

export const permitSingleSignatureMsg = {
  id: '0b1787a0-1c44-11ef-b70d-e7064bd7b659',
  chainId: CHAIN_IDS.GOERLI,
  securityAlertResponse: {
    reason: 'loading',
    result_type: 'validation_in_progress',
    securityAlertId: 'ab21395f-2190-472f-8cfa-3d224e7529d8',
  },
  status: 'unapproved',
  time: 1716826404122,
  type: TransactionType.signTypedData,
  msgParams: {
    data: '{"types":{"PermitSingle":[{"name":"details","type":"PermitDetails"},{"name":"spender","type":"address"},{"name":"sigDeadline","type":"uint256"}],"PermitDetails":[{"name":"token","type":"address"},{"name":"amount","type":"uint160"},{"name":"expiration","type":"uint48"},{"name":"nonce","type":"uint48"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Permit2","chainId":"1","verifyingContract":"0x000000000022d473030f116ddee9f6b43ac78ba3"},"primaryType":"PermitSingle","message":{"details":{"token":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","amount":"1461501637330902918203684832716283019655932542975","expiration":"1722887542","nonce":"5"},"spender":"0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad","sigDeadline":"1720297342"}}',
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    version: 'V4',
    requestId: 16,
    signatureMethod: 'eth_signTypedData_v4',
    origin: 'https://metamask.github.io',
  },
} as SignatureRequestType;

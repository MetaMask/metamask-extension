import { SignatureRequestType } from '../../../ui/pages/confirmations/types/confirm';

export const unapprovedTypedSignMsgV1 = {
  id: '82ab2400-e2c6-11ee-9627-73cc88f00492',
  securityAlertResponse: {
    reason: 'loading',
    result_type: 'validation_in_progress',
    securityAlertId: '3a938cfc-301d-4af0-96c4-b51fe1a5d6ad',
  },
  status: 'unapproved',
  time: 1710505271872,
  type: 'eth_signTypedData',
  securityProviderResponse: null,
  msgParams: {
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    data: [
      { type: 'string', name: 'Message', value: 'Hi, Alice!' },
      { type: 'uint32', name: 'A number', value: '1337' },
    ],
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
  securityAlertResponse: {
    reason: 'loading',
    result_type: 'validation_in_progress',
    securityAlertId: 'efefe1db-6c6e-4a2c-aa0d-6183ad3ec810',
  },
  status: 'unapproved',
  time: 1710249542175,
  type: 'eth_signTypedData',
  securityProviderResponse: null,
  msgParams: {
    data: JSON.stringify(rawMessageV3),
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    version: 'V3',
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
  status: 'unapproved',
  time: new Date().getTime(),
  type: 'eth_signTypedData',
  securityProviderResponse: null,
  msgParams: {
    from: '0x8eeee1781fd885ff5ddef7789486676961873d12',
    data: JSON.stringify(rawMessageV4),
    origin: 'https://metamask.github.io',
  },
} as SignatureRequestType;

export const permitSignatureMsg = {
  id: '0b1787a0-1c44-11ef-b70d-e7064bd7b659',
  securityAlertResponse: {
    reason: 'loading',
    result_type: 'validation_in_progress',
    securityAlertId: 'ab21395f-2190-472f-8cfa-3d224e7529d8',
  },
  status: 'unapproved',
  time: 1716826404122,
  type: 'eth_signTypedData',
  msgParams: {
    data: '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Permit":[{"name":"owner","type":"address"},{"name":"spender","type":"address"},{"name":"value","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"primaryType":"Permit","domain":{"name":"MyToken","version":"1","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","chainId":1},"message":{"owner":"0x935e73edb9ff52e23bac7f7e043a1ecd06d05477","spender":"0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","value":3000,"nonce":0,"deadline":50000000000}}',
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    version: 'V4',
    signatureMethod: 'eth_signTypedData_v4',
    origin: 'https://metamask.github.io',
  },
} as SignatureRequestType;

export const seaportSignatureMsg = {
  id: 'd1a105a0-316a-11ef-9a39-e102797784d5',
  securityAlertResponse: {
    result_type: 'loading',
    reason: 'validation_in_progress',
    securityAlertId: '460e2f2c-3ab1-4b1d-ac4d-04fa78c0f71f',
  },
  status: 'unapproved',
  time: 1719152032506,
  type: 'eth_signTypedData',
  msgParams: {
    data: '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"OrderComponents":[{"name":"offerer","type":"address"},{"name":"zone","type":"address"},{"name":"offer","type":"OfferItem[]"},{"name":"consideration","type":"ConsiderationItem[]"},{"name":"orderType","type":"uint8"},{"name":"startTime","type":"uint256"},{"name":"endTime","type":"uint256"},{"name":"zoneHash","type":"bytes32"},{"name":"salt","type":"uint256"},{"name":"conduitKey","type":"bytes32"},{"name":"counter","type":"uint256"}],"OfferItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"}],"ConsiderationItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"},{"name":"recipient","type":"address"}]},"primaryType":"OrderComponents","domain":{"name":"Seaport","version":"1.6","chainId":"11155111","verifyingContract":"0x0000000000000068F116a894984e2DB1123eB395"},"message":{"offerer":"0x935E73EDb9fF52E23BaC7F7e043A1ecD06d05477","offer":[{"itemType":"2","token":"0xBD753BE0945Bb0a19a81b3946786Ff90Bfa98ddD","identifierOrCriteria":"1","startAmount":"1","endAmount":"1"}],"consideration":[{"itemType":"0","token":"0x0000000000000000000000000000000000000000","identifierOrCriteria":"0","startAmount":"975000000000000000","endAmount":"975000000000000000","recipient":"0x935E73EDb9fF52E23BaC7F7e043A1ecD06d05477"},{"itemType":"0","token":"0x0000000000000000000000000000000000000000","identifierOrCriteria":"0","startAmount":"25000000000000000","endAmount":"25000000000000000","recipient":"0x0000a26b00c1F0DF003000390027140000fAa719"}],"startTime":"1719152027","endTime":"1721744027","orderType":"0","zone":"0x004C00500000aD104D7DBd00e3ae0A5C00560C00","zoneHash":"0x0000000000000000000000000000000000000000000000000000000000000000","salt":"24446860302761739304752683030156737591518664810215442929810397878451929508755","conduitKey":"0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000","totalOriginalConsiderationItems":"2","counter":"0"}}',
    from: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
    version: 'V4',
    signatureMethod: 'eth_signTypedData_v4',
    origin: 'https://testnets.opensea.io',
  },
};

import { ApprovalType } from '@metamask/controller-utils';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { CHAIN_IDS } from '../../../../shared/constants/network';

const PERMIT_DATA = `{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Permit":[{"name":"owner","type":"address"},{"name":"spender","type":"address"},{"name":"value","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"primaryType":"Permit","domain":{"name":"MyToken","version":"1","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","chainId":1},"message":{"owner":"{ownerAddress}","spender":"0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","value":3000,"nonce":0,"deadline":50000000000}}`;

const PERMIT_BATCH_DATA = `{"types":{"PermitBatch":[{"name":"details","type":"PermitDetails[]"},{"name":"spender","type":"address"},{"name":"sigDeadline","type":"uint256"}],"PermitDetails":[{"name":"token","type":"address"},{"name":"amount","type":"uint160"},{"name":"expiration","type":"uint48"},{"name":"nonce","type":"uint48"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Permit2","chainId":"1","verifyingContract":"0x000000000022d473030f116ddee9f6b43ac78ba3"},"primaryType":"PermitBatch","message":{"details":[{"token":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","amount":"1461501637330902918203684832716283019655932542975","expiration":"1722887542","nonce":"5"},{"token":"0xb0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","amount":"2461501637330902918203684832716283019655932542975","expiration":"1722887642","nonce":"6"}],"spender":"0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad","sigDeadline":"1720297342"}}`;

const PERMIT_SINGLE_DATA = `{"types":{"PermitSingle":[{"name":"details","type":"PermitDetails"},{"name":"spender","type":"address"},{"name":"sigDeadline","type":"uint256"}],"PermitDetails":[{"name":"token","type":"address"},{"name":"amount","type":"uint160"},{"name":"expiration","type":"uint48"},{"name":"nonce","type":"uint48"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Permit2","chainId":"1","verifyingContract":"0x000000000022d473030f116ddee9f6b43ac78ba3"},"primaryType":"PermitSingle","message":{"details":{"token":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","amount":"1461501637330902918203684832716283019655932542975","expiration":"1722887542","nonce":"5"},"spender":"0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad","sigDeadline":"1720297342"}}`;

const SEAPORT_DATA = `{"types":{"OrderComponents":[{"name":"offerer","type":"address"},{"name":"zone","type":"address"},{"name":"offer","type":"OfferItem[]"},{"name":"consideration","type":"ConsiderationItem[]"},{"name":"orderType","type":"uint8"},{"name":"startTime","type":"uint256"},{"name":"endTime","type":"uint256"},{"name":"zoneHash","type":"bytes32"},{"name":"salt","type":"uint256"},{"name":"conduitKey","type":"bytes32"},{"name":"counter","type":"uint256"}],"OfferItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"}],"ConsiderationItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"},{"name":"recipient","type":"address"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Seaport","version":"1.1","chainId":1,"verifyingContract":"0x000000000022d473030f116ddee9f6b43ac78ba3"},"primaryType":"OrderComponents","message":{"offerer":"0x5a6f5477bdeb7801ba137a9f0dc39c0599bac994","zone":"0x004c00500000ad104d7dbd00e3ae0a5c00560c00","offer":[{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"26464","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"7779","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"4770","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"9594","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"2118","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"1753","startAmount":"1","endAmount":"1"}],"consideration":[{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"26464","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"7779","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"4770","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"9594","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"2118","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"1753","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"}],"orderType":"2","startTime":"1681810415","endTime":"1681983215","zoneHash":"0x0000000000000000000000000000000000000000000000000000000000000000","salt":"1550213294656772168494388599483486699884316127427085531712538817979596","conduitKey":"0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000","counter":"0"}}`;

const TRADE_ORDER_DATA = `{"types":{"ERC721Order":[{"type":"uint8","name":"direction"},{"type":"address","name":"maker"},{"type":"address","name":"taker"},{"type":"uint256","name":"expiry"},{"type":"uint256","name":"nonce"},{"type":"address","name":"erc20Token"},{"type":"uint256","name":"erc20TokenAmount"},{"type":"Fee[]","name":"fees"},{"type":"address","name":"erc721Token"},{"type":"uint256","name":"erc721TokenId"},{"type":"Property[]","name":"erc721TokenProperties"}],"Fee":[{"type":"address","name":"recipient"},{"type":"uint256","name":"amount"},{"type":"bytes","name":"feeData"}],"Property":[{"type":"address","name":"propertyValidator"},{"type":"bytes","name":"propertyData"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"ZeroEx","version":"1.0.0","chainId":"0x1","verifyingContract":"0xdef1c0ded9bec7f1a1670819833240f027b25eff"},"primaryType":"ERC721Order","message":{"direction":"0","maker":"0x8eeee1781fd885ff5ddef7789486676961873d12","taker":"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826","expiry":"2524604400","nonce":"100131415900000000000000000000000000000083840314483690155566137712510085002484","erc20Token":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","erc20TokenAmount":"42000000000000","fees":[],"erc721Token":"0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e","erc721TokenId":"2516","erc721TokenProperties":[]}}`;

const getPermitData = (permitType: string, accountAddress: string) => {
  switch (permitType) {
    case 'Permit':
      return PERMIT_DATA.replace('{ownerAddress}', accountAddress);
    case 'PermitBatch':
      return PERMIT_BATCH_DATA;
    case 'PermitSingle':
      return PERMIT_SINGLE_DATA;
    case 'PermitSeaport':
      return SEAPORT_DATA;
    case 'TradeOrder':
      return TRADE_ORDER_DATA;
    default:
      throw new Error(`Unknown permit type: ${permitType}`);
  }
};

const getMessageParams = (accountAddress: string, data: string) => ({
  from: accountAddress,
  version: 'v4',
  data,
  origin: 'https://metamask.github.io',
  signatureMethod: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
});

export const getMetaMaskStateWithUnapprovedPermitSign = (
  accountAddress: string,
  permitType:
    | 'Permit'
    | 'PermitBatch'
    | 'PermitSingle'
    | 'PermitSeaport'
    | 'TradeOrder',
) => {
  const data = getPermitData(permitType, accountAddress);
  const pendingPermitId = '48a75190-45ca-11ef-9001-f3886ec2397c';
  const pendingPermitTime = new Date().getTime();
  const messageParams = getMessageParams(accountAddress, data);

  const unapprovedTypedMessage = {
    id: pendingPermitId,
    status: 'unapproved',
    time: pendingPermitTime,
    type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
    securityProviderResponse: null,
    msgParams: messageParams,
    chainId: CHAIN_IDS.SEPOLIA,
  };

  const pendingApproval = {
    id: pendingPermitId,
    origin: 'origin',
    time: pendingPermitTime,
    type: ApprovalType.EthSignTypedData,
    requestData: {
      ...messageParams,
      metamaskId: pendingPermitId,
    },
    requestState: null,
    expectsResult: false,
  };

  return {
    ...mockMetaMaskState,
    preferences: {
      ...mockMetaMaskState.preferences,
      redesignedConfirmationsEnabled: true,
    },
    unapprovedTypedMessages: {
      [pendingPermitId]: unapprovedTypedMessage,
    },
    unapprovedTypedMessagesCount: 1,
    pendingApprovals: {
      [pendingPermitId]: pendingApproval,
    },
    pendingApprovalCount: 1,
  };
};

export const verifyDetails = (element: Element, expectedValues: string[]) => {
  expectedValues.forEach((value) => {
    expect(element).toHaveTextContent(value);
  });
};

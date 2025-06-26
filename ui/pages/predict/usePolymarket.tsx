import { useSelector } from 'react-redux';
import { hexToNumber } from '@metamask/utils';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import { useMemo, useState } from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import { getContractConfig, Side } from '@polymarket/clob-client';
import {
  getSelectedAccount,
  getSelectedNetwork,
} from '../../selectors/selectors';
import { addTransaction, newUnsignedTypedMessage } from '../../store/actions';
import {
  buildOrderCreationArgs,
  buildPolyHmacSignature,
  encodeApprove,
  encodeErc1155Approve,
  encodeRedeemPositions,
  generateSalt,
} from './utils';
import {
  ROUNDING_CONFIG,
  SignatureType,
  TickSize,
  UserPosition,
} from './types';

const CLOB_ENDPOINT = 'https://clob.polymarket.com';

const ClobAuthDomain = {
  ClobAuth: [
    { name: 'address', type: 'address' },
    { name: 'timestamp', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'message', type: 'string' },
  ],
};
const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
];

export type L2HeaderArgs = {
  method: string;
  requestPath: string;
  body?: string;
};

const MSG_TO_SIGN = 'This message attests that I control the given wallet';

type ApiKeyCreds = {
  key: string;
  secret: string;
  passphrase: string;
};

export const usePolymarket = () => {
  const account = useSelector(getSelectedAccount);
  const selectedNetwork = useSelector(getSelectedNetwork);
  const { chainId } = selectedNetwork.configuration;
  const [apiKey, setApiKey] = useState<ApiKeyCreds | null>(
    localStorage.getItem('apiKey')
      ? JSON.parse(localStorage.getItem('apiKey') || '{}')
      : null,
  );
  const contractConfig = useMemo(() => {
    return getContractConfig(hexToNumber(chainId));
  }, [chainId]);

  const getL1Headers = async () => {
    const domain = {
      name: 'ClobAuthDomain',
      version: '1',
      chainId: hexToNumber(chainId),
    };

    const types = {
      EIP712Domain,
      ...ClobAuthDomain,
    };

    const message = {
      address: account.address,
      timestamp: `${Math.floor(Date.now() / 1000)}`,
      nonce: 0,
      message: MSG_TO_SIGN,
    };

    const signature = await newUnsignedTypedMessage({
      messageParams: {
        data: {
          domain,
          types,
          message,
          primaryType: 'ClobAuth',
        },
        from: account.address,
      },
      request: {
        params: [],
        networkClientId: selectedNetwork.clientId,
      },
      version: SignTypedDataVersion.V4,
    });

    const headers = {
      POLY_ADDRESS: account.address,
      POLY_SIGNATURE: signature,
      POLY_TIMESTAMP: `${message.timestamp}`,
      POLY_NONCE: `${message.nonce}`,
    };

    return headers;
  };

  const createL2Headers = async (
    l2HeaderArgs: L2HeaderArgs,
    timestamp?: number,
  ) => {
    let ts = Math.floor(Date.now() / 1000);
    if (timestamp !== undefined) {
      ts = timestamp;
    }
    const { address } = account;

    const sig = buildPolyHmacSignature(
      apiKey?.secret || '',
      ts,
      l2HeaderArgs.method,
      l2HeaderArgs.requestPath,
      l2HeaderArgs.body,
    );

    const headers = {
      POLY_ADDRESS: address,
      POLY_SIGNATURE: sig,
      POLY_TIMESTAMP: `${ts}`,
      POLY_API_KEY: apiKey?.key || '',
      POLY_PASSPHRASE: apiKey?.passphrase || '',
    };

    return headers;
  };

  const createApiKey = async () => {
    const headers = await getL1Headers();
    const response = await fetch(`${CLOB_ENDPOINT}/auth/api-key`, {
      method: 'POST',
      headers,
      body: '',
    });

    const apiKeyRaw = await response.json();
    const newApiKey = {
      key: apiKeyRaw.apiKey,
      secret: apiKeyRaw.secret,
      passphrase: apiKeyRaw.passphrase,
    };
    setApiKey(newApiKey);
    localStorage.setItem('apiKey', JSON.stringify(newApiKey));
  };

  const deriveApiKey = async () => {
    const headers = await getL1Headers();
    const response = await fetch(`${CLOB_ENDPOINT}/auth/derive-api-key`, {
      method: 'GET',
      headers,
    });
    const apiKeys = await response.json();
    console.log(apiKeys);
    const newApiKey = {
      key: apiKeys.apiKey,
      secret: apiKeys.secret,
      passphrase: apiKeys.passphrase,
    };
    setApiKey(newApiKey);
    localStorage.setItem('apiKey', JSON.stringify(newApiKey));
  };

  const approveCollateralExchange = async () => {
    const encodedCallData = encodeApprove({
      spender: contractConfig.exchange,
      amount: 100n * 1_000_000n, // 100 USDC as BigInt with 6 decimals
    });

    const transactionMeta = await addTransaction(
      {
        from: account.address,
        to: contractConfig.collateral,
        data: encodedCallData,
        value: '0x0',
      },
      {
        networkClientId: selectedNetwork.clientId,
        type: TransactionType.tokenMethodApprove,
        requireApproval: false,
      },
    );

    return transactionMeta;
  };

  const approveCollateralConditionalToken = async () => {
    const encodedCallData = encodeApprove({
      spender: contractConfig.conditionalTokens,
      amount: 100n * 1_000_000n, // 100 USDC as BigInt with 6 decimals
    });

    const transactionMeta = await addTransaction(
      {
        from: account.address,
        to: contractConfig.collateral,
        data: encodedCallData,
        value: '0x0',
      },
      {
        networkClientId: selectedNetwork.clientId,
        type: TransactionType.tokenMethodApprove,
        requireApproval: false,
      },
    );

    return transactionMeta;
  };

  const approveConditionalExchange = async () => {
    const encodedCallData = encodeErc1155Approve({
      spender: contractConfig.exchange,
      approved: true,
    });

    const transactionMeta = await addTransaction(
      {
        from: account.address,
        to: contractConfig.conditionalTokens,
        data: encodedCallData,
        value: '0x0',
      },
      {
        networkClientId: selectedNetwork.clientId,
        type: TransactionType.tokenMethodApprove,
        requireApproval: false,
      },
    );

    return transactionMeta;
  };

  const approveCollateralNegRiskExchange = async () => {
    const encodedCallData = encodeApprove({
      spender: contractConfig.negRiskExchange,
      amount: 100n * 1_000_000n, // 100 USDC as BigInt with 6 decimals
    });

    const transactionMeta = await addTransaction(
      {
        from: account.address,
        to: contractConfig.collateral,
        data: encodedCallData,
        value: '0x0',
      },
      {
        networkClientId: selectedNetwork.clientId,
        type: TransactionType.tokenMethodApprove,
        requireApproval: false,
      },
    );

    return transactionMeta;
  };

  const approveNegRiskAdapterToken = async () => {
    const encodedCallData = encodeApprove({
      spender: contractConfig.negRiskAdapter,
      amount: 10n * 1_000_000n, // 10 USDC as BigInt with 6 decimals
    });

    const transactionMeta = await addTransaction(
      {
        from: account.address,
        to: contractConfig.collateral,
        data: encodedCallData,
        value: '0x0',
      },
      {
        networkClientId: selectedNetwork.clientId,
        type: TransactionType.tokenMethodApprove,
        requireApproval: false,
      },
    );

    return transactionMeta;
  };

  const approveConditionalNegRiskExchange = async () => {
    const encodedCallData = encodeErc1155Approve({
      spender: contractConfig.negRiskExchange,
      approved: true,
    });

    const transactionMeta = await addTransaction(
      {
        from: account.address,
        to: contractConfig.conditionalTokens,
        data: encodedCallData,
        value: '0x0',
      },
      {
        networkClientId: selectedNetwork.clientId,
        type: TransactionType.tokenMethodApprove,
        requireApproval: false,
      },
    );

    return transactionMeta;
  };

  const approveConditionalNegRiskAdapter = async () => {
    const encodedCallData = encodeErc1155Approve({
      spender: contractConfig.negRiskAdapter,
      approved: true,
    });

    const transactionMeta = await addTransaction(
      {
        from: account.address,
        to: contractConfig.conditionalTokens,
        data: encodedCallData,
        value: '0x0',
      },
      {
        networkClientId: selectedNetwork.clientId,
        type: TransactionType.tokenMethodApprove,
        requireApproval: false,
      },
    );

    return transactionMeta;
  };

  const approveAllowances = async () => {
    await approveCollateralConditionalToken();
    await approveCollateralExchange();
    await approveConditionalExchange();
    await approveCollateralNegRiskExchange();
    await approveNegRiskAdapterToken();
    await approveConditionalNegRiskExchange();
    await approveConditionalNegRiskAdapter();
  };

  const placeOrder = async ({
    tokenId,
    price,
    size,
    tickSize,
    side,
    negRisk,
  }: {
    tokenId: string;
    price: number;
    size: number;
    tickSize: TickSize;
    side: Side;
    negRisk: boolean;
  }) => {
    const orderArgs = buildOrderCreationArgs({
      signer: account.address,
      maker: account.address,
      signatureType: SignatureType.EOA,
      userOrder: {
        tokenID: tokenId,
        price,
        size,
        side,
      },
      roundConfig: ROUNDING_CONFIG[tickSize],
    });

    const order = {
      salt: hexToNumber(generateSalt()).toString(),
      maker: account.address,
      signer: orderArgs.signer ?? account.address,
      taker: orderArgs.taker,
      tokenId: orderArgs.tokenId,
      makerAmount: orderArgs.makerAmount,
      takerAmount: orderArgs.takerAmount,
      expiration: orderArgs.expiration ?? '0',
      nonce: orderArgs.nonce,
      feeRateBps: orderArgs.feeRateBps,
      side: orderArgs.side,
      signatureType: orderArgs.signatureType ?? SignatureType.EOA,
    };

    console.log(order);

    const verifyingContract = negRisk
      ? getContractConfig(hexToNumber(chainId)).negRiskExchange
      : getContractConfig(hexToNumber(chainId)).exchange;

    const typedData = {
      primaryType: 'Order',
      domain: {
        name: 'Polymarket CTF Exchange',
        version: '1',
        chainId: hexToNumber(chainId),
        verifyingContract,
      },
      types: {
        EIP712Domain: [
          ...EIP712Domain,
          { name: 'verifyingContract', type: 'address' },
        ],
        Order: [
          { name: 'salt', type: 'uint256' },
          { name: 'maker', type: 'address' },
          { name: 'signer', type: 'address' },
          { name: 'taker', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'makerAmount', type: 'uint256' },
          { name: 'takerAmount', type: 'uint256' },
          { name: 'expiration', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'feeRateBps', type: 'uint256' },
          { name: 'side', type: 'uint8' },
          { name: 'signatureType', type: 'uint8' },
        ],
      },
      message: order,
    };

    console.log(typedData);

    const signature = await newUnsignedTypedMessage({
      messageParams: {
        data: typedData,
        from: account.address,
      },
      request: {
        params: [],
        networkClientId: selectedNetwork.clientId,
      },
      version: SignTypedDataVersion.V4,
    });

    const signedOrder = {
      ...order,
      signature,
    };

    console.log('internal order', signedOrder);

    const body = JSON.stringify({
      order: {
        ...signedOrder,
        side,
        salt: parseInt(signedOrder.salt, 10),
      },
      owner: apiKey?.key,
      orderType: 'GTC',
    });

    const l2Headers = await createL2Headers({
      method: 'POST',
      requestPath: `/order`,
      body,
    });

    const response = await fetch(`${CLOB_ENDPOINT}/order`, {
      method: 'POST',
      headers: l2Headers,
      body,
    });
    const responseData = await response.json();
    console.log(responseData);
  };

  const redeemPosition = async (position: UserPosition) => {
    if (!position.redeemable) {
      console.error('Position is not redeemable');
      return;
    }

    const encodedCallData = encodeRedeemPositions({
      collateralToken: contractConfig.collateral,
      parentCollectionId: '0x0',
      conditionId: position.conditionId,
      indexSets: [position.outcomeIndex + 1],
    });

    await addTransaction(
      {
        from: account.address,
        to: contractConfig.conditionalTokens,
        data: encodedCallData,
        value: '0x0',
      },
      {
        networkClientId: selectedNetwork.clientId,
        type: TransactionType.contractInteraction,
        requireApproval: false,
      },
    );
  };

  return {
    createApiKey,
    deriveApiKey,
    approveAllowances,
    placeOrder,
    redeemPosition,
    apiKey,
  };
};

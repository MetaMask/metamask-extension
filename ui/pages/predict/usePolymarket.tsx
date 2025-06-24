import { useSelector } from 'react-redux';
import {
  getSelectedAccount,
  getSelectedNetwork,
} from '../../selectors/selectors';
import { hexToNumber } from '@metamask/utils';
import { addTransaction, newUnsignedTypedMessage } from '../../store/actions';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import { useState } from 'react';
import {
  buildOrderCreationArgs,
  buildPolyHmacSignature,
  encodeApprove,
  generateSalt,
} from './utils';
import { TransactionType } from '@metamask/transaction-controller';
import { ROUNDING_CONFIG, Side, SignatureType, TickSize } from './types';

const CLOB_ENDPOINT = 'https://clob.polymarket.com';
//const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const EXCHANGE_ADDRESS = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';

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

export interface L2HeaderArgs {
  method: string;
  requestPath: string;
  body?: string;
}

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
    const address = account.address;

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

  const approveToken = async () => {
    const encodedCallData = encodeApprove({
      spender: EXCHANGE_ADDRESS,
      amount: 10n * 1_000_000n, // 10 USDC as BigInt with 6 decimals
    });

    const transactionMeta = await addTransaction(
      {
        from: account.address,
        to: USDC_ADDRESS,
        data: encodedCallData,
        value: '0x0',
      },
      {
        networkClientId: selectedNetwork.clientId,
        type: TransactionType.tokenMethodApprove,
      },
    );

    console.log(transactionMeta);
  };

  const placeOrder = async ({
    tokenId,
    price,
    size,
    tickSize,
  }: {
    tokenId: string;
    price: number;
    size: number;
    tickSize: TickSize;
  }) => {
    const orderArgs = buildOrderCreationArgs({
      signer: account.address,
      maker: account.address,
      signatureType: SignatureType.EOA,
      userOrder: {
        tokenID: tokenId,
        price,
        size,
        side: Side.BUY,
      },
      roundConfig: ROUNDING_CONFIG[tickSize],
    });

    const order = {
      salt: hexToNumber(generateSalt()),
      maker: orderArgs.maker,
      signer: orderArgs.signer ?? account.address,
      taker: orderArgs.taker,
      tokenId: orderArgs.tokenId,
      makerAmount: orderArgs.makerAmount,
      takerAmount: orderArgs.takerAmount,
      expiration: orderArgs.expiration ?? '0',
      nonce: orderArgs.nonce,
      feeRateBps: orderArgs.feeRateBps,
      side: orderArgs.side.toString(),
      signatureType: orderArgs.signatureType ?? SignatureType.EOA,
    };

    const typedData = {
      primaryType: 'Order',
      domain: {
        name: 'Polymarket CTF Exchange',
        version: '1',
        chainId: hexToNumber(chainId),
        verifyingContract: EXCHANGE_ADDRESS,
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

    console.log(signedOrder);

    const body = JSON.stringify({
      order: signedOrder,
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

  return {
    createApiKey,
    deriveApiKey,
    approveToken,
    placeOrder,
    apiKey,
  };
};

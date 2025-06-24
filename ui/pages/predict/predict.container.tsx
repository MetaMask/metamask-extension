import React, { useState } from 'react';

import { useSelector } from 'react-redux';
import { SignTypedDataVersion } from '@metamask/eth-sig-util';
import { hexToNumber } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';
import { Box, Button, Text } from '../../components/component-library';

import { Header, Page } from '../../components/multichain/pages/page';
import {
  Display,
  FlexDirection,
  TextVariant,
} from '../../helpers/constants/design-system';
import { addTransaction, newUnsignedTypedMessage } from '../../store/actions';
import {
  getSelectedAccount,
  getSelectedNetwork,
} from '../../selectors/selectors';
import { encodeApprove } from './utils';

const MSG_TO_SIGN = 'This message attests that I control the given wallet';
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

type ApiKeyCreds = {
  key: string;
  secret: string;
  passphrase: string;
};

const PredictContainer = () => {
  const account = useSelector(getSelectedAccount);
  const selectedNetwork = useSelector(getSelectedNetwork);
  const { chainId } = selectedNetwork.configuration;

  const [apiKey, setApiKey] = useState<ApiKeyCreds | null>(null);

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

    console.log(signature);

    const headers = {
      POLY_ADDRESS: account.address,
      POLY_SIGNATURE: signature,
      POLY_TIMESTAMP: `${message.timestamp}`,
      POLY_NONCE: `${message.nonce}`,
    };

    console.log(headers);

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
  };

  const approveToken = async () => {
    const usdcAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
    const exchangeAddress = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';
    const encodedCallData = encodeApprove({
      spender: exchangeAddress,
      amount: 10n * 1_000_000n, // 10 USDC as BigInt with 6 decimals
    });

    const transactionMeta = await addTransaction(
      {
        from: account.address,
        to: usdcAddress,
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

  return (
    <Page className="main-container" data-testid="remote-mode">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
      >
        Predict
      </Header>
      <Box>
        <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={2}>
          <Button onClick={createApiKey}>Create API Key</Button>
          <Button onClick={deriveApiKey}>Derive API Key</Button>
          <Button onClick={approveToken}>Approve Token</Button>
        </Box>
        {apiKey && (
          <>
            <Text>API Key: {apiKey?.key}</Text>
            <Text>Secret: {apiKey?.secret}</Text>
            <Text>Passphrase: {apiKey?.passphrase}</Text>
          </>
        )}
      </Box>
    </Page>
  );
};

export default PredictContainer;

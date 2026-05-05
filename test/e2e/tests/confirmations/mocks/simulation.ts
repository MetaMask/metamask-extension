import { Mockttp } from '../../../mock-e2e';
import { TX_SENTINEL_URL } from '../../../../../shared/constants/transaction';

const ERC20_TRANSFER_EVENT_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const ERC20_BALANCE_OF_SELECTOR = '70a08231';

const padAddressTopic = (address: string) =>
  `0x000000000000000000000000${address.toLowerCase().replace('0x', '')}`;

const padUint256Hex = (hex: string) => hex.padStart(64, '0');

export async function mockSimulationApi(
  mockServer: Mockttp,
  {
    sender,
    recipient,
    token,
    amountHex,
    preBalanceHex,
    postBalanceHex,
  }: {
    sender: string;
    recipient: string;
    token: string;
    amountHex: string;
    preBalanceHex: string;
    postBalanceHex: string;
  },
): Promise<void> {
  const transferAmount32 = `0x${padUint256Hex(amountHex)}`;
  const senderBalancePre32 = `0x${padUint256Hex(preBalanceHex)}`;
  const senderBalancePost32 = `0x${padUint256Hex(postBalanceHex)}`;

  const mainSimResponse = {
    jsonrpc: '2.0',
    id: '1',
    result: {
      transactions: [
        {
          return: '0x',
          status: '0x1',
          gasUsed: '0xC350',
          gasLimit: '0x7A120',
          fees: [],
          stateDiff: { post: {}, pre: {} },
          callTrace: {
            from: sender,
            to: token,
            type: 'CALL',
            gas: '0x1dcd6500',
            gasUsed: '0xC350',
            value: '0x0',
            input: '0x',
            output: '0x',
            error: '',
            calls: null,
            logs: [
              {
                address: token,
                topics: [
                  ERC20_TRANSFER_EVENT_TOPIC,
                  padAddressTopic(sender),
                  padAddressTopic(recipient),
                ],
                data: transferAmount32,
              },
            ],
          },
          feeEstimate: 0,
          baseFeePerGas: 0,
        },
      ],
      blockNumber: '0x1',
    },
  };

  const sandwichResponse = {
    jsonrpc: '2.0',
    id: '1',
    result: {
      transactions: [
        {
          return: senderBalancePre32,
          status: '0x1',
          gasUsed: '0x5de2',
          fees: [],
          feeEstimate: 0,
          baseFeePerGas: 0,
        },
        {
          return: '0x',
          status: '0x1',
          gasUsed: '0xC350',
          fees: [],
          feeEstimate: 0,
          baseFeePerGas: 0,
        },
        {
          return: senderBalancePost32,
          status: '0x1',
          gasUsed: '0x5de2',
          fees: [],
          feeEstimate: 0,
          baseFeePerGas: 0,
        },
      ],
      blockNumber: '0x1',
    },
  };

  await mockServer
    .forPost(TX_SENTINEL_URL)
    .withBodyIncluding(ERC20_BALANCE_OF_SELECTOR)
    .thenJson(200, sandwichResponse);

  await mockServer
    .forPost(TX_SENTINEL_URL)
    .withBodyIncluding('infura_simulateTransactions')
    .thenJson(200, mainSimResponse);
}

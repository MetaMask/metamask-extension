/* eslint-disable @typescript-eslint/naming-convention */
import { Mockttp } from 'mockttp';
import { DEFAULT_STELLAR_ADDRESS } from '../../../constants';

const HORIZON_MAINNET_URL = 'https://horizon.stellar.org';
const HORIZON_TESTNET_URL = 'https://horizon-testnet.stellar.org';

const accountResponse = (address: string) => ({
  id: address,
  account_id: address,
  sequence: '1',
  subentry_count: 0,
  balances: [
    {
      balance: '1000.0000000',
      buying_liabilities: '0.0000000',
      selling_liabilities: '0.0000000',
      asset_type: 'native',
    },
  ],
  signers: [
    {
      weight: 1,
      key: address,
      type: 'ed25519_public_key',
    },
  ],
  flags: {
    auth_required: false,
    auth_revocable: false,
    auth_immutable: false,
    auth_clawback_enabled: false,
  },
  thresholds: {
    low_threshold: 0,
    med_threshold: 0,
    high_threshold: 0,
  },
  data: {},
  data_attr: {},
});

export const mockHorizonAccount = (
  mockServer: Mockttp,
  address: string = DEFAULT_STELLAR_ADDRESS,
) =>
  mockServer
    .forGet(
      new RegExp(
        `^${HORIZON_MAINNET_URL.replace(/\./gu, '\\.')}/accounts/(G[A-Z0-9]{55})$`,
        'u',
      ),
    )
    .thenCallback(async (req) => {
      const match = req.url.match(/\/accounts\/(G[A-Z0-9]{55})$/u);
      const requestedAddress = match?.[1] ?? address;

      if (requestedAddress !== address) {
        return {
          statusCode: 404,
          json: {
            status: 404,
            title: 'Resource Missing',
            detail: `Account ${requestedAddress} not found`,
          },
        };
      }

      return {
        statusCode: 200,
        json: accountResponse(address),
      };
    });

export const mockHorizonTestnetAccount = (
  mockServer: Mockttp,
  address: string = DEFAULT_STELLAR_ADDRESS,
) =>
  mockServer
    .forGet(`${HORIZON_TESTNET_URL}/accounts/${address}`)
    .thenJson(200, accountResponse(address));

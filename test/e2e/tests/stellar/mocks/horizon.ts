/* eslint-disable @typescript-eslint/naming-convention */
import { Mockttp } from 'mockttp';
import { DEFAULT_STELLAR_ADDRESS } from '../../../constants';

const HORIZON_MAINNET_URL_PATTERN =
  '(?:https:\\/\\/horizon\\.stellar\\.org|https:\\/\\/stellar-mainnet\\.infura\\.io\\/v3\\/[^/]+\\/horizon)';
const HORIZON_TESTNET_URL_PATTERN =
  '(?:https:\\/\\/horizon-testnet\\.stellar\\.org|https:\\/\\/stellar-testnet\\.infura\\.io\\/v3\\/[^/]+\\/horizon)';

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
        `^${HORIZON_MAINNET_URL_PATTERN}/accounts/(G[A-Z0-9]{55})$`,
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
    .forGet(
      new RegExp(`^${HORIZON_TESTNET_URL_PATTERN}/accounts/${address}$`, 'u'),
    )
    .thenJson(200, accountResponse(address));

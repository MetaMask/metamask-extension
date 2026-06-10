/* eslint-disable @typescript-eslint/naming-convention */
import { Mockttp } from 'mockttp';
import {
  DEFAULT_STELLAR_ADDRESS,
  DEFAULT_STELLAR_RECIPIENT,
} from '../../../constants';

const HORIZON_MAINNET_URL = 'https://horizon.stellar.org';
const HORIZON_TESTNET_URL = 'https://horizon-testnet.stellar.org';

const STELLAR_USDC_ISSUER_PUBNET =
  'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

export const MOCK_STELLAR_TRANSACTION_HASH =
  'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

const usdcBalance = {
  balance: '1000.0000000',
  buying_liabilities: '0.0000000',
  selling_liabilities: '0.0000000',
  asset_type: 'credit_alphanum4',
  asset_code: 'USDC',
  asset_issuer: STELLAR_USDC_ISSUER_PUBNET,
  is_authorized: true,
  is_authorized_to_maintain_liabilities: true,
  last_modified_ledger: 1,
};

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
    usdcBalance,
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
  addresses: string[] = [
    DEFAULT_STELLAR_ADDRESS,
    DEFAULT_STELLAR_RECIPIENT,
  ],
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
      const address = match?.[1] ?? DEFAULT_STELLAR_ADDRESS;

      if (!addresses.includes(address)) {
        return {
          statusCode: 404,
          json: {
            status: 404,
            title: 'Resource Missing',
            detail: `Account ${address} not found`,
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

export const mockHorizonSubmitTransaction = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${HORIZON_MAINNET_URL}/transactions`)
    .thenJson(200, {
      hash: MOCK_STELLAR_TRANSACTION_HASH,
      ledger: 1,
    });

export const mockHorizonTestnetSubmitTransaction = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${HORIZON_TESTNET_URL}/transactions`)
    .thenJson(200, {
      hash: MOCK_STELLAR_TRANSACTION_HASH,
      ledger: 1,
    });

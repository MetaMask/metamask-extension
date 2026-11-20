import {
  TRON_ACTIVE_RECIPIENT_ACCOUNT,
  TRON_ACTIVE_RECIPIENT_ADDRESS,
} from '../../../tron/fixtures/environments';
import { TronFixtureAccount } from '../../../tron/fixtures/with-tron-fixtures';
import {
  TRON_ACCOUNT_ADDRESS,
  TRON_RECIPIENT_ADDRESS,
  TRX_TO_USD_RATE,
} from '../../../tron/mocks/common-tron';
import { TRX, USDT } from '../../../tron/fixtures/tokens';
import { formatSunAmount } from '../utils/formatSunAmount';

/** Unsigned TRX transfer size used by the Snap fee calculator. */
export const TRON_TRANSFER_BANDWIDTH_BYTES = 266;
export const TRON_BANDWIDTH_FEE_SUN = TRON_TRANSFER_BANDWIDTH_BYTES * 1000;
export const TRON_TRC20_ENERGY_USED = 14_000;

export const TRON_ACTIVATION_FEE_SUN = 1_000_000;
export const TRON_CREATE_ACCOUNT_FEE_SUN = 100_000;
export const TRON_ACTIVATION_WITH_CREATE_ACCOUNT_SUN =
  TRON_ACTIVATION_FEE_SUN + TRON_CREATE_ACCOUNT_FEE_SUN;

/** `getCreateAccountFee / getTransactionFee`, in bytes. */
export const TRON_CREATE_ACCOUNT_BANDWIDTH = 100;

export const TRON_FEE_FREE_BANDWIDTH = 600;
export const TRON_FEE_STAKED_BANDWIDTH = 1000;
export const TRON_FEE_NO_BANDWIDTH = 0;

export const TRON_USDT_RAW_BALANCE = '2000000';

type TronFeeScenario = {
  accounts: TronFixtureAccount[];
  recipientAddress: string;
};

function getRecipientAccounts({
  active,
}: {
  active: boolean;
}): TronFixtureAccount[] {
  return active
    ? [TRON_ACTIVE_RECIPIENT_ACCOUNT]
    : [{ address: TRON_RECIPIENT_ADDRESS, active: false }];
}

export function buildTronTrxFeeScenario({
  active,
  balanceSun,
  freeBandwidth = TRON_FEE_NO_BANDWIDTH,
  stakedBandwidth = TRON_FEE_NO_BANDWIDTH,
}: {
  active: boolean;
  balanceSun: number;
  freeBandwidth?: number;
  stakedBandwidth?: number;
}): TronFeeScenario {
  return {
    accounts: [
      {
        address: TRON_ACCOUNT_ADDRESS,
        assets: [{ ...TRX, balance: balanceSun, priceUsd: TRX_TO_USD_RATE }],
        resources: {
          freeNetLimit: freeBandwidth,
          freeNetUsed: 0,
          NetLimit: stakedBandwidth,
          NetUsed: 0,
          EnergyLimit: 0,
          EnergyUsed: 0,
        },
      },
      ...getRecipientAccounts({ active }),
    ],
    recipientAddress: active
      ? TRON_ACTIVE_RECIPIENT_ADDRESS
      : TRON_RECIPIENT_ADDRESS,
  };
}

export function buildTronTrc20FeeScenario({
  balanceSun,
  energyLimit,
  freeBandwidth = TRON_FEE_NO_BANDWIDTH,
  stakedBandwidth = TRON_FEE_NO_BANDWIDTH,
  tokenBalance = TRON_USDT_RAW_BALANCE,
}: {
  balanceSun: number;
  energyLimit: number;
  freeBandwidth?: number;
  stakedBandwidth?: number;
  tokenBalance?: string;
}): TronFeeScenario {
  return {
    accounts: [
      {
        address: TRON_ACCOUNT_ADDRESS,
        assets: [
          { ...TRX, balance: balanceSun, priceUsd: TRX_TO_USD_RATE },
          { ...USDT, balance: tokenBalance, priceUsd: 0.999_176 },
        ],
        resources: {
          freeNetLimit: freeBandwidth,
          freeNetUsed: 0,
          NetLimit: stakedBandwidth,
          NetUsed: 0,
          EnergyLimit: energyLimit,
          EnergyUsed: 0,
        },
      },
      ...getRecipientAccounts({ active: false }),
    ],
    recipientAddress: TRON_RECIPIENT_ADDRESS,
  };
}

export function buildTrxMaxAfterFee(
  balanceSun: number,
  feeSun: number,
): string {
  return formatSunAmount(Math.max(0, balanceSun - feeSun));
}

export function formatTronTokenAmount(rawAmount: string): string {
  return formatSunAmount(Number(rawAmount));
}

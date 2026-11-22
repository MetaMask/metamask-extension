import { CaipAssetId } from '@metamask/keyring-api';
import { MultichainNetworks } from '../constants/multichain/networks';
import { TRON_SPECIAL_ASSET_CAIP_TYPES } from '../constants/multichain/assets';
import {
  getTronNativeAssetId,
  getTronResourcesFromMetadata,
  getTronResourcesFromSpecialAssetBalances,
  hasTronSpecialAssetBalances,
  parseTronResourceValue,
} from './tron-resources';

const chainId = MultichainNetworks.TRON;

const resourceAssetIds = {
  energy: `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}` as CaipAssetId,
  maxEnergy:
    `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_ENERGY}` as CaipAssetId,
  bandwidth:
    `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH}` as CaipAssetId,
  maxBandwidth:
    `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_BANDWIDTH}` as CaipAssetId,
};

const stakingAssetIds = {
  stakedForBandwidth:
    `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.STAKED_FOR_BANDWIDTH}` as CaipAssetId,
  inLockPeriod:
    `${chainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.IN_LOCK_PERIOD}` as CaipAssetId,
};

describe('parseTronResourceValue', () => {
  it('parses numeric strings', () => {
    expect(parseTronResourceValue('500')).toBe(500);
    expect(parseTronResourceValue(' 42 ')).toBe(42);
    expect(parseTronResourceValue('-10')).toBe(-10);
  });

  it('parses finite numbers', () => {
    expect(parseTronResourceValue(0)).toBe(0);
    expect(parseTronResourceValue(34851)).toBe(34851);
  });

  it('keeps zero distinct from unavailable values', () => {
    expect(parseTronResourceValue('0')).toBe(0);
    expect(parseTronResourceValue(0)).toBe(0);
  });

  it('returns null for null, undefined, empty and malformed values', () => {
    expect(parseTronResourceValue(null)).toBeNull();
    expect(parseTronResourceValue(undefined)).toBeNull();
    expect(parseTronResourceValue('')).toBeNull();
    expect(parseTronResourceValue('   ')).toBeNull();
    expect(parseTronResourceValue('invalid')).toBeNull();
    expect(parseTronResourceValue(NaN)).toBeNull();
    expect(parseTronResourceValue(Number.POSITIVE_INFINITY)).toBeNull();
    expect(parseTronResourceValue({})).toBeNull();
    expect(parseTronResourceValue(['1'])).toBeNull();
  });
});

describe('getTronResourcesFromMetadata', () => {
  const fullMetadata = {
    staking: {
      bandwidth: '6000000',
      energy: '5000000',
      inLockPeriod: '0',
      readyForWithdrawal: '0',
      rewards: '0',
    },
    bandwidth: {
      limit: '34851',
      available: '34851',
    },
    energy: {
      limit: '422103',
      available: '422103',
    },
  };

  it('extracts energy and bandwidth values from full metadata, ignoring other sections', () => {
    expect(getTronResourcesFromMetadata(fullMetadata)).toStrictEqual({
      energy: { current: 422103, max: 422103 },
      bandwidth: { current: 34851, max: 34851 },
    });
  });

  it('keeps zero values distinct from null values', () => {
    expect(
      getTronResourcesFromMetadata({
        energy: { limit: '0', available: '0' },
      }),
    ).toStrictEqual({
      energy: { current: 0, max: 0 },
      bandwidth: { current: null, max: null },
    });
  });

  it('returns null values for missing or malformed fields', () => {
    expect(
      getTronResourcesFromMetadata({
        energy: { limit: null, available: 'not-a-number' },
        bandwidth: { limit: '100' },
      }),
    ).toStrictEqual({
      energy: { current: null, max: null },
      bandwidth: { current: null, max: 100 },
    });
  });

  it('returns null when sections are not objects', () => {
    expect(
      getTronResourcesFromMetadata({
        energy: null,
        bandwidth: 'invalid',
      } as never),
    ).toBeNull();
  });

  it('returns null when no Tron metadata section is present', () => {
    expect(getTronResourcesFromMetadata(undefined)).toBeNull();
    expect(getTronResourcesFromMetadata({})).toBeNull();
    expect(getTronResourcesFromMetadata({ other: 'value' })).toBeNull();
  });
});

describe('getTronResourcesFromSpecialAssetBalances', () => {
  it('extracts values from resource special assets', () => {
    const balances = {
      [resourceAssetIds.energy]: { amount: '500' },
      [resourceAssetIds.maxEnergy]: { amount: '1000' },
      [resourceAssetIds.bandwidth]: { amount: '300' },
      [resourceAssetIds.maxBandwidth]: { amount: '600' },
      [stakingAssetIds.stakedForBandwidth]: { amount: '6000000' },
      [stakingAssetIds.inLockPeriod]: { amount: '0' },
    } as Record<CaipAssetId, { amount: string }>;

    expect(
      getTronResourcesFromSpecialAssetBalances(
        balances as Record<CaipAssetId, never>,
        chainId,
      ),
    ).toStrictEqual({
      energy: { current: 500, max: 1000 },
      bandwidth: { current: 300, max: 600 },
    });
  });

  it('returns null values for missing and malformed entries', () => {
    const balances = {
      [resourceAssetIds.energy]: { amount: '500' },
      [resourceAssetIds.maxEnergy]: { amount: 'invalid' },
    } as Record<CaipAssetId, { amount: string }>;

    expect(
      getTronResourcesFromSpecialAssetBalances(
        balances as Record<CaipAssetId, never>,
        chainId,
      ),
    ).toStrictEqual({
      energy: { current: 500, max: null },
      bandwidth: { current: null, max: null },
    });
  });

  it('returns all null values for empty balances', () => {
    expect(
      getTronResourcesFromSpecialAssetBalances(
        {} as Record<CaipAssetId, never>,
        chainId,
      ),
    ).toStrictEqual({
      energy: { current: null, max: null },
      bandwidth: { current: null, max: null },
    });
  });
});

describe('hasTronSpecialAssetBalances', () => {
  it('returns true when at least one resource special asset exists', () => {
    const balances = {
      [resourceAssetIds.energy]: { amount: '500' },
    } as Record<CaipAssetId, { amount: string }>;

    expect(
      hasTronSpecialAssetBalances(
        balances as Record<CaipAssetId, never>,
        chainId,
      ),
    ).toBe(true);
  });

  it('returns false when no resource special assets exist', () => {
    expect(hasTronSpecialAssetBalances({}, chainId)).toBe(false);
  });
});

describe('getTronNativeAssetId', () => {
  it('builds the TRX native asset ID for the chain', () => {
    expect(getTronNativeAssetId(chainId)).toBe(`${chainId}/slip44:195`);
  });
});

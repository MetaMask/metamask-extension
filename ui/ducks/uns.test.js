import { isConfusing } from 'unicode-confusables';
import nock from 'nock';
import { isValidUnstoppableDomainName } from '../helpers/utils/util';
import {
  resolveSingleChainUns,
  resolveMultiChainUNS,
  determineChainType,
} from './uns';

let resolution = {};
const SINGLE_CHAIN = 'SINGLE_CHAIN';
const MULTI_CHAIN = 'MULTI_CHAIN';
describe('Unstoppable Domains Tests', () => {
  beforeEach(() => {
    nock.enableNetConnect();
  });
  describe('UNS Supported TLDs', () => {
    jest.setTimeout(30000);
    // Valid Domain TLDs
    it('should determine a valid .crypto Unstoppable Domain', async () => {
      expect(
        await isValidUnstoppableDomainName('jim-unstoppable.crypto'),
      ).toStrictEqual(true);
    });
    it('should determine a valid .nft Unstoppable Domain', async () => {
      expect(
        await isValidUnstoppableDomainName('jim-unstoppable.nft'),
      ).toStrictEqual(true);
    });
    it('should determine a valid .blockchain Unstoppable Domain', async () => {
      expect(
        await isValidUnstoppableDomainName('jim-unstoppable.blockchain'),
      ).toStrictEqual(true);
    });
    it('should determine a valid .bitcoin Unstoppable Domain', async () => {
      expect(
        await isValidUnstoppableDomainName('jim-unstoppable.bitcoin'),
      ).toStrictEqual(true);
    });
    it('should determine a valid .coin Unstoppable Domain', async () => {
      expect(
        await isValidUnstoppableDomainName('jim-unstoppable.coin'),
      ).toStrictEqual(true);
    });
    it('should determine a valid .wallet Unstoppable Domain', async () => {
      expect(
        await isValidUnstoppableDomainName('jim-unstoppable.wallet'),
      ).toStrictEqual(true);
    });
    it('should determine a valid .888 Unstoppable Domain', async () => {
      expect(
        await isValidUnstoppableDomainName('jim-unstoppable.888'),
      ).toStrictEqual(true);
    });
    it('should determine a valid .dao Unstoppable Domain', async () => {
      expect(
        await isValidUnstoppableDomainName('jim-unstoppable.dao'),
      ).toStrictEqual(true);
    });
    it('should determine a valid .x Unstoppable Domain', async () => {
      expect(
        await isValidUnstoppableDomainName('jim-unstoppable.x'),
      ).toStrictEqual(true);
    });
    it('should determine a valid .zil Unstoppable Domain', async () => {
      expect(
        await isValidUnstoppableDomainName('jim-unstoppable.zil'),
      ).toStrictEqual(true);
    });
    // Invalid Domain TLDs
    it('should determine a non valid Unstoppable Domain', async () => {
      expect(
        await isValidUnstoppableDomainName('NonValid.NotValid'),
      ).toStrictEqual(false);
    });
  });
  describe('UNS Confusing Unicode', () => {
    it('should specify confusing unicode characters if present', async () => {
      expect(isConfusing('jim-unstoppable.crypto')).toStrictEqual(true);
    });
  });
  describe('UNS Chain Type', () => {
    it('should be SINGLE CHAIN for ETH', async () => {
      expect(await determineChainType('ETH')).toStrictEqual(SINGLE_CHAIN);
    });
    it('should be MULTI CHAIN for MATIC', async () => {
      expect(await determineChainType('MATIC')).toStrictEqual(MULTI_CHAIN);
    });
    it('should be MULTI CHAIN for USDT', async () => {
      expect(
        await determineChainType({ Token: 'USDT', Version: 'ERC20' }),
      ).toStrictEqual(MULTI_CHAIN);
    });
  });
  describe('UNS Single Chain Resolution', () => {
    it('should resolve configured currency on valid domain', async () => {
      resolution = await resolveSingleChainUns('jim-unstoppable.x', 'ETH');
      expect(resolution.unsName).toStrictEqual('jim-unstoppable.x');
      expect(resolution.currency).toStrictEqual('ETH');
      expect(resolution.error).toStrictEqual(undefined);
    });
    it('should not resolve unconfigured currency on valid domain', async () => {
      resolution = await resolveSingleChainUns('jim-unstoppable.x', 'NotValid');
      expect(resolution.unsName).toStrictEqual('jim-unstoppable.x');
      expect(resolution.currency).toStrictEqual('NotValid');
      expect(resolution.error).toStrictEqual('RecordNotFound');
    });
    it('should not resolve unregistered domains', async () => {
      resolution = await resolveSingleChainUns(
        'jim-unstoppable-doesnotexist-31415926535',
        'ETH',
      );
      expect(resolution.unsName).toStrictEqual(
        'jim-unstoppable-doesnotexist-31415926535',
      );
      expect(resolution.currency).toStrictEqual('ETH');
      expect(resolution.error).toStrictEqual('UnregisteredDomain');
    });
  });
  describe('UNS Multi Chain Resolution', () => {
    it('should resolve configured currency on valid domain', async () => {
      resolution = await resolveMultiChainUNS(
        'jim-unstoppable.x',
        'USDT',
        'ERC20',
      );
      expect(resolution.unsName).toStrictEqual('jim-unstoppable.x');
      expect(resolution.currency).toStrictEqual('USDT');
      expect(resolution.version).toStrictEqual('ERC20');
      expect(resolution.error).toStrictEqual(undefined);
    });
    it('should not resolve unconfigured currency on valid domain', async () => {
      resolution = await resolveMultiChainUNS(
        'jim-unstoppable.x',
        'BNB',
        'BEP20',
      );
      expect(resolution.unsName).toStrictEqual('jim-unstoppable.x');
      expect(resolution.currency).toStrictEqual('BNB');
      expect(resolution.version).toStrictEqual('BEP20');
      expect(resolution.error).toStrictEqual('RecordNotFound');
    });
    it('should not resolve unregistered domains', async () => {
      resolution = await resolveMultiChainUNS(
        'jim-unstoppable-doesnotexist-31415926535',
        'USDT',
        'ERC20',
      );
      expect(resolution.unsName).toStrictEqual(
        'jim-unstoppable-doesnotexist-31415926535',
      );
      expect(resolution.currency).toStrictEqual('USDT');
      expect(resolution.version).toStrictEqual('ERC20');
      expect(resolution.error).toStrictEqual('UnregisteredDomain');
    });
  });
  afterAll(() => {
    nock.disableNetConnect();
  });
});

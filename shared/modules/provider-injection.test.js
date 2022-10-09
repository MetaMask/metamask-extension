import { blockedDomainCheck } from './provider-injection';

describe('provider injection', function () {
  describe('blockedDomainCheck', function () {
    it('should return true for blocked urls', function () {
      expect(blockedDomainCheck('https://docs.google.com')).toStrictEqual(true);
      expect(
        blockedDomainCheck(
          'https://cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html',
        ),
      ).toStrictEqual(true);
      expect(blockedDomainCheck('https://dropbox.com')).toStrictEqual(true);
      expect(blockedDomainCheck('https://uscourts.gov')).toStrictEqual(true);
    });

    it('should return false for allowed urls', function () {
      expect(blockedDomainCheck('https://test.com')).toStrictEqual(false);
      expect(blockedDomainCheck('https://metamask.io/')).toStrictEqual(false);
      expect(
        blockedDomainCheck('https://test.com?test=docs.google.com'),
      ).toStrictEqual(false);
      expect(
        blockedDomainCheck('https://test.com?test=dropbox.com'),
      ).toStrictEqual(false);
    });
  });
});

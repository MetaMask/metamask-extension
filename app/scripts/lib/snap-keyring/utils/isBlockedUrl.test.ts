import { ListNames, PhishingController } from '@metamask/phishing-controller';
import { isBlockedUrl } from './isBlockedUrl';

describe('isBlockedUrl', () => {
  const phishingController = new PhishingController(
    {},
    {
      phishingLists: [
        {
          blocklist: ['https://metamask.test'],
          allowlist: [],
          fuzzylist: [],
          tolerance: 0,
          version: 1,
          lastUpdated: 0,
          name: ListNames.MetaMask,
        },
      ],
    },
  );

  it.each([
    ['http://metamask.io', false],
    ['https://metamask.io', false],
    ['https://metamask.test', true],
    ['sftp://metamask.io', true],
    ['', true],
    ['1', true],
    [undefined, true],
    [null, true],
    [1, true],
    [0, true],
    [-1, true],
  ])('"%s" is blocked: %s', async (url: any, expected: boolean) => {
    const result = await isBlockedUrl(url, phishingController);
    expect(result).toEqual(expected);
  });
});

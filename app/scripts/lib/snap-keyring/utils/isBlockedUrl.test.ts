import { PhishingController } from '@metamask/phishing-controller';
import { isBlockedUrl } from './isBlockedUrl';

describe('isBlockedUrl', () => {
  const phishingController = new PhishingController();

  it.each([
    ['http://metamask.io', false],
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

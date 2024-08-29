import { ListNames, PhishingController } from '@metamask/phishing-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import { isBlockedUrl, isC2DomainBlocked } from './isBlockedUrl';

describe('isBlockedUrl', () => {
  const messenger = new ControllerMessenger();
  const phishingControllerMessenger = messenger.getRestricted({
    name: 'PhishingController',
    allowedActions: [],
    allowedEvents: [],
  });
  const phishingController = new PhishingController({
    // @ts-expect-error TODO: Resolve/patch mismatch between messenger types
    messenger: phishingControllerMessenger,
    state: {
      phishingLists: [
        {
          blocklist: [
            'metamask.test',
            'QmYwAPJzv5CZsnAzt8auVTL6aKqgfZY5vHBYdbyz4ySxTm',
            'ipfs://QmXbVAkGZMz6p8nJ3wXBng4JwvBqZWkFwnDMevL7Tz5w8y',
          ],
          allowlist: [],
          fuzzylist: [],
          tolerance: 0,
          version: 1,
          lastUpdated: 0,
          name: ListNames.MetaMask,
          c2DomainBlocklist: [
            'a379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce1947',
          ],
        },
      ],
    },
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    ['http://metamask.io', false],
    ['https://metamask.io', false],
    ['https://metamask.test', true],
    ['sftp://metamask.io', true],
    ['ipfs://QmYwAPJzv5CZsnAzt8auVTL6aKqgfZY5vHBYdbyz4ySxTm', true],
    ['ipfs://QmXbVAkGZMz6p8nJ3wXBng4JwvBqZWkFwnDMevL7Tz5w8y', true],
    ['', true],
    ['1', true],
    [undefined, true],
    [null, true],
    [1, true],
    [0, true],
    [-1, true],
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ])('"%s" is blocked: %s', async (url: any, expected: boolean) => {
    const result = await isBlockedUrl(
      url,
      async () => {
        return await phishingController.maybeUpdateState();
      },
      (origin: string) => {
        return phishingController.test(origin);
      },
    );
    expect(result).toEqual(expected);
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    ['https://example.com', true],
    ['https://metamask.io', false],
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ])('"%s" is blocked: %s', async (url: any, expected: boolean) => {
    const result = await isC2DomainBlocked(
      url,
      async () => {
        return await phishingController.maybeUpdateState();
      },
      (origin: string) => {
        return phishingController.isBlockedRequest(origin);
      },
    );
    expect(result).toEqual(expected);
  });
});

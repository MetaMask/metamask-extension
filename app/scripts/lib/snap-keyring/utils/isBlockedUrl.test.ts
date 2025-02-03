import { ListNames, PhishingController } from '@metamask/phishing-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import { isBlockedUrl } from './isBlockedUrl';

describe('isBlockedUrl', () => {
  const messenger = new ControllerMessenger();
  const phishingControllerMessenger = messenger.getRestricted({
    name: 'PhishingController',
    allowedActions: [],
    allowedEvents: [],
  });
  const phishingController = new PhishingController({
    messenger: phishingControllerMessenger,
    state: {
      phishingLists: [
        {
          blocklist: [
            'metamask.test',
            'QmYwAPJzv5CZsnAzt8auVTL6aKqgfZY5vHBYdbyz4ySxTm',
            'ipfs://QmXbVAkGZMz6p8nJ3wXBng4JwvBqZWkFwnDMevL7Tz5w8y',
            'QmT78zSuBmuS4z925WJg3vNLRiT4Mj6apb5iS4iykKs4n8',
          ],
          allowlist: [],
          fuzzylist: [],
          tolerance: 0,
          version: 1,
          lastUpdated: 0,
          name: ListNames.MetaMask,
          c2DomainBlocklist: [],
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
    ['ipfs://QmXbVAkGZMz6p8nJ3wXBng4JwvBqZWkFgnDMevL7Tz5w8y', true],
    [
      'https://ipfs.io/ipfs/QmT78zSuBmuS4z925WJg3vNLRiT4Mj6apb5iS4iykKs4n8',
      true,
    ],
    [
      'https://ipfs.io/ipfs/QmT78zSuBmuS4zdsf925WJsadfsdfg3vNLRiT4Mj6apb5iS4iykKs4n8',
      false,
    ],
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
});

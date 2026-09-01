import { Messenger } from '@metamask/messenger';
import { ListNames, PhishingController } from '@metamask/phishing-controller';
import { getRootMessenger } from '../../messenger';
import { getPhishingControllerMessenger } from '../../../messenger-client-init/messengers/phishing-controller-messenger';
import { isBlockedUrl } from './isBlockedUrl';

// Run these tests as if we were in a Flask build
jest.mock('../../../../../shared/lib/build-types', () => ({
  ...jest.requireActual('../../../../../shared/lib/build-types'),
  isFlask: jest.fn().mockReturnValue(true),
}));

describe('isBlockedUrl', () => {
  const messenger = getRootMessenger();
  const phishingControllerMessenger = getPhishingControllerMessenger(messenger);

  // Register stub handlers so PhishingController can hydrate known recipients
  // during construction without errors. Each child messenger's registerActionHandler
  // call automatically delegates the action up to the root messenger.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txMessenger = new Messenger<'TransactionController', never, never, any>(
    {
      namespace: 'TransactionController',
      parent: messenger,
    },
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (txMessenger as any).registerActionHandler(
    'TransactionController:getState',
    () => ({
      transactions: [],
    }),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const abMessenger = new Messenger<'AddressBookController', never, never, any>(
    {
      namespace: 'AddressBookController',
      parent: messenger,
    },
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (abMessenger as any).registerActionHandler(
    'AddressBookController:getState',
    () => ({
      addressBook: {},
    }),
  );

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
          blocklistPaths: {},
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
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

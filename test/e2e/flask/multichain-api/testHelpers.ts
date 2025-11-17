import { Browser } from 'selenium-webdriver';
import {
  KnownRpcMethods,
  KnownNotifications,
} from '@metamask/chain-agnostic-permission';
import { JsonRpcRequest } from '@metamask/utils';
import { Driver } from '../../webdriver/driver';
import { DAPP_PATH } from '../../constants';
import {
  CONTENT_SCRIPT,
  METAMASK_CAIP_MULTICHAIN_PROVIDER,
  METAMASK_INPAGE,
} from '../../../../app/scripts/constants/stream';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import EditConnectedAccountsModal from '../../page-objects/pages/dialog/edit-connected-accounts-modal';

export type FixtureCallbackArgs = { driver: Driver; extensionId: string };

/**
 * Default options for setting up Multichain E2E test environment
 */
export const DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS = {
  dappOptions: {
    customDappPaths: [DAPP_PATH.TEST_DAPP_MULTICHAIN, DAPP_PATH.TEST_SNAPS],
  },
  localNodeOptions: [
    {
      type: 'anvil',
      options: {
        hardfork: 'muirGlacier',
      },
    },
    {
      type: 'anvil',
      options: {
        port: 8546,
        chainId: 1338,
        hardfork: 'muirGlacier',
      },
    },
    {
      type: 'anvil',
      options: {
        port: 7777,
        chainId: 1000,
        hardfork: 'muirGlacier',
      },
    },
  ],
};

/**
 * Retrieves the expected session scope for a given set of addresses.
 *
 * @param scope - The session scope.
 * @param accounts - The addresses to get session scope for.
 * @returns the expected session scope.
 */
export const getExpectedSessionScope = (scope: string, accounts: string[]) => ({
  methods: KnownRpcMethods.eip155,
  notifications: KnownNotifications.eip155,
  accounts: accounts.map((acc) => `${scope}:${acc.toLowerCase()}`),
});

export const addAccountInWalletAndAuthorize = async (
  driver: Driver,
): Promise<void> => {
  console.log('Adding account in wallet and authorizing');
  const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.openEditAccountsModal();

  const editConnectedAccountsModal = new EditConnectedAccountsModal(driver);
  await editConnectedAccountsModal.checkPageIsLoaded();
  await editConnectedAccountsModal.addNewEthereumAccount();

  await connectAccountConfirmation.checkPageIsLoaded();
  await connectAccountConfirmation.confirmConnect();
};

/**
 * We need to replace colon character by dash when using {@link Driver.findElement}, otherwise selenium will treat this as an invalid selector.
 *
 * @param selector - string to manipulate.
 * @returns string with replaced colon char.
 */
export const replaceColon = (selector: string): string =>
  selector.replace(':', '-');

export const sendMultichainApiRequest = ({
  driver,
  extensionId,
  request,
}: {
  driver: Driver;
  extensionId: string;
  request: Omit<JsonRpcRequest, 'id'>;
}) => {
  const id = Math.ceil(Math.random() * 1000);
  const requestWithNewId = {
    ...request,
    id,
  };
  let script;
  if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
    script = `
    const data = ${JSON.stringify(requestWithNewId)};
    const result = new Promise((resolve) => {
      window.addEventListener('message', (messageEvent) => {
        const { target, data } = messageEvent.data;
        if (
          target !== '${METAMASK_INPAGE}' ||
          data?.name !== '${METAMASK_CAIP_MULTICHAIN_PROVIDER}' ||
          data?.data.id !== ${id}
        ) {
          return;
        }

        resolve(data.data);
      });
    })
    window.postMessage(
      {
        target: '${CONTENT_SCRIPT}',
        data: {
          name: '${METAMASK_CAIP_MULTICHAIN_PROVIDER}',
          data
        },
      },
      location.origin,
    );

    return result;`;
  } else {
    script = `
    const port = chrome.runtime.connect('${extensionId}');
    const data = ${JSON.stringify(requestWithNewId)};
    const result = new Promise((resolve) => {
      port.onMessage.addListener((msg) => {
        if (msg.type !== 'caip-348') {
          return;
        }
        if (msg.data?.id !== ${id}) {
          return;
        }

        resolve(msg.data);
      })
    })
    port.postMessage({ type: 'caip-348', data });
    return result;`;
  }

  return driver.executeScript(script);
};

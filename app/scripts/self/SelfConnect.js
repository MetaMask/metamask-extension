export default class SelfConnect {
  appUrl = 'https://google.com';

  constructor() {
    this._openConnectorTab(appUrl);
  }

  async _openConnectorTab(url) {
    try {
      const browserTab = window.open(url);
      // Preferred option for Chromium browsers. This extension runs in a window
      // for Chromium so we can do window-based communication very easily.
      if (browserTab) {
        return { chromium: browserTab };
      } else if (browser && browser.tabs && browser.tabs.create) {
        // FireFox extensions do not run in windows, so it will return `null` from
        // `window.open`. Instead, we need to use the `browser` API to open a tab.
        // We will surveille this tab to see if its URL parameters change, which
        // will indicate that the user has logged in.
        const tab = await browser.tabs.create({ url });
        return { firefox: tab };
      } else {
        throw new Error('Unknown browser context. Cannot open Self connector.');
      }
    } catch (err) {
      throw new Error('Failed to open Self connector.');
    }
  }

  async getAccountsCloud() {
    let newAccounts = [];

    //create a listener for the imported accounts
    window.addEventListener(
      'message',
      (event) => {
        if (event.data.event_id === 'imported_accounts') {
          newAccounts = event.data.accounts;
        }
      },
      false,
    );

    return new Promise(async (resolve) => {
      const child = window.open(appUrl + '/import');
      const interval = setInterval(() => {
        if (child.closed) {
          //when the popup is closed
          clearInterval(interval);
          this.accounts = newAccounts;
          resolve(newAccounts);
        }
      }, 1000);
    });
  }

  async signTxCloud(transaction) {
    let signedTx = {};

    //create a listener for the signedTx
    window.addEventListener(
      'message',
      (event) => {
        if (event.data.event_id === 'signedTx') {
          signedTx = {
            v: event.data.v,
            r: event.data.r,
            s: event.data.s,
          };
        }
      },
      false,
    );

    return new Promise(async (resolve) => {
      const child = window.open(appUrl + '/sign'); //open popup

      child.postMessage(
        //sends message to the popup
        {
          event_id: 'unsignedTx',
          data: {
            tx: transaction.serialize().toString('hex'),
          },
        },
        '*',
      );

      const interval = setInterval(() => {
        if (child.closed) {
          //when the popup is closed
          clearInterval(interval);
          resolve(signedTx);
        }
      }, 1000);
    });
  }
}

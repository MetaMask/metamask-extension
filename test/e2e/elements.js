const webdriver = require('selenium-webdriver')
const { By } = webdriver
module.exports = {
  elements: {
    loader: By.css('#app-content > div > div.full-flex-height > img'),
  },
  menus: {
    token: {
      menu: By.id('token-cell_dropdown_0'),
      items: By.className('dropdown-menu-item'),
      send: By.css('#token-cell_dropdown_0 > div > div > li:nth-child(2)'),
      view: By.css('#token-cell_dropdown_0 > div > div > li:nth-child(3)'),
      copy: By.css('#token-cell_dropdown_0 > div > div > li:nth-child(4)'),
      remove: By.css('#token-cell_dropdown_0 > div > div > li:nth-child(5)'),
      sendText: 'Send',
      viewText: 'View token on block explorer',
      copyText: 'Copy address to clipboard',
      removeText: 'Remove',
    },
    sandwich: {
      menu: By.css('.sandwich-expando'),
      settings: By.css('#app-content > div > div:nth-child(3) > span > div > li:nth-child(2)'),
      logOut: By.css('#app-content > div > div:nth-child(3) > span > div > li:nth-child(3)'),
      textLogOut: 'Log Out',
      textSettings: 'Settings',
      info: By.css('li.dropdown-menu-item:nth-child(4)'),
    },
    account: {
      account1: By.css('#app-content > div > div.full-width > div > div:nth-child(2) > span > div > div > span > div > li:nth-child(2) > span'),
      account2: By.css('#app-content > div > div.full-width > div > div:nth-child(2) > span > div > div > span > div > li:nth-child(3) > span'),
      menu: By.css('#app-content > div > div.full-width > div > div:nth-child(2) > span > div'),
      delete: By.css('#app-content > div > div.full-width > div > div:nth-child(2) > span > div > div > span > div > li:nth-child(4) > div.remove'),
      createAccount: By.css('#app-content > div > div.full-width > div > div:nth-child(2) > span > div > div > span > div > li:nth-child(3) > span'),
      import: By.css('#app-content > div > div.full-width > div > div:nth-child(2) > span > div > div > span > div > li:nth-child(5) > span'),
      labelImported: By.css('#app-content > div > div.full-width > div > div:nth-child(2) > span > div > div > span > div > li:nth-child(4) > div.keyring-label'),
    },
    dot: {
      menu: By.className('account-dropdown'),
      showQRcode: By.css('#app-content > div > div.app-primary.from-right > div > div > div:nth-child(1) > flex-column > div.name-label > div > span > div > div > div > li:nth-child(3)'),
      exportPR: By.css('#app-content > div > div.app-primary.from-right > div > div > div:nth-child(1) > flex-column > div.name-label > div > span > div > div > div > li:nth-child(5)'),

    },
    networks: {
      addedCustomRpc: By.className('span custom-rpc'),
      customRpc: By.css('#app-content > div > div:nth-child(2) > span > div > li:nth-child(9)'),
    },
  },
  screens: {
    sendTokens: {
      error: By.className('error flex-center'),
      errorText: {
        invalidAmount: 'Invalid token\'s amount',
        address: 'Recipient address is invalid',
        largeAmount: 'Insufficient token\'s balance',
        tooPrecise: 'Token\'s amount is too precise',
        negativeAmount:'Can not send negative amounts of ETH'
      },
      title: By.className('flex-center'),
      balance: By.className('hide-text-overflow token-balance__amount'),
      symbol: By.className('token-balance__symbol'),
      field: {
        address: By.name('address'),
        addressPlaceholder: 'Recipient Address',
        amount: By.name('amount'),
        amountPlaceholder: 'Amount',
      },
      button: {
        next: By.xpath('//*[@id="app-content"]/div/div[4]/div/section[2]/button'),
        arrow: By.className('fa fa-arrow-left fa-lg cursor-pointer'),
      },
    },
    yourPR: {
      key: By.css('#app-content > div > div.app-primary.from-right > div > div.privateKey > div.flex-row > p'),
      copy: By.className('clipboard cursor-pointer'),
      button: {
        save: By.className('btn-violet'),
        done: By.css('#app-content > div > div.app-primary.from-right > div > div.privateKey > div:nth-child(3) > button:nth-child(2)'),

      },
    },
    exportPR: {
      error: By.className('error'),
      warningText: 'Export private keys at your own risk',
      errorText: 'Incorrect Password.',
      button: {
        cancel: By.className('btn-violet'),
        submit: By.css('#app-content > div > div.app-primary.from-right > div > div:nth-child(2) > div:nth-child(2) > button:nth-child(2)'),
      },
      fieldPassword: By.id('exportAccount'),

    },
    addToken: {
      title: By.className('page-subtitle'),
      titleText: 'Add Token',
      tab: {
        custom: By.className('inactiveForm pointer'),
        search: By.className('inactiveForm pointer'),
      },
      search: {
        fieldSearch: By.id('search-tokens'),
        results: By.className('token-list__token-data'),
        token: {
          unselected: By.className('token-list__token'),
          selected: By.className('token-list__token token-list__token--selected'),
          name: By.className('token-list__token-name'),
          icon: By.className('token-list__token-icon'),
        },
        button: {
          next: By.css('#app-content > div > div.app-primary.from-right > div > div:nth-child(3) > div.page-container__footer > div > button:nth-child(2)'),
          cancel: By.className('btn-violet'),
        },
        confirm: {
          label: By.className('confirm-label'),
          labelText: By.className('Would you like to add these tokens?'),
          button: {
            add: By.className('btn-primary'),
            back: By.className('btn-default btn-violet'),
          },
          token: {
            item: By.className('confirm-add-token__token-list-item'),
            balance: By.className('confirm-add-token__balance'),
            name: By.className('confirm-add-token__name'),
            icon: By.className('confirm-add-token__token-icon identicon'),
          },
        },
      },
      custom:
        {
          fields: {
            contractAddress: By.id('token-address'),
            tokenSymbol: By.id('token_symbol'),
            decimals: By.id('token_decimals'),
          },
          buttons: {
            add: By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > div:nth-child(7) > button:nth-child(2)'),
            cancel: By.className('btn-violet'),
          },
        },

    },
    deleteCustomRPC: {
      buttons: {
        yes: By.css('#app-content > div > div.app-primary.from-right > div > div.flex-row.flex-right > button:nth-child(2)'),
        no: By.className('btn-violet'),
      },
      titleText: 'Delete Custom RPC',
    },
    confirmTransaction: {
      title: By.className('flex-row flex-center'),
      amount: By.css('#pending-tx-form > div:nth-child(1) > div.table-box > div:nth-child(2) > div.ether-balance.ether-balance-amount > div > div > div > div:nth-child(1)'),
      symbol: By.css('#pending-tx-form > div:nth-child(1) > div.table-box > div:nth-child(2) > div.ether-balance.ether-balance-amount > div > div > div > div:nth-child(2)'),
      button: {
        submit: By.css('#pending-tx-form > div.flex-row.flex-space-around.conf-buttons > input'),
      },
    },
    sendTransaction: {
      title: By.css('#app-content > div > div.app-primary.from-right > div > h3:nth-child(2)'),
      titleText: 'Send Transaction',
      field: {
        address: By.css('#app-content > div > div.app-primary.from-right > div > section:nth-child(3) > div > input'),
        amount: By.css('#app-content > div > div.app-primary.from-right > div > section:nth-child(4) > input'),
      },
      buttonNext: By.css('#app-content > div > div.app-primary.from-right > div > section:nth-child(4) > button'),
    },
    restoreVault: {
      textArea: By.css('#app-content > div > div.app-primary.from-left > div > div.initialize-screen.flex-column.flex-center.flex-grow > textarea'),
      fieldPassword: By.id('password-box'),
      fieldPasswordConfirm: By.id('password-box-confirm'),
      buttos: {
        ok: By.css('#app-content > div > div.app-primary.from-left > div > div.initialize-screen.flex-column.flex-center.flex-grow > div > button:nth-child(2)'),
      },
    },
    deleteImportedAccount: {
      title: By.css('#app-content > div > div.app-primary.from-left > div > div.section-title.flex-row.flex-center > h2'),
      titleText: 'Delete Imported Account',
      buttons: {
        no: By.css('#app-content > div > div.app-primary.from-left > div > div.flex-row.flex-right > button.btn-violet'),
        yes: By.css('#app-content > div > div.app-primary.from-right > div > div.flex-row.flex-right > button:nth-child(2)'),
      },
    },
    importAccounts: {
      title: By.css('#app-content > div > div.app-primary.from-right > div > div:nth-child(2) > div.flex-row.flex-center > h2'),
      textTitle: 'Import Accounts',
      fieldPrivateKey: By.id('private-key-box'),
      buttonImport: By.css('#app-content > div > div.app-primary.from-right > div > div:nth-child(2) > div:nth-child(4) > button'),
    },
    QRcode: {
      address: By.className('ellip-address'),
      buttonArrow: By.className('fa-arrow-left'),
      iconCopy: By.className('clipboard cursor-pointer'),
    },
    settings: {
      currentNetwork: By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > div:nth-child(1) > span:nth-child(2)'),
      fieldNewRPC: By.id('new_rpc'),
      buttonSave: By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > div:nth-child(2) > button'),
      titleText: 'Settings',
      title: By.css('#app-content > div > div.app-primary.from-right > div > div.section-title.flex-row.flex-center > h2'),
      buttons: {
        changePassword: By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > div:nth-child(10) > button:nth-child(5)'),
        delete: By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > div:nth-child(1) > button'),
      },
      error: By.className('error'),
      errors: {
        invalidHTTP: 'URIs require the appropriate HTTP/HTTPS prefix.',
        invalidRpcEndpoint: 'Invalid RPC endpoint',
        invalidRpcUrl: 'Invalid RPC URI',
      },
    },
    main: {
      identicon: By.className('identicon-wrapper select-none'),
      fieldAccountName: By.className('sizing-input'),
      accountName: By.css('#app-content > div > div.app-primary.from-left > div > div > div:nth-child(1) > flex-column > div.name-label > div > div > h2'),
      edit: By.className('edit-text'),
      iconCopy: By.className('clipboard cursor-pointer white'),
      transactionList: By.css('#app-content > div > div.app-primary.from-left > div > section > section > div > div > div > div.ether-balance.ether-balance-amount > div > div > div > div:nth-child(1)'),
      buttons: {
        send: By.css('#app-content > div > div.app-primary.from-right > div > div > div.flex-row > button:nth-child(4)'),
        buy: By.css('#app-content > div > div.app-primary.from-right > div > div > div.flex-row > button:nth-child(3)'),
        sendText: 'Send',
        save: By.className('editable-button'),
      },
      network: By.className('network-name'),
      sent: {
        menu: By.className('activeForm left'),
        tokens: By.className('activeForm right'),
      },
      balance: By.css('#app-content > div > div.app-primary.from-right > div > div > div.flex-row > div.ether-balance.ether-balance-amount > div > div > div:nth-child(1) > div:nth-child(1)'),
      address: By.css('#app-content > div > div.app-primary.from-left > div > div > div:nth-child(1) > flex-column > div.flex-row > div'),
      tokens: {
        menu: By.className('inactiveForm pointer'),
        token: By.className('token-cell'),
        balance: By.css('#token-cell_0 > h3'),
        amount: By.css('#app-content > div > div.app-primary.from-left > div > section > div.full-flex-height > div > span'),
        textNoTokens: 'No tokens found',
        textYouOwn1token: 'You own 1 token',
        buttonAdd: By.css('div.full-flex-height:nth-child(2) > div:nth-child(1) > button:nth-child(2)'),
        buttonAddText: 'Add Token',
        counter: By.css('#app-content > div > div.app-primary.from-left > div > section > div.full-flex-height > div > span'),
      },
    },
    info: {
      title: By.className('section-title flex-row flex-center'),
      titleText: 'Info',
      label: By.className('info'),
      buttonArrow: By.className('fa fa-arrow-left fa-lg cursor-pointer'),
    },
    removeToken: {
      title: By.className('page-subtitle'),
      titleText: 'Remove Token',
      label: By.className('confirm-label'),
      labelText: 'Are you sure you want to remove token "TST"?',
      buttons: {
        back: By.className('fa fa-arrow-left fa-lg cursor-pointer'),
        no: By.className('btn-violet'),
        yes: By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > button:nth-child(2)'),
      },
    },

    changePassword: {
      title: By.className('page-subtitle'),
      titleText: 'Change Password',
      fieldOldPassword: By.id('old-password-box'),
      fieldNewPassword: By.id('new-password-box'),
      fieldConfirmNewPassword: By.id('password-box-confirm'),
      buttonNo: By.css('#app-content > div > div.app-primary.from-right > div > div.flex-row.flex-right > button.btn-violet'),
      buttonYes: By.css('#app-content > div > div.app-primary.from-right > div > div.flex-row.flex-right > button:nth-child(2)'),
      label: By.className('confirm-label'),
      arrowLeft: By.className('fa fa-arrow-left fa-lg cursor-pointer'),
      error: By.className('error'),
      labelText: 'Are you sure you want to change the password for unlocking of your wallet?',
      errorText: {
        differ: 'New password should differ from the current one',
        notLong: 'Password not long enough',
        dontMatch: 'Passwords don\'t match',
        incorrectPassword: 'Error: Incorrect password',
      },
    },
    lock: {
      fieldPassword: By.id('password-box'),
      error: By.className('error'),
      errorText: 'Error: Incorrect password',
      buttonLogin: By.className('cursor-pointer'),
      linkRestore: By.css('#app-content > div > div.app-primary.from-left > div > div.flex-row.flex-center.flex-grow > p'),
      linkRestoreText: 'Restore from seed phrase',
    },

    TOU: {
      agreement: By.className('notice-box'),
      titleText: 'Terms of Use',
      title: By.className('terms-header'),
      button: By.css('button'),
      linkTerms: By.linkText('Terms of Service'),
      linkTermsText: 'Terms of Service',
    },
    create: {
      fieldPassword: By.id('password-box'),
      fieldPasswordConfirm: By.id('password-box-confirm'),
      button: By.css('button'),
    },
    seedPhrase: {
      fieldPhrase: By.className('twelve-word-phrase'),
      buttonIveCopied: By.css('#app-content > div > div.app-primary.from-right > div > button:nth-child(4)'),
      textButtonIveCopied: 'I\'ve copied it somewhere safe',
    },
  },
  NETWORKS: {
    POA: 'poa',
    SOKOL: 'sokol',
    MAINNET: 'mainnet',
    ROPSTEN: 'ropsten',
    KOVAN: 'kovan',
    RINKEBY: 'rinkeby',
    LOCALHOST: 'localhost',
    CUSTOM: 'http://test.com',
  },
}

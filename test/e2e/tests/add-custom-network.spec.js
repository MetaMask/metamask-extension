const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Custom network', function () {
  const chainID = 42161;
  const networkURL = 'https://arbitrum-mainnet.infura.io';
  const networkNAME = 'Arbitrum One';
  const currencySYMBOL = 'ETH';
  const blockExplorerURL = 'https://explorer.arbitrum.io';
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('add custom network and switch the network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

<<<<<<< HEAD
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ tag: 'div', text: 'Settings' });
=======
  describe('JSON-RPC API', function () {
    it('should show warning when adding chainId 0x1(ethereum) and be followed by an wrong chainId error', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await driver.navigate();
          await unlockWallet(driver);
>>>>>>> upstream/multichain-swaps-controller

        await driver.clickElement('.network-display');
        await driver.clickElement({ tag: 'button', text: 'Add network' });

        await driver.clickElement({
          tag: 'button',
          text: 'Add',
        });
        // verify network details
        const title = await driver.findElement({
          tag: 'h6',
          text: 'Arbitrum One',
        });
        assert.equal(
          await title.getText(),
          'Arbitrum One',
          'Title of popup should be selected network',
        );

        const [networkName, networkUrl, chainIdElement, currencySymbol] =
          await driver.findElements('.definition-list dd');

        assert.equal(
          await networkName.getText(),
          networkNAME,
          'Network name is not correctly displayed',
        );
        assert.equal(
          await networkUrl.getText(),
          networkURL,
          'Network Url is not correctly displayed',
        );
        assert.equal(
          await chainIdElement.getText(),
          chainID.toString(),
          'Chain Id is not correctly displayed',
        );
        assert.equal(
          await currencySymbol.getText(),
          currencySYMBOL,
          'Currency symbol is not correctly displayed',
        );

        await driver.clickElement({ tag: 'a', text: 'View all details' });

        const networkDetailsLabels = await driver.findElements('dd');
        assert.equal(
          await networkDetailsLabels[8].getText(),
          blockExplorerURL,
          'Block Explorer URL is not correct',
        );

        await driver.clickElement({ tag: 'button', text: 'Close' });
        await driver.clickElement({ tag: 'button', text: 'Approve' });

<<<<<<< HEAD
        await driver.clickElement({
          tag: 'h6',
          text: 'Switch to Arbitrum One',
        });
        // verify network switched
        const networkDisplayed = await driver.findElement({
          tag: 'span',
          text: 'Arbitrum One',
        });
        assert.equal(
          await networkDisplayed.getText(),
          'Arbitrum One',
          'You have not switched to Arbitrum Network',
        );
      },
    );
  });

  it('add custom network and not switch the network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
=======
          const errMsg =
            'Chain ID returned by the custom network does not match the submitted chain ID.';
          await driver.findElement({
            tag: 'span',
            text: errMsg,
          });

          const approveBtn = await driver.findElement({
            tag: 'button',
            text: 'Approve',
          });

          assert.equal(await approveBtn.isEnabled(), false);
          await driver.clickElement({
            tag: 'button',
            text: 'Cancel',
          });
        },
      );
    });

    it("don't add bad rpc custom network", async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({ useSafeChainsListValidation: true })
            .build(),
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await driver.navigate();
          await unlockWallet(driver);

          await openDapp(driver);
          await driver.executeScript(`
          var params = [{
            chainId: "0x123",
            chainName: "Antani",
            nativeCurrency: {
              name: "",
              symbol: "ANTANI",
              decimals: 18
            },
            rpcUrls: ["https://customnetwork.com/api/customRPC"],
            blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
          }]
          window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params
          })
        `);
          const windowHandles = await driver.waitUntilXWindowHandles(3);

          await driver.switchToWindowWithTitle(
            'MetaMask Notification',
            windowHandles,
          );

          const warningMsg1 =
            'According to our record the network name may not correctly match this chain ID.';
          await driver.findElement({
            tag: 'span',
            text: warningMsg1,
          });

          const errorMsg1 =
            'The submitted currency symbol does not match what we expect for this chain ID.';
          await driver.findElement({
            tag: 'span',
            text: errorMsg1,
          });

          const errorMsg2 =
            'According to our records the submitted RPC URL value does not match a known provider for this chain ID.';
          await driver.findElement({
            tag: 'span',
            text: errorMsg2,
          });

          const errMsg1 = 'verify the network details';
          await driver.findElement({
            tag: 'a',
            text: errMsg1,
          });

          await driver.clickElement({
            tag: 'button',
            text: 'Approve',
          });

          const errMsg2 =
            'Chain ID returned by the custom network does not match the submitted chain ID.';
          await driver.findElement({
            tag: 'span',
            text: errMsg2,
          });

          const approveBtn = await driver.findElement({
            tag: 'button',
            text: 'Approve',
          });

          assert.equal(await approveBtn.isEnabled(), false);
          await driver.clickElement({
            tag: 'button',
            text: 'Cancel',
          });
        },
      );
    });

    it("don't validate bad rpc custom network when toggle is off", async function () {
      async function mockRPCURLAndChainId(mockServer) {
        return [
          await mockServer
            .forPost('https://responsive-rpc.url/')
            .thenCallback(() => ({
              statusCode: 200,
              json: {
                id: '1694444405781',
                jsonrpc: '2.0',
                result: TEST_CHAIN_ID,
              },
            })),
        ];
      }

      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({ useSafeChainsListValidation: false })
            .build(),
          title: this.test.fullTitle(),
          testSpecificMock: mockRPCURLAndChainId,
        },
        async ({ driver }) => {
          await driver.navigate();
          await unlockWallet(driver);

          await openDapp(driver);
          await driver.executeScript(`
          var params = [{
            chainId: "${TEST_CHAIN_ID}",
            chainName: "Antani",
            nativeCurrency: {
              name: "",
              symbol: "ANTANI",
              decimals: 18
            },
            rpcUrls: ["https://responsive-rpc.url/"],
            blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
          }]
          window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params
          })
        `);
          const windowHandles = await driver.waitUntilXWindowHandles(3);

          await driver.switchToWindowWithTitle(
            'MetaMask Notification',
            windowHandles,
          );

          await driver.clickElement({
            tag: 'button',
            text: 'Approve',
          });

          const switchNetworkBtn = await driver.findElement({
            tag: 'button',
            text: 'Switch network',
          });

          await switchNetworkBtn.click();
        },
      );
    });

    it("don't add unreachable custom network", async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await driver.navigate();
          await unlockWallet(driver);

          await openDapp(driver);
          await driver.executeScript(`
          var params = [{
            chainId: "0x123",
            chainName: "Antani",
            nativeCurrency: {
              name: "",
              symbol: "ANTANI",
              decimals: 18
            },
            rpcUrls: ["https://doesntexist.abc/customRPC"],
            blockExplorerUrls: [ "http://localhost:8080/api/customRPC" ]
          }]
          window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params
          })
        `);
          const windowHandles = await driver.waitUntilXWindowHandles(3);

          await driver.switchToWindowWithTitle(
            'MetaMask Notification',
            windowHandles,
          );
          await driver.clickElement({
            tag: 'button',
            text: 'Approve',
          });

          await driver.findElement({
            tag: 'span',
            text: 'Error while connecting to the custom network.',
          });

          const approveBtn = await driver.findElement({
            tag: 'button',
            text: 'Approve',
          });

          assert.equal(await approveBtn.isEnabled(), false);
          await driver.clickElement({
            tag: 'button',
            text: 'Cancel',
          });
        },
      );
    });
  });

  describe('Popular Networks List', function () {
    it('add custom network and switch the network', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await driver.navigate();
          await unlockWallet(driver);
>>>>>>> upstream/multichain-swaps-controller

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ tag: 'div', text: 'Settings' });

        await driver.clickElement('.network-display');
        await driver.clickElement({ tag: 'button', text: 'Add network' });

        // had to put all Add elements in list since list is changing and networks are not always in same order
        await driver.clickElement({
          tag: 'button',
          text: 'Add',
        });

        await driver.clickElement({ tag: 'button', text: 'Approve' });

        await driver.clickElement({
          tag: 'h6',
          text: 'Dismiss',
        });

        // verify if added network is in list of networks
        const networkDisplay = await driver.findElement('.network-display');
        await networkDisplay.click();

        const arbitrumNetwork = await driver.findElements({
          text: `Arbitrum One`,
          tag: 'span',
        });
        assert.ok(arbitrumNetwork.length, 1);
      },
    );
  });

<<<<<<< HEAD
  it('Add a custom network and then delete that same network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController({
            networkConfigurations: {
              networkConfigurationId: {
                rpcUrl: networkURL,
                chainId: chainID,
                nickname: networkNAME,
                ticker: currencySYMBOL,
                rpcPrefs: {},
              },
            },
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
=======
          await driver.clickElement({ tag: 'a', text: 'View all details' });

          const networkDetailsLabels = await driver.findElements('dd');
          assert.equal(
            await networkDetailsLabels[8].getText(),
            blockExplorerURL,
            'Block Explorer URL is not correct',
          );

          await driver.clickElement({ tag: 'button', text: 'Close' });
          await driver.clickElement({ tag: 'button', text: 'Approve' });
          await driver.clickElement({
            tag: 'h6',
            text: 'Switch to Arbitrum One',
          });
          // verify network switched
          const networkDisplayed = await driver.findElement({
            tag: 'span',
            text: 'Arbitrum One',
          });
          assert.equal(
            await networkDisplayed.getText(),
            'Arbitrum One',
            'You have not switched to Arbitrum Network',
          );
        },
      );
    });

    it('add custom network and not switch the network', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await driver.navigate();
          await unlockWallet(driver);

          // Avoid a stale element error
          await driver.delay(regularDelayMs);

          await driver.clickElement('[data-testid="network-display"]');
          await driver.clickElement({ tag: 'button', text: 'Add network' });

          // had to put all Add elements in list since list is changing and networks are not always in same order
          await driver.clickElement({
            tag: 'button',
            text: 'Add',
          });

          await driver.clickElement({ tag: 'button', text: 'Approve' });

          await driver.clickElement({
            tag: 'h6',
            text: 'Dismiss',
          });

          // verify if added network is in list of networks
          const networkDisplay = await driver.findElement(
            '[data-testid="network-display"]',
          );
          await networkDisplay.click();

          const arbitrumNetwork = await driver.findElements({
            text: 'Arbitrum One',
            tag: 'button',
          });
          assert.ok(arbitrumNetwork.length, 1);
        },
      );
    });

    it('delete the Arbitrum network', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withNetworkController({
              networkConfigurations: {
                networkConfigurationId: {
                  rpcUrl: networkURL,
                  chainId: chainID,
                  nickname: networkNAME,
                  ticker: currencySYMBOL,
                  rpcPrefs: {},
                },
              },
            })
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await driver.navigate();
          await unlockWallet(driver);
>>>>>>> upstream/multichain-swaps-controller

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Networks', tag: 'div' });

        const arbitrumNetwork = await driver.clickElement({
          text: `Arbitrum One`,
          tag: 'div',
        });

        await driver.clickElement({
          tag: 'button',
          text: 'Delete',
        });

        await driver.findElement('.modal-container__footer');
        // should be deleted from the modal shown again to complete  deletion custom network
        await driver.clickElement({
          tag: 'button',
          text: 'Delete',
        });

<<<<<<< HEAD
        // it checks if custom network is delete
        const existNetwork = await driver.isElementPresent(arbitrumNetwork);
        assert.equal(existNetwork, false, 'Network is not deleted');
      },
    );
=======
          // Checks if Arbitrum is deleted
          const existNetwork = await driver.isElementPresent(arbitrumNetwork);
          assert.equal(existNetwork, false, 'Network is not deleted');
        },
      );
    });

    it("when the network details validation toggle is turned on, validate user inserted details against data from 'chainid.network'", async function () {
      async function mockRPCURLAndChainId(mockServer) {
        return [
          await mockServer
            .forPost('https://unresponsive-rpc.url/')
            // 502 Error communicating with upstream server
            .thenCallback(() => ({ statusCode: 502 })),

          await mockServer
            .forGet('https://chainid.network/chains.json')
            .thenCallback(() => ({
              statusCode: 200,
              json: MOCK_CHAINLIST_RESPONSE,
            })),
        ];
      }

      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions,
          title: this.test.fullTitle(),
          testSpecificMock: mockRPCURLAndChainId,
        },
        async ({ driver }) => {
          await driver.navigate();

          await unlockWallet(driver);

          await checkThatSafeChainsListValidationToggleIsOn(driver);

          await failCandidateNetworkValidation(driver);
        },
      );
    });

    it("when the network details validation toggle is turned off, don't validate user inserted details", async function () {
      async function mockRPCURLAndChainId(mockServer) {
        return [
          await mockServer
            .forPost('https://responsive-rpc.url/')
            .thenCallback(() => ({
              statusCode: 200,
              json: {
                id: '1694444405781',
                jsonrpc: '2.0',
                result: TEST_CHAIN_ID,
              },
            })),

          await mockServer
            .forGet('https://chainid.network/chains.json')
            .thenCallback(() => ({
              // even with an error, the test passes
              statusCode: 400,
            })),
        ];
      }

      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions,
          title: this.test.fullTitle(),
          testSpecificMock: mockRPCURLAndChainId,
        },
        async ({ driver }) => {
          await driver.navigate();

          await unlockWallet(driver);

          await toggleOffSafeChainsListValidation(driver);

          await candidateNetworkIsNotValidated(driver);
        },
      );
    });
>>>>>>> upstream/multichain-swaps-controller
  });
});

const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap networkAccess', function () {
  it('test the network-access endowment', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: 25000000000000000000,
        },
      ],
    };
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();

        // enter pw into extension
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // navigate to test snaps page and connect to dialog snap
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);
        const dialogButton = await driver.findElement(
          '#connectNetworkAccessSnap',
        );
        await driver.scrollToElement(dialogButton);
        await driver.delay(1000);
        await driver.clickElement('#connectNetworkAccessSnap');
        await driver.delay(1000);

        // switch to metamask extension and click connect
        let windowHandles = await driver.waitUntilXWindowHandles(
          3,
          1000,
          10000,
        );
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Approve & install' });

        await driver.clickElement({
          text: 'Approve & install',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Ok' });

        await driver.clickElement({
          text: 'Ok',
          tag: 'button',
        });

        // switch to test snaps tab
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectNetworkAccessSnap',
          text: 'Reconnect to networkAccess Snap',
        });

        // click on alert dialog
        await driver.clickElement('#sendNetworkAccessTest');
        await driver.delay(500);

        // switch to dialog popup
        windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 10000);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.delay(500);

        // check dialog contents
        let result = await driver.findElement('.snap-ui-renderer__panel');
        await driver.scrollToElement(result);
        await driver.delay(500);
        assert.equal(
          await result.getText(),
          `<!doctype html> <html> </head> <title>Test Snaps</title> <link href="style.css" rel="stylesheet" type="text/css" media="all" /> </head> <body> <code class="fox"> MMm*mmMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMmm*mMM MM*./***mMMMMMMMMMMMMMMMMMMMMMMMMMMm***/.*MM MM/...///*mMMMMMMMMMMMMMMMMMMMMMMm*///.../MM Mm.....//../*mMMMMMMMMMMMMMMMMm*/..//.....mM M*....../*....*mMMMMMMMMMMMMm*....*/......*M M/........*.....*//////////*...../......../M m..........*/...//........//.../*..........m M/..........//.../......../...//........../M M/.........../*/./.......//./*/.........../M M*.............////......////.............*M Mm...............**......**...............mM Mm/...............*/..../*.............../mM MM/............../*/..../*/............../MM Mm..............//./...././/..............mM MM*............*/../..../../*............*MM MM/........../*..../..../....*/........../MM MMm.........//...../..../.....//.........mMM MMm......//**....../..../......**//......mMM MMM/..////.*......./..../......././///../MMM MMMm*//..../......./..../......./....//*mMMM MMMm......*////////*....*////////*......mMMM MMM*......*////////*....*////////*......*MMM MMM/....../*......./..../.......*/....../MMM MMm........**/./m*./..../.**/..**........mMM MM*........//*mMMM///..///mMMm*//........*MM MM/........././*mM*//..//*Mm*/./........./MM Mm..........//.../**/../**/...//..........mM M*...........*..../*/../*/..../...........*M M*///////////*/.../m/../m/.../*///////////*M M*.........../*/...m/../m.../*/...........*M Mm.........../..//.*....*./*../...........mM MM/........../...//******//.../........../MM MM*........../....*MMMMMM*..../..........*MM MMm........../....*MMMMMM*..../..........mMM MMm/........//....*MMMMMM*....//......../mMM MMM/....../*mm*...*mmmmmm*...*mm*/....../MMM MMM*../*mmMMMMMm///......//*mMMMMMmm*/..*MMM MMMm*mMMMMMMMMMMm**......**mMMMMMMMMMMm*mMMM MMMMMMMMMMMMMMMMMm/....../mMMMMMMMMMMMMMMMMM MMMMMMMMMMMMMMMMMMmmmmmmmmMMMMMMMMMMMMMMMMMM </code> <h1>Test Snaps</h1> <section> <h1>Confirm Snap</h1> <label>SnapId</label> <input class="snapId"> <br/> <button class="connectHello">Connect To Confirm Snap</button> <input class="confirmPromptInput" placeholder="hello"/> <input class="confirmDescription"/> <input class="confirmTextAreaContent"/> <button class="sendHello">Send Inputs to Hello Snap</button> <span class="sendResults"></span> </section> <section> <h1>Error Snap</h1> <label>SnapId</label> <input class="snapId2"> <button class="connectError">Connect Error Snap</button> <button class="sendError">Send Test to Error Snap</button> </section> </body> <script> // confirm snap const snapId = document.querySelector('.snapId'); snapId.value = 'local:http://localhost:8082'; const connectButton = document.querySelector('button.connectHello') const sendButton = document.querySelector('button.sendHello') const promptInput = document.querySelector('.confirmPromptInput'); const description = document.querySelector('.confirmDescription'); const textAreaContent = document.querySelector('.confirmTextAreaContent'); const sendResults = document.querySelector('.sendResults'); promptInput.value = 'hello'; // error snap const snapId2 = document.querySelector('.snapId2'); snapId2.value = 'local:http://localhost:8081'; const connectErrorButton = document.querySelector('button.connectError') const sendErrorButton = document.querySelector('button.sendError') connectButton.addEventListener('click', connect) sendButton.addEventListener('click', send) connectErrorButton.addEventListener('click', connectError) sendErrorButton.addEventListener('click', sendError) // actions async function connectError () { await ethereum.request({ method: 'wallet_enable', params: [{ wallet_snap: { [snapId2.value]: {} }, }] }) } // here we get permissions to interact with and install the snap async function connect () { await ethereum.request({ method: 'wallet_enable', params: [{ wallet_snap: { [snapId.value]: {} }, }] }) } // here we call the error snap with any method async function sendError () { try { const response = await ethereum.request({ method: 'wallet_invokeSnap', params: [snapId2.value, { method: 'test' }] }) } catch (err) { console.error(err) alert('Problem happened: ' + err.message || err) } } // here we call the snap's "confirm" method async function send () { try { const response = await ethereum.request({ method: 'wallet_invokeSnap', params: [snapId.value, { method: 'confirm', params: [promptInput.value, description.value, textAreaContent.value] }] }) sendResults.innerHTML = response; } catch (err) { console.error(err) alert('Problem happened: ' + err.message || err) } } </script> </html>`,
        );

        // click ok button
        await driver.clickElement({
          text: 'Ok',
          tag: 'button',
        });
      },
    );
  });
});

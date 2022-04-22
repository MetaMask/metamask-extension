import { strict as assert } from 'assert';
import browser from 'webextension-polyfill';
import sinon from 'sinon';
import {
  PLATFORM_CHROME,
  METAMASK_BETA_CHROME_ID,
  METAMASK_PROD_CHROME_ID,
  METAMASK_FLASK_CHROME_ID,
} from '../../shared/constants/app';
import {
  checkForMultipleVersionsRunning,
  onMessageReceived,
} from './detect-multiple-instances';
import * as util from './lib/util';

describe('multiple instances running detector', function () {
  const PING_MESSAGE = 'isRunning';

  it('should send ping message to multiple instances', async function () {
    const sandbox = sinon.createSandbox();

    sinon.stub(util, 'getPlatform').callsFake((_) => {
      return PLATFORM_CHROME;
    });

    const sendMessageMock = sandbox.stub();
    sandbox.replace(browser, 'runtime', {
      sendMessage: sendMessageMock,
      id: METAMASK_BETA_CHROME_ID,
    });

    await checkForMultipleVersionsRunning();

    assert(sendMessageMock.calledTwice);
    assert(
      sendMessageMock
        .getCall(0)
        .calledWithExactly(METAMASK_PROD_CHROME_ID, PING_MESSAGE),
    );
    assert(
      sendMessageMock
        .getCall(1)
        .calledWithExactly(METAMASK_FLASK_CHROME_ID, PING_MESSAGE),
    );
  });

  it('should print warning message to on ping message received', async function () {
    const consoleSpy = sinon.spy(console, 'warn');

    onMessageReceived(PING_MESSAGE);

    assert(
      consoleSpy.calledWithExactly(
        'Warning! You have multiple instances of MetaMask running!',
      ),
    );
  });
});

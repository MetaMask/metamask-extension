import { strict as assert } from 'assert';
import browser from 'webextension-polyfill';
import sinon from 'sinon';
import {
  PLATFORM_CHROME,
  PLATFORM_EDGE,
  METAMASK_BETA_CHROME_ID,
  METAMASK_PROD_CHROME_ID,
  METAMASK_FLASK_CHROME_ID,
  METAMASK_MMI_PROD_CHROME_ID,
  METAMASK_MMI_BETA_CHROME_ID,
} from '../../shared/constants/app';
import {
  checkForMultipleVersionsRunning,
  onMessageReceived,
} from './detect-multiple-instances';
import * as util from './lib/util';

describe('multiple instances running detector', function () {
  const PING_MESSAGE = 'isRunning';

  let sendMessageStub = sinon.stub();

  beforeEach(async function () {
    sinon.replace(browser, 'runtime', {
      sendMessage: sendMessageStub,
      id: METAMASK_BETA_CHROME_ID,
    });

    sinon.stub(util, 'getPlatform').callsFake((_) => {
      return PLATFORM_CHROME;
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('checkForMultipleVersionsRunning', function () {
    it('should send ping message to multiple instances', async function () {
      await checkForMultipleVersionsRunning();

      assert(sendMessageStub.callCount === 4);
      assert(
        sendMessageStub
          .getCall(0)
          .calledWithExactly(METAMASK_PROD_CHROME_ID, PING_MESSAGE),
      );
      assert(
        sendMessageStub
          .getCall(1)
          .calledWithExactly(METAMASK_FLASK_CHROME_ID, PING_MESSAGE),
      );
      assert(
        sendMessageStub
          .getCall(2)
          .calledWithExactly(METAMASK_MMI_BETA_CHROME_ID, PING_MESSAGE),
      );
      assert(
        sendMessageStub
          .getCall(3)
          .calledWithExactly(METAMASK_MMI_PROD_CHROME_ID, PING_MESSAGE),
      );
    });

    it('should not send ping message if platform is not Chrome or Firefox', async function () {
      util.getPlatform.restore();
      sendMessageStub = sinon.stub();

      sinon.stub(util, 'getPlatform').callsFake((_) => {
        return PLATFORM_EDGE;
      });

      await checkForMultipleVersionsRunning();

      assert(sendMessageStub.notCalled);
    });

    it('should not expose an error outside if sendMessage throws', async function () {
      sinon.restore();

      sinon.replace(browser, 'runtime', {
        sendMessage: sinon.stub().throws(),
        id: METAMASK_BETA_CHROME_ID,
      });

      const spy = sinon.spy(checkForMultipleVersionsRunning);

      await checkForMultipleVersionsRunning();

      assert(!spy.threw());
    });
  });

  describe('onMessageReceived', function () {
    beforeEach(function () {
      sinon.spy(console, 'warn');
    });

    it('should print warning message to on ping message received', async function () {
      onMessageReceived(PING_MESSAGE);

      assert(
        console.warn.calledWithExactly(
          'Warning! You have multiple instances of MetaMask running!',
        ),
      );
    });

    it('should not print warning message if wrong message received', async function () {
      onMessageReceived(PING_MESSAGE.concat('wrong'));

      assert(console.warn.notCalled);
    });
  });
});

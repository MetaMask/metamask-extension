import {
  PLATFORM_CHROME,
  METAMASK_BETA_CHROME_ID,
} from '../../shared/constants/app';
import * as util from './lib/util';
import sinon from 'sinon';
import { checkForMultipleVersionsRunning } from './detect-multiple-instances';
import browser from 'webextension-polyfill';

describe('app utils', () => {
  describe('isPrefixedFormattedHexString', () => {
    it('should return true for valid hex strings', () => {
      // jest.mock('./lib/util', () => ({
      //   getPlatform: jest.fn().mockReturnValue(PLATFORM_CHROME),
      //   // getGasFeeEstimatesAndStartPolling: jest
      //   //   .fn()
      //   //   .mockImplementation(() => Promise.resolve()),
      // }));

      sinon.stub(util, 'getPlatform').callsFake((_) => {
        return PLATFORM_CHROME;
      });

      // sinon.stub(browser.runtime, 'id').value(METAMASK_BETA_CHROME_ID);

      const mock = jest.mock(browser, () => {
        return {
          runtime: {
            sendMessage: jest.fn(),
            id: METAMASK_BETA_CHROME_ID,
          },
        };
      });

      //sinon.stub(browser.runtime, "sendMessage").calledOnce();
      // sinon.stub(browser, 'runtime.sendMessage');

      // const mock = jest
      //   .spyOn(browser.runtime, 'sendMessage')
      //   .mockImplementation();

      // const mock2 = jest
      //   .spyOn(browser.runtime, 'sendMessage')
      //   .mockImplementation();

      // .mockReturnValue({ type: 'test' });

      // browser.runtime.sendMessage
      checkForMultipleVersionsRunning();

      expect(mock).toHaveBeenCalledTimes(3);
      expect(mock.mock.calls).toHaveLength(3);
    });
  });
});

import assert from 'assert';
import CaptchaTokenController from './captcha';

const DUMMY_TOKEN = 'lksdfjsdljfadlkgsdkflvnsdfkl2394824ofn3q4rfnq4319r';

describe('CaptchaTokenController', function () {
  const noop = () => undefined;
  const captchaControllerOpts = {
    showUiCaptchaDialog: noop,
    notifyDomain: noop,
  };

  it('should correctly fulfill the token to the correct origin', function () {
    const origin = 'https://localhost:3045';
    const controller = new CaptchaTokenController({ ...captchaControllerOpts });

    controller.initiateTokenRequest(origin);

    const originFromState = controller.fulfillTokenToTheOrigin(DUMMY_TOKEN);

    assert.strictEqual(origin, originFromState);
  });

  it('should return latest origin that was requested the token', function () {
    const origin1 = 'https://localhost:3400';
    const origin2 = 'https://app.com';
    const controller = new CaptchaTokenController({ ...captchaControllerOpts });

    controller.initiateTokenRequest(origin1);
    controller.initiateTokenRequest(origin2);

    const originFromState = controller.fulfillTokenToTheOrigin(DUMMY_TOKEN);

    assert.strictEqual(origin2, originFromState);
  });
});

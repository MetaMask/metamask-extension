import sinon from 'sinon';
import { createDappTransaction, veryLargeDelayMs } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { SEND_ETH_TRANSACTION_MOCK } from '../simulation-details/mock-request-send-eth';
import { withShieldFixtures } from './fixture';

describe('Shield', function () {
  it('sends requests to backend services', async function () {
    await withShieldFixtures(
      {
        title: this.test?.fullTitle(),
      },
      async ({ driver, gatewaySpy, ruleEngineSpy }) => {
        await loginWithBalanceValidation(driver);
        await createDappTransaction(driver, SEND_ETH_TRANSACTION_MOCK);
        await driver.delay(veryLargeDelayMs);

        // Gateway: `/proxy` path called with Security Alerts URL
        sinon.assert.calledWith(
          gatewaySpy,
          sinon.match({
            method: 'POST',
            path: sinon.match(/proxy.*security-alerts/u),
            body: sinon.match.any,
          }),
        );

        // Gateway: `/proxy` path called with Sentinel URL
        sinon.assert.calledWith(
          gatewaySpy,
          sinon.match({
            method: 'POST',
            path: sinon.match(/proxy.*sentinel/u),
            body: sinon.match.any,
          }),
        );

        // Rule Engine: `/coverage/init` path called
        sinon.assert.calledWith(
          ruleEngineSpy,
          sinon.match({
            method: 'POST',
            path: '/api/v1/coverage/init',
            body: sinon.match.any,
          }),
        );

        // Rule Engine: `/coverage/result` path called
        sinon.assert.calledWith(
          ruleEngineSpy,
          sinon.match({
            method: 'POST',
            path: '/api/v1/coverage/result',
            body: sinon.match.any,
          }),
        );

        console.log(`gatewaySpy.callCount: ${gatewaySpy.callCount}`);
        console.log(`ruleEngineSpy.callCount: ${ruleEngineSpy.callCount}`);
      },
    );
  });
});

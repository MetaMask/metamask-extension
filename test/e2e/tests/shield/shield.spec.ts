import sinon from 'sinon';
import { createDappTransaction } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { SEND_ETH_TRANSACTION_MOCK } from '../simulation-details/mock-request-send-eth';
import { withShieldFixtures } from './fixture';
import { waitUntilCalledWith } from './timer';

describe('Shield', function () {
  it('sends requests to backend services', async function () {
    await withShieldFixtures(
      {
        title: this.test?.fullTitle(),
      },
      async ({ driver, gatewaySpy, ruleEngineSpy }) => {
        // Unlock wallet
        await loginWithBalanceValidation(driver);

        // Send transaction
        await createDappTransaction(driver, SEND_ETH_TRANSACTION_MOCK);

        // Gateway: `/proxy` path called with Security Alerts URL
        await waitUntilCalledWith(
          gatewaySpy,
          sinon.match({
            method: 'POST',
            path: sinon.match(/proxy.*security-alerts/u),
            body: sinon.match.any,
          }),
          driver.timeout,
        );

        // Gateway: `/proxy` path called with Sentinel URL
        await waitUntilCalledWith(
          gatewaySpy,
          sinon.match({
            method: 'POST',
            path: sinon.match(/proxy.*sentinel/u),
            body: sinon.match.any,
          }),
          driver.timeout,
        );

        // Rule Engine: `/coverage/init` path called
        await waitUntilCalledWith(
          ruleEngineSpy,
          sinon.match({
            method: 'POST',
            path: '/api/v1/coverage/init',
            body: sinon.match.any,
          }),
          driver.timeout,
        );

        // Rule Engine: `/coverage/result` path called
        await waitUntilCalledWith(
          ruleEngineSpy,
          sinon.match({
            method: 'POST',
            path: '/api/v1/coverage/result',
            body: sinon.match.any,
          }),
          driver.timeout,
        );

        console.log(`gatewaySpy.callCount: ${gatewaySpy.callCount}`);
        console.log(`ruleEngineSpy.callCount: ${ruleEngineSpy.callCount}`);
      },
    );
  });
});

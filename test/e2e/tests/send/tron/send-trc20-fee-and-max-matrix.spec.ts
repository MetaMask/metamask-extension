import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import { openTronSendForm } from '../../../page-objects/flows/tron-send.flow';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';
import {
  TRON_CREATE_ACCOUNT_BANDWIDTH,
  TRON_FEE_FREE_BANDWIDTH,
  TRON_FEE_NO_BANDWIDTH,
  TRON_FEE_STAKED_BANDWIDTH,
  TRON_TRC20_ENERGY_USED,
  buildTronTrc20FeeScenario,
  formatTronTokenAmount,
} from './fixtures/tron-fee-and-max-scenarios';

const ONE_TRX = 10_000_000;
const NO_TRX = 1;
const ZERO_TRX = 0;
const USDT_BALANCE = '2000000';
const USDT_MAX = formatTronTokenAmount(USDT_BALANCE);
const ENOUGH_ENERGY = TRON_TRC20_ENERGY_USED * 2;
const NO_ENERGY = 0;

describe('Tron Send - TRC-20 fees and Max', function (this: Suite) {
  this.timeout(180_000);

  describe('when amount > token balance', function () {
    it('shows amount error, Max = token balance when TRX covers fee', async function () {
      const scenario = buildTronTrc20FeeScenario({
        balanceSun: ONE_TRX,
        energyLimit: NO_ENERGY,
      });

      await withTronFixtures(
        {
          accounts: scenario.accounts,
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          const sendPage = await openTronSendForm({
            driver,
            symbol: 'USDT',
            recipientAddress: scenario.recipientAddress,
          });

          await sendPage.fillAmount('3');
          await sendPage.checkInsufficientFundsError();
          await sendPage.checkMaxAmount(USDT_MAX);
        },
      );
    });

    it('shows amount error, Max = 0 when TRX short of fee', async function () {
      const scenario = buildTronTrc20FeeScenario({
        balanceSun: NO_TRX,
        energyLimit: NO_ENERGY,
      });

      await withTronFixtures(
        {
          accounts: scenario.accounts,
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          const sendPage = await openTronSendForm({
            driver,
            symbol: 'USDT',
            recipientAddress: scenario.recipientAddress,
          });

          await sendPage.fillAmount('3');
          await sendPage.checkInsufficientFundsError();
          await sendPage.checkMaxAmount('0');
        },
      );
    });

    it('shows amount error, Max = 0 when token balance = 0', async function () {
      const scenario = buildTronTrc20FeeScenario({
        balanceSun: ONE_TRX,
        energyLimit: NO_ENERGY,
        tokenBalance: '0',
      });

      await withTronFixtures(
        {
          accounts: scenario.accounts,
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          const sendPage = await openTronSendForm({
            driver,
            symbol: 'USDT',
            recipientAddress: scenario.recipientAddress,
          });

          await sendPage.fillAmount('1');
          await sendPage.checkInsufficientFundsError();
          await sendPage.checkMaxAmount('0');
        },
      );
    });
  });

  describe('when amount <= token balance', function () {
    describe('staked bandwidth covers transfer + energy covers transfer', function () {
      it('succeeds with no fee, Max = token balance', async function () {
        const scenario = buildTronTrc20FeeScenario({
          balanceSun: ZERO_TRX,
          energyLimit: ENOUGH_ENERGY,
          stakedBandwidth: TRON_FEE_STAKED_BANDWIDTH,
        });

        await withTronFixtures(
          {
            accounts: scenario.accounts,
            fixtures: new FixtureBuilderV2().build(),
            title: this.test?.fullTitle(),
          },
          async ({ driver }: { driver: Driver }) => {
            const sendPage = await openTronSendForm({
              driver,
              symbol: 'USDT',
              recipientAddress: scenario.recipientAddress,
            });

            await sendPage.fillAmount('1');
            await sendPage.checkContinueButton({ state: 'enabled' });
            await sendPage.checkMaxAmount(USDT_MAX);
          },
        );
      });
    });

    describe('free bandwidth covers transfer + energy covers transfer', function () {
      it('succeeds with no fee, Max = token balance', async function () {
        const scenario = buildTronTrc20FeeScenario({
          balanceSun: ZERO_TRX,
          energyLimit: ENOUGH_ENERGY,
          freeBandwidth: TRON_FEE_FREE_BANDWIDTH,
        });

        await withTronFixtures(
          {
            accounts: scenario.accounts,
            fixtures: new FixtureBuilderV2().build(),
            title: this.test?.fullTitle(),
          },
          async ({ driver }: { driver: Driver }) => {
            const sendPage = await openTronSendForm({
              driver,
              symbol: 'USDT',
              recipientAddress: scenario.recipientAddress,
            });

            await sendPage.fillAmount('1');
            await sendPage.checkContinueButton({ state: 'enabled' });
            await sendPage.checkMaxAmount(USDT_MAX);
          },
        );
      });
    });

    describe('bandwidth short + energy covers transfer', function () {
      describe('sources cover transfer together', function () {
        it('charges full bandwidth fee, Max = 0', async function () {
          const scenario = buildTronTrc20FeeScenario({
            balanceSun: NO_TRX,
            energyLimit: ENOUGH_ENERGY,
            freeBandwidth: TRON_CREATE_ACCOUNT_BANDWIDTH * 2,
            stakedBandwidth: TRON_CREATE_ACCOUNT_BANDWIDTH * 2,
          });

          await withTronFixtures(
            {
              accounts: scenario.accounts,
              fixtures: new FixtureBuilderV2().build(),
              title: this.test?.fullTitle(),
            },
            async ({ driver }: { driver: Driver }) => {
              const sendPage = await openTronSendForm({
                driver,
                symbol: 'USDT',
                recipientAddress: scenario.recipientAddress,
              });

              await sendPage.fillAmount('1');
              await sendPage.checkInsufficientBalanceToCoverFeesError();
              await sendPage.checkContinueButtonIsDisabled();
              await sendPage.checkMaxAmount('0');
            },
          );
        });
      });

      describe('TRX covers bandwidth fee', function () {
        it('succeeds, Max = token balance', async function () {
          const scenario = buildTronTrc20FeeScenario({
            balanceSun: ONE_TRX,
            energyLimit: ENOUGH_ENERGY,
          });

          await withTronFixtures(
            {
              accounts: scenario.accounts,
              fixtures: new FixtureBuilderV2().build(),
              title: this.test?.fullTitle(),
            },
            async ({ driver }: { driver: Driver }) => {
              const sendPage = await openTronSendForm({
                driver,
                symbol: 'USDT',
                recipientAddress: scenario.recipientAddress,
              });

              await sendPage.fillAmount('1');
              await sendPage.checkContinueButton({ state: 'enabled' });
              await sendPage.checkMaxAmount(USDT_MAX);
            },
          );
        });
      });

      describe('TRX short of bandwidth fee', function () {
        it('shows cover-fees error, Max = 0', async function () {
          const scenario = buildTronTrc20FeeScenario({
            balanceSun: NO_TRX,
            energyLimit: ENOUGH_ENERGY,
          });

          await withTronFixtures(
            {
              accounts: scenario.accounts,
              fixtures: new FixtureBuilderV2().build(),
              title: this.test?.fullTitle(),
            },
            async ({ driver }: { driver: Driver }) => {
              const sendPage = await openTronSendForm({
                driver,
                symbol: 'USDT',
                recipientAddress: scenario.recipientAddress,
              });

              await sendPage.fillAmount('1');
              await sendPage.checkInsufficientBalanceToCoverFeesError();
              await sendPage.checkContinueButtonIsDisabled();
              await sendPage.checkMaxAmount('0');
            },
          );
        });
      });
    });

    describe('staked bandwidth covers transfer + energy short', function () {
      describe('TRX covers missing energy', function () {
        it('succeeds, Max = token balance', async function () {
          const scenario = buildTronTrc20FeeScenario({
            balanceSun: ONE_TRX,
            energyLimit: NO_ENERGY,
            stakedBandwidth: TRON_FEE_STAKED_BANDWIDTH,
          });

          await withTronFixtures(
            {
              accounts: scenario.accounts,
              fixtures: new FixtureBuilderV2().build(),
              title: this.test?.fullTitle(),
            },
            async ({ driver }: { driver: Driver }) => {
              const sendPage = await openTronSendForm({
                driver,
                symbol: 'USDT',
                recipientAddress: scenario.recipientAddress,
              });

              await sendPage.fillAmount('1');
              await sendPage.checkContinueButton({ state: 'enabled' });
              await sendPage.checkMaxAmount(USDT_MAX);
            },
          );
        });
      });

      describe('TRX short of missing energy', function () {
        it('shows cover-fees error, Max = 0', async function () {
          const scenario = buildTronTrc20FeeScenario({
            balanceSun: NO_TRX,
            energyLimit: NO_ENERGY,
            stakedBandwidth: TRON_FEE_STAKED_BANDWIDTH,
          });

          await withTronFixtures(
            {
              accounts: scenario.accounts,
              fixtures: new FixtureBuilderV2().build(),
              title: this.test?.fullTitle(),
            },
            async ({ driver }: { driver: Driver }) => {
              const sendPage = await openTronSendForm({
                driver,
                symbol: 'USDT',
                recipientAddress: scenario.recipientAddress,
              });

              await sendPage.fillAmount('1');
              await sendPage.checkInsufficientBalanceToCoverFeesError();
              await sendPage.checkContinueButtonIsDisabled();
              await sendPage.checkMaxAmount('0');
            },
          );
        });
      });
    });

    describe('free bandwidth covers transfer + energy short', function () {
      describe('TRX covers missing energy', function () {
        it('succeeds, Max = token balance', async function () {
          const scenario = buildTronTrc20FeeScenario({
            balanceSun: ONE_TRX,
            energyLimit: NO_ENERGY,
            freeBandwidth: TRON_FEE_FREE_BANDWIDTH,
          });

          await withTronFixtures(
            {
              accounts: scenario.accounts,
              fixtures: new FixtureBuilderV2().build(),
              title: this.test?.fullTitle(),
            },
            async ({ driver }: { driver: Driver }) => {
              const sendPage = await openTronSendForm({
                driver,
                symbol: 'USDT',
                recipientAddress: scenario.recipientAddress,
              });

              await sendPage.fillAmount('1');
              await sendPage.checkContinueButton({ state: 'enabled' });
              await sendPage.checkMaxAmount(USDT_MAX);
            },
          );
        });
      });

      describe('TRX short of missing energy', function () {
        it('shows cover-fees error, Max = 0', async function () {
          const scenario = buildTronTrc20FeeScenario({
            balanceSun: NO_TRX,
            energyLimit: NO_ENERGY,
            freeBandwidth: TRON_FEE_FREE_BANDWIDTH,
          });

          await withTronFixtures(
            {
              accounts: scenario.accounts,
              fixtures: new FixtureBuilderV2().build(),
              title: this.test?.fullTitle(),
            },
            async ({ driver }: { driver: Driver }) => {
              const sendPage = await openTronSendForm({
                driver,
                symbol: 'USDT',
                recipientAddress: scenario.recipientAddress,
              });

              await sendPage.fillAmount('1');
              await sendPage.checkInsufficientBalanceToCoverFeesError();
              await sendPage.checkContinueButtonIsDisabled();
              await sendPage.checkMaxAmount('0');
            },
          );
        });
      });
    });

    describe('bandwidth short + energy short', function () {
      describe('TRX covers bandwidth fee + missing energy', function () {
        it('succeeds, Max = token balance', async function () {
          const scenario = buildTronTrc20FeeScenario({
            balanceSun: ONE_TRX,
            energyLimit: NO_ENERGY,
          });

          await withTronFixtures(
            {
              accounts: scenario.accounts,
              fixtures: new FixtureBuilderV2().build(),
              title: this.test?.fullTitle(),
            },
            async ({ driver }: { driver: Driver }) => {
              const sendPage = await openTronSendForm({
                driver,
                symbol: 'USDT',
                recipientAddress: scenario.recipientAddress,
              });

              await sendPage.fillAmount('1');
              await sendPage.checkContinueButton({ state: 'enabled' });
              await sendPage.checkMaxAmount(USDT_MAX);
            },
          );
        });
      });

      describe('TRX short of bandwidth fee + missing energy', function () {
        it('shows cover-fees error, Max = 0', async function () {
          const scenario = buildTronTrc20FeeScenario({
            balanceSun: NO_TRX,
            energyLimit: NO_ENERGY,
          });

          await withTronFixtures(
            {
              accounts: scenario.accounts,
              fixtures: new FixtureBuilderV2().build(),
              title: this.test?.fullTitle(),
            },
            async ({ driver }: { driver: Driver }) => {
              const sendPage = await openTronSendForm({
                driver,
                symbol: 'USDT',
                recipientAddress: scenario.recipientAddress,
              });

              await sendPage.fillAmount('1');
              await sendPage.checkInsufficientBalanceToCoverFeesError();
              await sendPage.checkContinueButtonIsDisabled();
              await sendPage.checkMaxAmount('0');
            },
          );
        });
      });
    });
  });
});

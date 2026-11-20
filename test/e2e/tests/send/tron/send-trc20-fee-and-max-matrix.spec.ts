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

  describe('when the amount is greater than the token balance', function () {
    it('shows the amount error and Max is the full token balance when TRX covers the fee', async function () {
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

    it('shows the amount error and Max is zero when TRX does not cover the fee', async function () {
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

    it('shows the amount error and Max is zero when the token balance is zero', async function () {
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

  describe('when the amount fits the token balance', function () {
    describe('with staked bandwidth and energy covering the transfer', function () {
      it('succeeds with no fee and Max is the full token balance, even with zero TRX', async function () {
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

    describe('with free daily bandwidth and energy covering the transfer', function () {
      it('succeeds with no fee and Max is the full token balance, even with zero TRX', async function () {
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

    describe('with neither bandwidth source covering the transfer', function () {
      describe('with energy covered', function () {
        describe('with enough TRX for the full bandwidth fee', function () {
          it('succeeds and Max is the full token balance', async function () {
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

        describe('without enough TRX for the full bandwidth fee', function () {
          it('reports insufficient balance to cover fees and Max is zero', async function () {
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

        describe('when the sources only cover the transfer together', function () {
          it('prices the full bandwidth fee, reports insufficient balance and Max is zero', async function () {
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
      });
    });

    describe('with staked bandwidth covering the transfer but energy short', function () {
      describe('with enough TRX for the missing energy', function () {
        it('succeeds and Max is the full token balance', async function () {
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

      describe('without enough TRX for the missing energy', function () {
        it('reports insufficient balance to cover fees and Max is zero', async function () {
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

    describe('with free daily bandwidth covering the transfer but energy short', function () {
      describe('with enough TRX for the missing energy', function () {
        it('succeeds and Max is the full token balance', async function () {
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

      describe('without enough TRX for the missing energy', function () {
        it('reports insufficient balance to cover fees and Max is zero', async function () {
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

    describe('with neither bandwidth source covering the transfer and energy short', function () {
      describe('with enough TRX for the full bandwidth fee plus the missing energy', function () {
        it('succeeds and Max is the full token balance', async function () {
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

      describe('without enough TRX for the full bandwidth fee plus the missing energy', function () {
        it('reports insufficient balance to cover fees and Max is zero', async function () {
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

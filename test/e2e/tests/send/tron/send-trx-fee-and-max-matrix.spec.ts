import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import { openTronSendForm } from '../../../page-objects/flows/tron-send.flow';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';
import {
  TRON_ACTIVATION_FEE_SUN,
  TRON_ACTIVATION_WITH_CREATE_ACCOUNT_SUN,
  TRON_BANDWIDTH_FEE_SUN,
  TRON_CREATE_ACCOUNT_BANDWIDTH,
  TRON_FEE_FREE_BANDWIDTH,
  TRON_FEE_NO_BANDWIDTH,
  TRON_FEE_STAKED_BANDWIDTH,
  buildTronTrxFeeScenario,
  buildTrxMaxAfterFee,
} from './fixtures/tron-fee-and-max-scenarios';

const TEN_TRX = 10_000_000;

describe('Tron Send - TRX fees and Max', function (this: Suite) {
  this.timeout(180_000);

  describe('when the amount is greater than the TRX balance', function () {
    it('shows the amount error and Max is balance minus the activation fee', async function () {
      const scenario = buildTronTrxFeeScenario({
        active: false,
        balanceSun: 5_000_000,
        freeBandwidth: TRON_FEE_FREE_BANDWIDTH,
        stakedBandwidth: TRON_FEE_NO_BANDWIDTH,
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
            symbol: 'TRX',
            recipientAddress: scenario.recipientAddress,
          });

          await sendPage.fillAmount('6');
          await sendPage.checkInsufficientFundsError();
          await sendPage.checkMaxAmount(
            buildTrxMaxAfterFee(
              5_000_000,
              TRON_ACTIVATION_WITH_CREATE_ACCOUNT_SUN,
            ),
          );
        },
      );
    });
  });

  describe('when the amount fits the TRX balance', function () {
    describe('to an active recipient', function () {
      describe('with staked bandwidth covering the transfer', function () {
        it('succeeds and Max is the full balance', async function () {
          const scenario = buildTronTrxFeeScenario({
            active: true,
            balanceSun: TEN_TRX,
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
                symbol: 'TRX',
                recipientAddress: scenario.recipientAddress,
              });

              await sendPage.fillAmount('1');
              await sendPage.checkContinueButton({ state: 'enabled' });
              await sendPage.checkMaxAmount('10');
            },
          );
        });
      });

      describe('with free daily bandwidth covering the transfer', function () {
        it('succeeds and Max is the full balance', async function () {
          const scenario = buildTronTrxFeeScenario({
            active: true,
            balanceSun: TEN_TRX,
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
                symbol: 'TRX',
                recipientAddress: scenario.recipientAddress,
              });

              await sendPage.fillAmount('1');
              await sendPage.checkContinueButton({ state: 'enabled' });
              await sendPage.checkMaxAmount('10');
            },
          );
        });
      });

      describe('with neither bandwidth source covering the transfer', function () {
        describe('when the sources only cover the transfer together', function () {
          it('prices the full bandwidth fee and Max is balance minus the fee', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: true,
              balanceSun: TEN_TRX,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('1');
                await sendPage.checkContinueButton({ state: 'enabled' });
                await sendPage.checkMaxAmount(
                  buildTrxMaxAfterFee(TEN_TRX, TRON_BANDWIDTH_FEE_SUN),
                );
              },
            );
          });
        });

        describe('with enough TRX to cover the bandwidth fee', function () {
          it('succeeds and Max is balance minus the full bandwidth fee', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: true,
              balanceSun: TEN_TRX,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('1');
                await sendPage.checkContinueButton({ state: 'enabled' });
                await sendPage.checkMaxAmount(
                  buildTrxMaxAfterFee(TEN_TRX, TRON_BANDWIDTH_FEE_SUN),
                );
              },
            );
          });
        });

        describe('without enough TRX to cover the bandwidth fee', function () {
          it('reports insufficient balance to cover fees and Max is balance minus the fee', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: true,
              balanceSun: 300_000,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('0.1');
                await sendPage.checkInsufficientBalanceToCoverFeesError();
                await sendPage.checkContinueButtonIsDisabled();
                await sendPage.checkMaxAmount(
                  buildTrxMaxAfterFee(300_000, TRON_BANDWIDTH_FEE_SUN),
                );
              },
            );
          });

          it('reports insufficient balance to cover fees and Max is zero when balance is below the fee', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: true,
              balanceSun: 200_000,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('0.1');
                await sendPage.checkInsufficientBalanceToCoverFeesError();
                await sendPage.checkContinueButtonIsDisabled();
                await sendPage.checkMaxAmount('0');
              },
            );
          });

          it('reports the amount error instead when the amount also exceeds balance, and Max is unchanged', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: true,
              balanceSun: 200_000,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('1');
                await sendPage.checkInsufficientFundsError();
                await sendPage.checkMaxAmount('0');
              },
            );
          });
        });
      });
    });

    describe('to an inactive recipient', function () {
      describe('with staked bandwidth covering the create-account burn', function () {
        describe('with enough TRX to cover the 1 TRX activation', function () {
          it('succeeds and Max is balance minus 1 TRX', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: false,
              balanceSun: TEN_TRX,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('1');
                await sendPage.checkContinueButton({ state: 'enabled' });
                await sendPage.checkMaxAmount(
                  buildTrxMaxAfterFee(TEN_TRX, TRON_ACTIVATION_FEE_SUN),
                );
              },
            );
          });
        });

        describe('without enough TRX to cover the 1 TRX activation', function () {
          it('reports insufficient balance to cover fees and Max is balance minus 1 TRX', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: false,
              balanceSun: 1_500_000,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('1');
                await sendPage.checkInsufficientBalanceToCoverFeesError();
                await sendPage.checkContinueButtonIsDisabled();
                await sendPage.checkMaxAmount(
                  buildTrxMaxAfterFee(1_500_000, TRON_ACTIVATION_FEE_SUN),
                );
              },
            );
          });

          it('reports insufficient balance to cover fees and Max is zero when balance is below 1 TRX', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: false,
              balanceSun: 500_000,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('0.1');
                await sendPage.checkInsufficientBalanceToCoverFeesError();
                await sendPage.checkContinueButtonIsDisabled();
                await sendPage.checkMaxAmount('0');
              },
            );
          });

          it('reports the amount error instead when the amount also exceeds balance, and Max is unchanged', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: false,
              balanceSun: 500_000,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('1');
                await sendPage.checkInsufficientFundsError();
                await sendPage.checkMaxAmount('0');
              },
            );
          });
        });
      });

      describe('without staked bandwidth for the create-account burn', function () {
        describe('with enough TRX to cover the 1.1 TRX activation', function () {
          it('succeeds and Max is balance minus 1.1 TRX', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: false,
              balanceSun: TEN_TRX,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('1');
                await sendPage.checkContinueButton({ state: 'enabled' });
                await sendPage.checkMaxAmount(
                  buildTrxMaxAfterFee(
                    TEN_TRX,
                    TRON_ACTIVATION_WITH_CREATE_ACCOUNT_SUN,
                  ),
                );
              },
            );
          });
        });

        describe('without enough TRX to cover the 1.1 TRX activation', function () {
          it('reports insufficient balance to cover fees and Max is balance minus 1.1 TRX', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: false,
              balanceSun: 1_500_000,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('1');
                await sendPage.checkInsufficientBalanceToCoverFeesError();
                await sendPage.checkContinueButtonIsDisabled();
                await sendPage.checkMaxAmount(
                  buildTrxMaxAfterFee(
                    1_500_000,
                    TRON_ACTIVATION_WITH_CREATE_ACCOUNT_SUN,
                  ),
                );
              },
            );
          });

          it('ignores free daily bandwidth and Max is zero when balance is below 1.1 TRX', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: false,
              balanceSun: 1_000_000,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('0.1');
                await sendPage.checkInsufficientBalanceToCoverFeesError();
                await sendPage.checkContinueButtonIsDisabled();
                await sendPage.checkMaxAmount('0');
              },
            );
          });

          it('reports the amount error instead when the amount also exceeds balance, and Max is unchanged', async function () {
            const scenario = buildTronTrxFeeScenario({
              active: false,
              balanceSun: 1_000_000,
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
                  symbol: 'TRX',
                  recipientAddress: scenario.recipientAddress,
                });

                await sendPage.fillAmount('2');
                await sendPage.checkInsufficientFundsError();
                await sendPage.checkMaxAmount('0');
              },
            );
          });
        });
      });
    });
  });
});

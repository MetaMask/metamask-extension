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

  describe('when amount > balance', function () {
    it('shows amount error, Max = balance - activation', async function () {
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

  describe('when amount <= balance', function () {
    describe('active recipient', function () {
      describe('staked bandwidth covers transfer', function () {
        it('succeeds, Max = balance', async function () {
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

      describe('free bandwidth covers transfer', function () {
        it('succeeds, Max = balance', async function () {
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

      describe('staked and free bandwidth each short', function () {
        describe('sources cover transfer together', function () {
          it('charges full bandwidth fee, Max = balance - fee', async function () {
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

        describe('TRX covers bandwidth fee', function () {
          it('succeeds, Max = balance - fee', async function () {
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

        describe('TRX short of bandwidth fee', function () {
          it('shows cover-fees error, Max = balance - fee', async function () {
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

          it('shows cover-fees error, Max = 0 when balance < fee', async function () {
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

          it('shows amount error when amount > balance, Max unchanged', async function () {
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

    describe('inactive recipient', function () {
      describe('staked bandwidth covers create-account burn', function () {
        describe('TRX covers 1 TRX activation', function () {
          it('succeeds, Max = balance - 1', async function () {
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

        describe('TRX short of 1 TRX activation', function () {
          it('shows cover-fees error, Max = balance - 1', async function () {
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

          it('shows cover-fees error, Max = 0 when balance < 1', async function () {
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

          it('shows amount error when amount > balance, Max unchanged', async function () {
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

      describe('staked bandwidth short of create-account burn', function () {
        describe('TRX covers 1.1 TRX activation', function () {
          it('succeeds, Max = balance - 1.1', async function () {
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

        describe('TRX short of 1.1 TRX activation', function () {
          it('shows cover-fees error, Max = balance - 1.1', async function () {
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

          it('ignores free bandwidth, Max = 0 when balance < 1.1', async function () {
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

          it('shows amount error when amount > balance, Max unchanged', async function () {
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

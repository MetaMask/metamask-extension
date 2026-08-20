import { Suite } from "mocha";
import { EXPECTED_TRON_ADDRESSES_BY_INDEX } from "../../../constants";
import FixtureBuilderV2 from "../../../fixtures/fixture-builder-v2";
import {
  confirmTronSendAndAssertActivity,
  openTronSendAmountRecipient,
  prepareTronHomepageForSend,
  switchToTronAccountForSend,
} from "../../../page-objects/flows/tron-send.flow";
import { TronNode } from "../../../seeder/tron/node";
import { Driver } from "../../../webdriver/driver";
import {
  TRON_LOW_TRX_WITH_USDT_ACCOUNT,
  TRON_PORTFOLIO_ACCOUNT,
  TRON_PORTFOLIO_TRX_BALANCE_IN_SUN,
} from "../../tron/fixtures/environments";
import { configureTronFixtureSession } from "../../tron/fixtures/tron-fixture-session";
import { type TronFixtureAccount } from "../../tron/fixtures/with-tron-fixtures";
import { TRON_CHAIN_ID, TRON_RECIPIENT_ADDRESS } from "../../tron/mocks/common-tron";

const TRON_SEND_FEE_BUFFER_IN_SUN = 1_000_000;
// One derived account per case. Account 1 is the funded form-validation
// address (those cases do not spend). Accounts 3–6 each own one confirmed send.
const TRON_EXTRA_HD_ACCOUNT_COUNT = 5;

function buildTronAccount(profile: TronFixtureAccount, index: number): TronFixtureAccount {
  return {
    ...profile,
    address: EXPECTED_TRON_ADDRESSES_BY_INDEX[index],
    assets: profile.assets?.map((asset) => ({ ...asset })),
  };
}

const TRON_ACCOUNT_1_VALIDATION_PORTFOLIO = buildTronAccount(TRON_PORTFOLIO_ACCOUNT, 0);
const TRON_ACCOUNT_2_LOW_FEE = buildTronAccount(TRON_LOW_TRX_WITH_USDT_ACCOUNT, 1);
const TRON_ACCOUNT_3_PARTIAL_TRX = buildTronAccount(TRON_PORTFOLIO_ACCOUNT, 2);
const TRON_ACCOUNT_4_FULL_TRX = buildTronAccount(TRON_PORTFOLIO_ACCOUNT, 3);
const TRON_ACCOUNT_5_PARTIAL_USDT = buildTronAccount(TRON_PORTFOLIO_ACCOUNT, 4);
const TRON_ACCOUNT_6_FULL_USDT = buildTronAccount(TRON_PORTFOLIO_ACCOUNT, 5);

const TRON_SEND_ACCOUNTS = [
  TRON_ACCOUNT_1_VALIDATION_PORTFOLIO,
  TRON_ACCOUNT_2_LOW_FEE,
  TRON_ACCOUNT_3_PARTIAL_TRX,
  TRON_ACCOUNT_4_FULL_TRX,
  TRON_ACCOUNT_5_PARTIAL_USDT,
  TRON_ACCOUNT_6_FULL_USDT,
];

function formatSunAmount(amountInSun: number): string {
  const whole = Math.floor(amountInSun / 1_000_000);
  const fraction = String(amountInSun % 1_000_000).padStart(6, "0");
  return `${whole}.${fraction}`.replace(/\.?0+$/u, "");
}

function getTronTrc20AssetId(
  localNodes: unknown[],
  symbol: "USDT" | "USDD" | "HTX" | "SEED",
): string {
  const tronNode = localNodes.find((node): node is TronNode => node instanceof TronNode);
  const token = tronNode?.trc20Tokens[symbol];
  if (!token) {
    throw new Error(`Seeded ${symbol} token was not found on the Tron node`);
  }
  return `${TRON_CHAIN_ID}/trc20:${token.address}`;
}

// The session suite is created nested so its hooks and tests inherit this
// timeout (Mocha copies the parent suite's timeout when a suite is added).
describe("Tron Send", function (this: Suite) {
  this.timeout(300_000);

  // One shared Chrome: form checks on Accounts 1–2 plus confirmed sends on Accounts 3–6.
  configureTronFixtureSession(
    "with a shared fixture session",
    {
      accounts: TRON_SEND_ACCOUNTS,
      fixtures: new FixtureBuilderV2().build(),
      title: "Tron Send",
    },
    ({ getDriver, getFixtures }) => {
      let driver: Driver;

      before(async function () {
        driver = getDriver();
        await prepareTronHomepageForSend({
          accountToSelect: "Account 1",
          driver,
          extraHdAccountCount: TRON_EXTRA_HD_ACCOUNT_COUNT,
        });
      });

      // Account 1 does not spend. Reopen Send between checks, then Account 2 for the
      // uncovered-fee case so this `it` does not depend on leftover account state.
      it("blocks Continue on invalid Tron send form input", async function () {
        await switchToTronAccountForSend({
          accountName: "Account 1",
          driver,
        });

        console.log("Checking Continue is blocked when a bad address is entered");
        let sendPage = await openTronSendAmountRecipient({ driver });
        await sendPage.fillRecipient({
          recipientAddress: "not-a-valid-address",
          // The formatted recipient element never renders for an invalid
          // address, so skip the post-paste re-render wait.
          validAddress: false,
        });
        await sendPage.checkInvalidAddressError();
        await sendPage.checkContinueButtonIsDisabled();

        console.log("Checking Continue is blocked when amount is empty");
        sendPage = await openTronSendAmountRecipient({ driver });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        // Empty amount leaves Continue enabled; Tron snap rejects on submit and
        // surfaces transactionError on the Continue button.
        await sendPage.pressContinueButton();
        await sendPage.checkTransactionError();
        await sendPage.checkContinueButtonIsDisabled();

        console.log("Checking Continue is blocked when amount exceeds balance");
        sendPage = await openTronSendAmountRecipient({ driver });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount("999999");
        await sendPage.checkInsufficientFundsError();
        await sendPage.checkContinueButtonIsDisabled();

        console.log("Checking USDT send is blocked when TRX cannot cover the energy fee");
        // Wait for Account 2's seeded USDT (2_000_000 raw = 2 USDT) to land on
        // the homepage before deep-linking to Send with the USDT asset id. In
        // the shared session the account switch happens instantly, and opening
        // the Send deep link before the account's Tron assets are in state
        // leaves the send form unrendered (isolated runs hid this behind the
        // slower fresh-profile startup).
        await switchToTronAccountForSend({
          accountName: "Account 2",
          driver,
          expectedNativeBalance: null,
          expectedTokenBalance: "2",
          symbol: "USDT",
        });
        sendPage = await openTronSendAmountRecipient({
          assetId: getTronTrc20AssetId(getFixtures().localNodes, "USDT"),
          driver,
        });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount("1");
        // With 1 sun TRX, Continue builds the TRC20 transaction then fails fee cover.
        await sendPage.pressContinueButton();
        await sendPage.checkInsufficientBalanceToCoverFeesError();
        await sendPage.checkContinueButtonIsDisabled();
      });

      describe("confirmed sends", function () {
        // Each case uses its own funded HD account so confirmed txs do not share balances.
        it("sends part of TRX balance and shows it pending then confirmed", async function () {
          await switchToTronAccountForSend({
            accountName: "Account 3",
            driver,
          });
          const sendPage = await openTronSendAmountRecipient({ driver });
          await sendPage.fillRecipient({
            recipientAddress: TRON_RECIPIENT_ADDRESS,
          });
          await sendPage.fillAmount("1");
          await sendPage.pressContinueButton();

          await confirmTronSendAndAssertActivity({
            driver,
            expectedAmount: "-1 TRX",
          });
        });

        it("sends fee-buffered TRX balance via manual full-amount entry", async function () {
          await switchToTronAccountForSend({
            accountName: "Account 4",
            driver,
          });
          const sendPage = await openTronSendAmountRecipient({ driver });
          await sendPage.fillRecipient({
            recipientAddress: TRON_RECIPIENT_ADDRESS,
          });
          const sendAmount = formatSunAmount(
            TRON_PORTFOLIO_TRX_BALANCE_IN_SUN - TRON_SEND_FEE_BUFFER_IN_SUN,
          );
          await sendPage.fillAmount(sendAmount);
          await sendPage.pressContinueButton();

          await confirmTronSendAndAssertActivity({ driver });
        });

        it("sends part of USDT balance and shows it pending then confirmed", async function () {
          await switchToTronAccountForSend({
            accountName: "Account 5",
            driver,
            expectedTokenBalance: "2.805",
            symbol: "USDT",
          });
          const sendPage = await openTronSendAmountRecipient({
            assetId: getTronTrc20AssetId(getFixtures().localNodes, "USDT"),
            driver,
          });
          await sendPage.fillRecipient({
            recipientAddress: TRON_RECIPIENT_ADDRESS,
          });
          await sendPage.fillAmount("1");
          await sendPage.waitForSendAmountBalance();
          await sendPage.pressContinueButton();

          await confirmTronSendAndAssertActivity({
            driver,
            expectedAmount: "-1 USDT",
          });
        });

        it("sends total USDT balance via manual full-amount entry", async function () {
          await switchToTronAccountForSend({
            accountName: "Account 6",
            driver,
            expectedTokenBalance: "2.805",
            symbol: "USDT",
          });
          const sendPage = await openTronSendAmountRecipient({
            assetId: getTronTrc20AssetId(getFixtures().localNodes, "USDT"),
            driver,
          });
          await sendPage.fillRecipient({
            recipientAddress: TRON_RECIPIENT_ADDRESS,
          });
          // Seeded USDT balance is 2_804_595 raw = 2.804595 USDT.
          // TRC20 has no fee buffer (fee paid in TRX).
          await sendPage.fillAmount("2.804595");
          await sendPage.waitForSendAmountBalance();
          await sendPage.pressContinueButton();

          // Activity may round the amount; presence + confirmed status is enough.
          await confirmTronSendAndAssertActivity({ driver });
        });
      });
    },
  );
});

# Tron Send Current State

Date: 2026-05-08

## Scope

This note summarizes the current state of the `test/e2e/tests/tron/send.spec.ts`
work around send validation, local Tron fixtures, and the remaining USDT fee
validation failure.

## Implemented Behavior

- Invalid Tron recipients are validated on input.
  - The send form displays `Invalid address`.
  - `Continue` remains disabled while the entered recipient has not validated.

- Blank non-EVM send amounts are treated as required.
  - The amount validation checks the unset value before normalizing it to `0`.
  - The E2E test leaves the amount empty and asserts `Required`.
  - The test does not submit the form to trigger this validation.

- Snap amount validation receives the recipient address.
  - `onAmountInput` is called with `toAddress` when a recipient exists.
  - This lets the Tron snap build the transaction during input validation and
    calculate recipient-dependent fees.

- Async amount validation has a stale-result guard.
  - Older async validation runs cannot overwrite the latest validation state.
  - This was added because recipient/amount changes can trigger overlapping
    validation runs.

- Tron local mocks were extended for TRC20 validation.
  - `/wallet/triggersmartcontract` is mocked for seeded TRC20 contracts.
  - `/wallet/triggerconstantcontract` returns an energy estimate for seeded
    TRC20 contracts.
  - Chain parameter and maintenance-time endpoints are mocked for snap fee
    calculation dependencies.

## Test Status

Passing verification:

```bash
yarn test:unit ui/pages/confirmations/hooks/send/useAmountValidation.test.ts ui/pages/confirmations/hooks/send/useSnapAmountOnInput.test.ts ui/pages/confirmations/components/send/amount-recipient/amount-recipient.test.tsx
```

Result:

- 3 test suites passed.
- 50 tests passed.

Passing build:

```bash
yarn build:test
```

Lint:

```bash
yarn lint:changed
```

Result:

- Passed.

## E2E Status

In `test/e2e/tests/tron/send.spec.ts`, these validation cases now pass:

- `blocks Continue when a bad address is entered`
- `blocks Continue when amount is empty`

The remaining failing case is:

- `blocks USDT send when TRX balance cannot cover energy fee`

Observed failure:

- The test fills a valid Tron recipient and amount `1`.
- The UI reaches `/wallet/triggersmartcontract`.
- The expected message `Insufficient balance to cover fees` never appears.
- The failure DOM shows the amount field and Continue button rendering
  `Invalid value` instead.

Current interpretation:

- The extension is now testing the right path: fee validation runs on input and
  uses the recipient address.
- The snap still returns the generic `Invalid` result for the mocked TRC20 path.
- The most likely remaining issue is that the local `triggersmartcontract` mock
  is still not returning a transaction shape that TronWeb/snap fee calculation
  accepts all the way through.

## Relevant Files

- `test/e2e/tests/tron/send.spec.ts`
- `test/e2e/page-objects/pages/send/send-page.ts`
- `test/e2e/tests/tron/mocks/local-tron-node-mocks.ts`
- `ui/pages/confirmations/components/send/amount-recipient/amount-recipient.tsx`
- `ui/pages/confirmations/hooks/send/useAmountValidation.ts`
- `ui/pages/confirmations/hooks/send/useAmountValidation.test.ts`
- `ui/pages/confirmations/hooks/send/useSnapAmountOnInput.ts`
- `ui/pages/confirmations/hooks/send/useSnapAmountOnInput.test.ts`
- `ui/pages/confirmations/utils/multichain-snaps.ts`

## Next Debugging Step

Focus on why snap `onAmountInput` returns `Invalid` for the low-TRX USDT case.

Suggested path:

1. Reproduce the mocked `/wallet/triggersmartcontract` response against
   TronWeb's `triggerSmartContract` result validation.
2. Compare the mocked response with a real local-node response for a deployed
   seeded TRC20 contract.
3. Adjust only the mock transaction fields required for TronWeb's
   `txCheckWithArgs` / snap fee calculation to pass.
4. Rerun only:

```bash
yarn test:e2e:single test/e2e/tests/tron/send.spec.ts --browser=chrome
```

The goal is not to weaken the E2E assertion. The test should continue asserting
that the fee-specific error appears on input, without pressing `Continue`.

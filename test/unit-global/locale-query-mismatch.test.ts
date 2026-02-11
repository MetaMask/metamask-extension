/**
 * Fitness function: Detect locale-query mismatches in tests
 *
 * Rule 1 — Hardcoded JSX + locale query (fragile coupling):
 * Test renders `<button>Close</button>` but queries via `messages.close.message`.
 * Fix: use `getByText('Close')` — the text is hardcoded, not i18n.
 *
 * Rule 2 — Hardcoded query string matching a locale value (brittle to translation changes):
 * Component renders via `t('tronDailyResources')` but test queries `getByText("Tron Daily Resources")`.
 * Fix: use `messages.tronDailyResources.message` — stays in sync with translations.
 * Scans ALL test files (not just those importing messages).
 */

import fs from 'fs';
import path from 'path';
import glob from 'glob';

const enLocale: Record<string, { message: string }> =
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  require('../../app/_locales/en/messages.json');

// --- Shared patterns ---

const MESSAGES_IMPORT_PATTERN =
  /import\s+\{[^}]*enLocale\s+as\s+messages[^}]*\}\s+from/u;

// Query functions used in @testing-library
const QUERY_FN_NAMES = [
  'getByText',
  'queryByText',
  'findByText',
  'getAllByText',
  'queryAllByText',
  'findAllByText',
  'getByRole',
  'queryByRole',
  'findByRole',
  'getByLabelText',
  'queryByLabelText',
  'findByLabelText',
  'getByPlaceholderText',
  'queryByPlaceholderText',
  'findByPlaceholderText',
];

const QUERY_FN_GROUP = QUERY_FN_NAMES.join('|');

// --- Rule 1: Hardcoded JSX text queried via messages.xxx.message ---

// Query using messages.xxx.message
const LOCALE_QUERY_PATTERN = new RegExp(
  `(?:${QUERY_FN_GROUP})\\s*\\(\\s*messages\\.(\\w+)\\.message`,
  'gu',
);

// Hardcoded text between JSX tags: >SomeText<
const HARDCODED_JSX_TEXT_PATTERN = />([A-Z][A-Za-z\s]{1,30})</gu;

type Violation = {
  file: string;
  line: number;
  rule: string;
  message: string;
};

function findRule1Violations(
  _filePath: string,
  lines: string[],
): Violation[] {
  const violations: Violation[] = [];

  // Collect all hardcoded JSX text in the file
  const hardcodedTexts = new Set<string>();
  for (const line of lines) {
    let match;
    HARDCODED_JSX_TEXT_PATTERN.lastIndex = 0;
    while ((match = HARDCODED_JSX_TEXT_PATTERN.exec(line)) !== null) {
      hardcodedTexts.add(match[1].trim());
    }
  }

  if (hardcodedTexts.size === 0) {
    return [];
  }

  // Find query calls using messages.xxx.message
  for (let i = 0; i < lines.length; i++) {
    let match;
    LOCALE_QUERY_PATTERN.lastIndex = 0;
    while ((match = LOCALE_QUERY_PATTERN.exec(lines[i])) !== null) {
      const messageKey = match[1];
      const localeEntry = enLocale[messageKey];
      if (!localeEntry) {
        continue;
      }

      const localeValue = localeEntry.message;

      if (hardcodedTexts.has(localeValue)) {
        violations.push({
          file: _filePath,
          line: i + 1,
          rule: 'Rule 1',
          message:
            `Query uses messages.${messageKey}.message ("${localeValue}") ` +
            `but "${localeValue}" is hardcoded in JSX.\n` +
            `    Fix: use getByText('${localeValue}') instead.`,
        });
      }
    }
  }

  return violations;
}

// --- Rule 2: Hardcoded string in query that matches a locale value ---

// Build reverse lookup: locale value → key (only for values ≥ 3 chars to avoid noise)
const localeValueToKey = new Map<string, string>();
for (const [key, entry] of Object.entries(enLocale)) {
  if (entry.message && entry.message.length >= 3) {
    // Use first key found (some values may duplicate across keys)
    if (!localeValueToKey.has(entry.message)) {
      localeValueToKey.set(entry.message, key);
    }
  }
}

// Match hardcoded strings in query calls: getByText("...") or getByText('...')
const HARDCODED_QUERY_PATTERN = new RegExp(
  `(?:${QUERY_FN_GROUP})\\s*\\(\\s*['"]([^'"]{3,})['"]`,
  'gu',
);

// Strings that are common test data, not real i18n values — skip these
const IGNORED_STRINGS = new Set([
  'Test Account',
  'modal content',
  'test content',
  'test',
]);

/**
 * Baseline of pre-existing Rule 2 violations (file → count).
 * New violations are not allowed. Reduce counts as you fix files.
 * When a file reaches 0, remove it from this map.
 */
const RULE_2_BASELINE: Record<string, number> = {
  'ui/pages/confirmations/components/edit-gas-fee-popover/edit-gas-fee-popover.test.js': 22,
  'ui/pages/confirmations/components/confirm/info/typed-sign/typed-sign-v4-simulation/decoded-simulation/decoded-simulation.test.tsx': 20,
  'ui/components/multichain-accounts/multichain-account-edit-modal/multichain-account-edit-modal.test.tsx': 14,
  'ui/pages/confirmations/components/edit-gas-fee-button/edit-gas-fee-button.test.js': 10,
  'ui/pages/multichain-accounts/account-list/account-list.test.tsx': 10,
  'ui/components/multichain-accounts/add-multichain-account/add-multichain-account.test.tsx': 8,
  'ui/components/app/assets/nfts/nfts-tab/nfts-tab.test.js': 7,
  'ui/components/multichain-accounts/multichain-account-list/multichain-account-list.test.tsx': 7,
  'ui/pages/confirmations/components/confirm/info/shared/batched-approval-function/batched-approval-function.test.tsx': 7,
  'ui/pages/confirmations/components/edit-gas-fee-popover/edit-gas-item/edit-gas-item.test.js': 7,
  'ui/pages/create-account/connect-hardware/index.test.tsx': 7,
  'ui/components/multichain/account-details/account-details.test.js': 6,
  'ui/components/multichain/import-nfts-modal/import-nfts-modal.test.js': 6,
  'ui/pages/confirmations/components/confirm/info/batch/batch-simulation-details/batch-simulation-details.test.tsx': 6,
  'ui/pages/confirmations/components/confirm/info/typed-sign/typed-sign-v4-simulation/typed-sign-v4-simulation.test.tsx': 6,
  'ui/components/app/perps/order-card/order-card.test.tsx': 5,
  'ui/pages/confirmations/components/confirm/info/personal-sign/personal-sign.test.tsx': 5,
  'ui/pages/confirmations/components/confirm/info/typed-sign-v1/typed-sign-v1.test.tsx': 5,
  'ui/pages/confirmations/components/confirm/info/typed-sign/typed-sign.test.tsx': 5,
  'ui/pages/confirmations/components/gas-details-item/gas-details-item.test.js': 5,
  'ui/pages/multichain-accounts/wallet-details-page/wallet-details-page.test.tsx': 5,
  'ui/components/app/multichain-transaction-details-modal/multichain-transaction-details-modal.test.tsx': 4,
  'ui/components/multichain/import-account/import-account.test.tsx': 4,
  'ui/pages/confirmations/components/confirm/info/base-transaction-info/base-transaction-info.test.tsx': 4,
  'ui/pages/confirmations/components/send/asset-list/asset-list.test.tsx': 4,
  'ui/pages/onboarding-flow/privacy-settings/privacy-settings.test.tsx': 4,
  'ui/components/app/modals/customize-nonce/customize-nonce.test.js': 3,
  'ui/components/app/permission-cell/permission-cell.test.js': 3,
  'ui/components/app/snaps/keyring-snap-removal-warning/keyring-snap-removal-warning.test.tsx': 3,
  'ui/components/multichain-accounts/account-details-row/account-details-row.test.tsx': 3,
  'ui/components/multichain-accounts/account-show-private-key-row/account-show-private-key-row.test.tsx': 3,
  'ui/components/multichain/edit-accounts-modal/edit-accounts-modal.test.tsx': 3,
  'ui/components/multichain/edit-networks-modal/edit-networks-modal.test.js': 3,
  'ui/components/multichain/network-list-menu/network-list-menu.test.tsx': 3,
  'ui/pages/confirmations/components/advanced-gas-fee-popover/advanced-gas-fee-gas-limit/advanced-gas-fee-gas-limit.test.js': 3,
  'ui/pages/confirmations/components/advanced-gas-fee-popover/advanced-gas-fee-inputs/base-fee-input/base-fee-input.test.js': 3,
  'ui/pages/confirmations/components/advanced-gas-fee-popover/advanced-gas-fee-inputs/priority-fee-input/priority-fee-input.test.js': 3,
  'ui/pages/confirmations/components/confirm/header/header-info.test.tsx': 3,
  'ui/pages/confirmations/components/confirm/info/batch/nested-transaction-data/nested-transaction-data.test.tsx': 3,
  'ui/pages/confirmations/components/confirm/info/batch/transaction-account-details/transaction-account-details.test.tsx': 3,
  'ui/pages/confirmations/components/send/hex-data/hex-data.test.tsx': 3,
  'ui/components/app/cancel-speedup-popover/cancel-speedup-popover.test.js': 2,
  'ui/components/app/modals/confirm-delete-network/confirm-delete-network.test.js': 2,
  'ui/components/app/modals/confirm-remove-account/confirm-remove-account.test.js': 2,
  'ui/components/app/modals/reject-transactions/reject-transactions.test.js': 2,
  'ui/components/app/rewards/RewardsPointsBalance.test.tsx': 2,
  'ui/components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-network.test.tsx': 2,
  'ui/pages/confirmations/components/advanced-gas-controls/advanced-gas-controls.test.js': 2,
  'ui/pages/confirmations/components/confirm/info/shared/network-row/network-row.test.tsx': 2,
  'ui/pages/confirmations/components/confirm/info/shared/quote-transaction-data/quoted-transaction-data.test.tsx': 2,
  'ui/pages/confirmations/components/confirm/info/shared/transaction-data/transaction-data.test.tsx': 2,
  'ui/pages/confirmations/components/fee-details-component/fee-details-component.test.js': 2,
  'ui/pages/confirmations/components/gas-timing/gas-timing.component.test.js': 2,
  'ui/pages/confirmations/components/modals/pay-with-modal/pay-with-modal.test.tsx': 2,
  'ui/pages/confirmations/components/send/amount/amount.test.tsx': 2,
  'ui/pages/confirmations/components/send/network-filter/network-filter.test.tsx': 2,
  'ui/pages/confirmations/components/simulation-error-message/simulation-error-message.test.js': 2,
  'ui/pages/confirmations/components/transaction-detail/transaction-detail.component.test.js': 2,
  'ui/pages/keychains/reveal-seed.test.js': 2,
  'ui/pages/multichain-accounts/multichain-account-details-page/multichain-account-details-page.test.tsx': 2,
  'ui/pages/onboarding-flow/onboarding-flow.test.tsx': 2,
  'ui/pages/settings/settings.test.js': 2,
  'ui/components/app/alert-system/alert-modal/alert-modal.test.tsx': 1,
  'ui/components/app/create-new-vault/create-new-vault.test.js': 1,
  'ui/components/app/modals/keyring-snap-removal-modal/keyring-snap-removal-result-modal.test.tsx': 1,
  'ui/components/app/multi-rpc-edit-modal/multi-rpc-edit-modal.test.tsx': 1,
  'ui/components/app/multi-rpc-edit-modal/network-list-item/network-list-item.test.tsx': 1,
  'ui/components/app/name/name-details/name-details.test.tsx': 1,
  'ui/components/app/perps/order-entry/components/leverage-slider/leverage-slider.test.tsx': 1,
  'ui/components/app/rewards/RewardsErrorBanner.test.tsx': 1,
  'ui/components/app/snaps/snap-permission-adapter/snap-permission-adapter.test.js': 1,
  'ui/components/app/snaps/snap-permission-cell/snap-permission-cell.test.js': 1,
  'ui/components/app/snaps/snap-permissions-list/snap-permissions-list.test.js': 1,
  'ui/components/app/snaps/snap-ui-renderer/snap-ui-renderer.test.js': 1,
  'ui/components/app/transaction-list-item-details/transaction-list-item-details.component.test.js': 1,
  'ui/components/component-library/modal/modal.test.tsx': 1,
  'ui/components/multichain-accounts/address-qr-code-modal/address-qr-code-modal.test.tsx': 1,
  'ui/components/multichain-accounts/multichain-account-menu/multichain-account-menu.test.tsx': 1,
  'ui/components/multichain-accounts/smart-contract-account-toggle-section/smart-contract-account-toggle-section.test.tsx': 1,
  'ui/components/multichain-accounts/smart-contract-account-toggle/smart-contract-account-toggle.test.tsx': 1,
  'ui/components/multichain/account-details/account-details-display.test.tsx': 1,
  'ui/components/multichain/account-menu/account-menu.test.tsx': 1,
  'ui/components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal.test.tsx': 1,
  'ui/components/multichain/connected-site-popover/connected-site-popover.test.tsx': 1,
  'ui/components/ui/form-combo-field/form-combo-field.test.tsx': 1,
  'ui/components/ui/page-container/page-container-header/page-container-header.test.js': 1,
  'ui/pages/confirmations/components/activity/transaction-details-modal/transaction-details-modal.test.tsx': 1,
  'ui/pages/confirmations/components/advanced-gas-fee-popover/advanced-gas-fee-popover.test.js': 1,
  'ui/pages/confirmations/components/confirm/info/approve/approve-details/approve-details.test.tsx': 1,
  'ui/pages/confirmations/components/confirm/info/approve/approve.test.tsx': 1,
  'ui/pages/confirmations/components/confirm/info/shared/gas-fees-details/gas-fees-details.test.tsx': 1,
  'ui/pages/confirmations/components/confirm/info/shared/transaction-details/transaction-details.test.tsx': 1,
  'ui/pages/confirmations/components/confirm/info/token-transfer/token-details-section.test.tsx': 1,
  'ui/pages/confirmations/components/confirm/info/typed-sign/typed-sign-v4-simulation/permit-simulation/permit-simulation.test.tsx': 1,
  'ui/pages/confirmations/components/confirm/ledger-info/ledger-info.test.tsx': 1,
  'ui/pages/confirmations/components/confirm/smart-account-tab/account-network/account-network.test.tsx': 1,
  'ui/pages/confirmations/components/confirm/smart-account-update/smart-account-update-success.test.tsx': 1,
  'ui/pages/confirmations/components/confirm/smart-account-update/smart-account-update.test.tsx': 1,
  'ui/pages/confirmations/components/gas-estimate-list-item/gas-estimate-list-item.test.tsx': 1,
  'ui/pages/confirmations/components/gas-price-input/gas-price-input.test.tsx': 1,
  'ui/pages/confirmations/components/max-base-fee-input/max-base-fee-input.test.tsx': 1,
  'ui/pages/confirmations/components/priority-fee-input/priority-fee-input.test.tsx': 1,
  'ui/pages/confirmations/confirmation/templates/switch-ethereum-chain.test.js': 1,
  'ui/pages/create-account/connect-hardware/account-list.test.js': 1,
  'ui/pages/multichain-accounts/multichain-account-address-list-page/multichain-account-address-list-page.test.tsx': 1,
  'ui/pages/onboarding-flow/recovery-phrase/review-recovery-phrase.test.tsx': 1,
  'ui/pages/onboarding-flow/welcome/welcome-login.test.tsx': 1,
  'ui/pages/settings/networks-tab/networks-form/networks-form.test.js': 1,
  'ui/pages/settings/security-tab/delete-metametrics-data-button/delete-metametrics-data-button.test.tsx': 1,
  'ui/pages/unlock-page/unlock-page.test.tsx': 1,
};

function findRule2Violations(
  filePath: string,
  lines: string[],
): Violation[] {
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    let match;
    HARDCODED_QUERY_PATTERN.lastIndex = 0;
    while ((match = HARDCODED_QUERY_PATTERN.exec(lines[i])) !== null) {
      const hardcodedValue = match[1];

      if (IGNORED_STRINGS.has(hardcodedValue)) {
        continue;
      }

      const messageKey = localeValueToKey.get(hardcodedValue);
      if (messageKey) {
        violations.push({
          file: filePath,
          line: i + 1,
          rule: 'Rule 2',
          message:
            `Query uses hardcoded string "${hardcodedValue}" which matches ` +
            `locale key "${messageKey}".\n` +
            `    Fix: use messages.${messageKey}.message instead of "${hardcodedValue}".`,
        });
      }
    }
  }

  return violations;
}

// --- Test runner ---

describe('Locale query mismatch fitness function', () => {
  it('should not use messages.xxx.message to query hardcoded JSX text (Rule 1)', () => {
    const testFiles = glob.sync('ui/**/*.test.{ts,tsx,js,jsx}', {
      cwd: path.resolve(__dirname, '../..'),
      absolute: true,
    });

    const allViolations: Violation[] = [];

    for (const filePath of testFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!MESSAGES_IMPORT_PATTERN.test(content)) {
        continue;
      }
      const lines = content.split('\n');
      const violations = findRule1Violations(filePath, lines);
      allViolations.push(...violations);
    }

    if (allViolations.length > 0) {
      const report = formatReport(allViolations);
      throw new Error(
        `Found ${allViolations.length} Rule 1 violation(s) — ` +
          `hardcoded JSX text queried via messages.xxx.message:\n\n${report}`,
      );
    }
  });

  it('should not use hardcoded strings that match locale values (Rule 2)', () => {
    const rootDir = path.resolve(__dirname, '../..');
    const testFiles = glob.sync('ui/**/*.test.{ts,tsx,js,jsx}', {
      cwd: rootDir,
      absolute: true,
    });

    const newViolations: Violation[] = [];

    for (const filePath of testFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const violations = findRule2Violations(filePath, lines);

      // Check against baseline — only flag violations above the allowed count
      const relPath = path.relative(rootDir, filePath);
      const baselineCount = RULE_2_BASELINE[relPath] ?? 0;

      if (violations.length > baselineCount) {
        // Only report the NEW violations (count above baseline)
        const newCount = violations.length - baselineCount;
        newViolations.push(...violations.slice(violations.length - newCount));
      }
    }

    if (newViolations.length > 0) {
      const report = formatReport(newViolations);
      throw new Error(
        `Found ${newViolations.length} NEW Rule 2 violation(s) — ` +
          `hardcoded query strings matching locale values:\n\n${report}\n\n` +
          `Prefer messages.xxx.message over hardcoded strings so tests ` +
          `stay in sync with translations.\n` +
          `(Pre-existing violations are tracked in RULE_2_BASELINE.)`,
      );
    }
  });
});

function formatReport(violations: Violation[]): string {
  return violations
    .map(
      (v) =>
        `  ${path.relative(path.resolve(__dirname, '../..'), v.file)}:${v.line} [${v.rule}]\n` +
        `    ${v.message}`,
    )
    .join('\n\n');
}

#!/usr/bin/env bash
set -euo pipefail

UMB=origin/refactor/analytics-migrate-events
CLEAN=origin/refactor/analytics-migrate-cleanup
UMB_PR=43885

pr_body() {
  local item="$1"
  local domain="$2"
  cat <<EOF
## **Description**

Migrates remaining legacy \`MetaMetricsContext.trackEvent\` / \`trackMetaMetricsEvent\` call sites in the **${domain}** domain to \`useAnalytics()\` + \`createEventBuilder\` (or \`trackAnalyticsEvent\` for Redux thunks).

Part of umbrella tracker #${UMB_PR} (**${item}**).

## **Changelog**

CHANGELOG entry: null

## **Related issues**

Fixes:

## **Manual testing steps**

1. Build and load the extension (\`yarn start\`).
2. Exercise the flows touched by this PR (see changed files).
3. With MetaMetrics debug enabled, confirm events still fire with the same names and properties.

<!--
## **Screenshots/Recordings**
### **Before**
### **After**
-->

## **Pre-merge author checklist**

- [ ] I've followed [MetaMask Contributor Docs](https://github.com/MetaMask/contributor-docs) and [MetaMask Extension Coding Standards](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/CODING_GUIDELINES.md).
- [ ] I've completed the PR template to the best of my ability
- [ ] I've included tests if applicable
- [ ] I've documented my code using [JSDoc](https://jsdoc.app/) format if applicable
- [ ] I've applied the right labels on the PR (see [labeling guidelines](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/LABELING_GUIDELINES.md)). Not required for external contributors.

## **Pre-merge reviewer checklist**

- [ ] I've manually tested the PR (e.g. pull and build branch, run the app, test code being changed).
- [ ] I confirm that this PR addresses all acceptance criteria described in the ticket it closes and includes the necessary testing evidence such as recordings and or screenshots.
EOF
}

create_and_push_pr() {
  local branch="$1"
  local title="$2"
  local item="$3"
  local domain="$4"

  git add -A
  git commit -m "$(cat <<EOF
${title}

Part of analytics migration umbrella #${UMB_PR} (${item}).
EOF
)"
  git push -u origin "$branch" --force-with-lease

  gh pr create \
    --draft \
    --base main \
    --head "$branch" \
    --title "$title" \
    --body "$(pr_body "$item" "$domain")"
}

# --- 15a: UX contacts + chrome modals ---
git checkout -B refactor/analytics-migrate-orphan-ux-contacts-chrome origin/main
git checkout "$UMB" -- \
  ui/pages/contacts/components/add-contact-form.tsx \
  ui/pages/contacts/components/edit-contact-form.tsx \
  ui/pages/contacts/contact-details-page.tsx \
  ui/pages/contacts/contacts-list-page.tsx \
  ui/components/app/modals/pna25-modal/pna25-modal.tsx \
  ui/components/app/modals/pna25-modal/pna25-modal.test.tsx \
  ui/components/app/update-modal/update-modal.tsx \
  ui/components/app/update-modal/update-modal.test.tsx \
  ui/components/app/password-outdated-modal/password-outdated-modal.tsx \
  ui/components/app/password-outdated-modal/password-outdated-modal.test.tsx \
  ui/components/app/terms-of-use-popup/terms-of-use-popup-container.tsx \
  ui/components/app/terms-of-use-popup/terms-of-use-popup.js \
  ui/components/app/permission-page-container/permission-page-container.component.js \
  ui/components/app/product-safety/scam-questionnaire/useScamQuestionnaireMetrics.ts \
  ui/components/app/multichain-transaction-details-modal/multichain-transaction-details-modal.tsx \
  ui/components/app/multichain-transaction-details-modal/multichain-transaction-details-modal.test.tsx \
  ui/components/ui/qr-code-view/qr-code-view.tsx \
  ui/components/multichain/account-overview/carousel.tsx \
  ui/components/multichain/account-overview/carousel.test.tsx
create_and_push_pr \
  refactor/analytics-migrate-orphan-ux-contacts-chrome \
  "refactor(analytics): migrate orphan UX contacts and chrome events" \
  "15a · UX contacts + chrome" \
  "UX (contacts, modals, carousel, permission page)"

# --- 15b: account overview tabs ---
git checkout -B refactor/analytics-migrate-orphan-ux-account-tabs origin/main
git checkout "$UMB" -- \
  ui/components/multichain/account-overview/account-overview-tabs.tsx \
  ui/components/multichain/account-overview/account-overview-tabs.test.tsx
create_and_push_pr \
  refactor/analytics-migrate-orphan-ux-account-tabs \
  "refactor(analytics): migrate orphan account overview tabs events" \
  "15b · UX account tabs" \
  "UX (account overview tabs)"

# --- 15c: accounts multichain UI ---
git checkout -B refactor/analytics-migrate-orphan-accounts-multichain origin/main
git checkout "$UMB" -- \
  ui/components/multichain/account-details/account-details-display.js \
  ui/components/multichain/account-details/account-details-section.tsx \
  ui/components/multichain/account-details/account-details.tsx \
  ui/components/multichain/account-list-item/account-list-item.js \
  ui/components/multichain/import-account/import-account.js \
  ui/components/multichain/import-nfts-modal/import-nfts-modal.js
create_and_push_pr \
  refactor/analytics-migrate-orphan-accounts-multichain \
  "refactor(analytics): migrate orphan multichain accounts UI events" \
  "15c · Accounts multichain UI" \
  "Accounts (account details, import account/NFTs)"

# --- 15d: Web3Auth onboarding gaps ---
git checkout -B refactor/analytics-migrate-orphan-web3auth origin/main
git checkout "$UMB" -- \
  ui/pages/onboarding-flow/recovery-phrase/reveal-recovery-phrase.tsx \
  ui/components/app/change-password/change-password.tsx \
  ui/components/app/basic-configuration-modal/basic-configuration-modal.tsx \
  ui/components/app/passkey-troubleshoot-modal/passkey-troubleshoot-modal.tsx \
  ui/components/app/metametrics-consent/metametrics-consent-container.tsx
create_and_push_pr \
  refactor/analytics-migrate-orphan-web3auth \
  "refactor(analytics): migrate orphan Web3Auth onboarding events" \
  "15d · Web3Auth onboarding gaps" \
  "Web3Auth (recovery phrase, passkey, consent, password)"

# --- 15e: Platform metrics UI ---
git checkout -B refactor/analytics-migrate-orphan-platform-ui origin/main
git checkout "$UMB" -- \
  ui/hooks/useABTest.ts \
  ui/hooks/useABTest.test.ts
git checkout "$CLEAN" -- \
  ui/components/app/metametrics-toggle/metametrics-toggle.tsx \
  ui/components/app/metametrics-toggle/metametrics-toggle.test.tsx \
  ui/components/app/clear-metametrics-data/clear-metametrics-data.tsx \
  ui/components/app/clear-metametrics-data/clear-metametrics-data.test.tsx \
  ui/components/app/delete-metametrics-data-button/delete-metametrics-data-button.test.tsx \
  ui/__mocks__/actions.js
create_and_push_pr \
  refactor/analytics-migrate-orphan-platform-ui \
  "refactor(analytics): migrate orphan platform metrics UI events" \
  "15e · Platform metrics UI" \
  "Platform (metametrics toggle, clear data, A/B test hook)"

# --- 15g: Settings Redux thunks ---
git checkout -B refactor/analytics-migrate-orphan-settings-actions origin/main
python3 <<'PY'
from pathlib import Path

path = Path("ui/store/actions.ts")
text = path.read_text()

old_import = "import type {\n  AnalyticsEvent,\n  AnalyticsEventBuildOptions,\n} from '../../shared/lib/analytics/create-event-builder';"
new_import = "import {\n  createEventBuilder,\n  type AnalyticsEvent,\n  type AnalyticsEventBuildOptions,\n} from '../../shared/lib/analytics/create-event-builder';"
if old_import not in text:
    raise SystemExit("Expected analytics import block not found")
text = text.replace(old_import, new_import, 1)

old_dismiss = """    trackMetaMetricsEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        dismiss_smt_acc_suggestion_enabled: value,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        prev_dismiss_smt_acc_suggestion_enabled:
          prevDismissSmartAccountSuggestionEnabled,
      },
    });"""

new_dismiss = """    trackAnalyticsEvent(
      createEventBuilder(MetaMetricsEventName.SettingsUpdated)
        .addCategory(MetaMetricsEventCategory.Settings)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          dismiss_smt_acc_suggestion_enabled: value,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          prev_dismiss_smt_acc_suggestion_enabled:
            prevDismissSmartAccountSuggestionEnabled,
        })
        .build(),
    );"""

old_stx = """    trackMetaMetricsEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        stx_opt_in: value,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        prev_stx_opt_in: smartTransactionsOptInStatus,
      },
    });"""

new_stx = """    trackAnalyticsEvent(
      createEventBuilder(MetaMetricsEventName.SettingsUpdated)
        .addCategory(MetaMetricsEventCategory.Settings)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          stx_opt_in: value,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          prev_stx_opt_in: smartTransactionsOptInStatus,
        })
        .build(),
    );"""

if old_dismiss not in text or old_stx not in text:
    raise SystemExit("Expected settings thunk trackMetaMetricsEvent blocks not found")

text = text.replace(old_dismiss, new_dismiss, 1).replace(old_stx, new_stx, 1)
path.write_text(text)
PY
create_and_push_pr \
  refactor/analytics-migrate-orphan-settings-actions \
  "refactor(analytics): migrate settings thunk MetaMetrics events" \
  "15g · Settings Redux thunks" \
  "Settings (smart account suggestion and smart transactions opt-in thunks)"

# --- 15f: Platform background cleanup (merge last) ---
git checkout -B refactor/analytics-migrate-orphan-platform-background origin/main
git checkout "$UMB" -- \
  app/scripts/controllers/metametrics-controller-method-action-types.ts \
  app/scripts/controllers/metametrics-controller.test.ts \
  app/scripts/controllers/metametrics-controller.ts \
  app/scripts/messenger-client-init/messengers/accounts/snap-keyring-builder-messenger.ts \
  app/scripts/messenger-client-init/messengers/legacy-background-api-service-messenger.ts \
  app/scripts/messenger-client-init/messengers/snaps/snap-controller-messenger.ts \
  app/scripts/messenger-client-init/messengers/token-detection-controller-messenger.ts \
  app/scripts/messenger-client-init/token-detection-controller-init.ts \
  app/scripts/metamask-controller.js \
  app/scripts/services/legacy-background-api-service.test.ts \
  app/scripts/services/legacy-background-api-service.ts \
  app/scripts/services/subscription/types.ts \
  docs/ab-testing.md
create_and_push_pr \
  refactor/analytics-migrate-orphan-platform-background \
  "refactor(analytics): remove MetaMetricsController shims and finish background migration" \
  "15f · Platform background cleanup" \
  "Platform background (MetaMetricsController cleanup, token detection, legacy API)"

echo "All orphan sub-PRs created."

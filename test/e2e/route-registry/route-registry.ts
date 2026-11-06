/**
 * Route Page Object Registry
 *
 * Maps each route in `ROUTES` (ui/helpers/constants/routes.ts) to the E2E
 * page object for the screen it renders, or to `null` when there is no page
 * object for it yet. The route coverage report
 * (test/e2e/scripts/route-coverage-report.ts) compares this registry with
 * `ROUTES` and lists routes with a page object, routes without one, routes
 * missing from the registry and registry entries for routes that no longer
 * exist.
 *
 * Keys are route path patterns exactly as they appear in `ROUTES`. They are
 * plain strings on purpose so renaming or removing a route never breaks the
 * build; route-registry.test.ts fails instead and lists the paths to fix.
 *
 * When you add, rename or remove a route, update this registry too: use its
 * page object if there is one, otherwise `null`.
 */

import AccountAddressListPage from '../page-objects/pages/accounts/address-list-page';
import AccountDetailsPage from '../page-objects/pages/accounts/details-page';
import AccountListPage from '../page-objects/pages/accounts/list-page';
import PrivateKeyModal from '../page-objects/pages/accounts/private-key-modal';
import WalletDetailsPage from '../page-objects/pages/accounts/wallet-details-page';
import AssetDetailsPage from '../page-objects/pages/asset/asset-details';
import DeFiDetailsPage from '../page-objects/pages/asset/defi-details-page';
import ImportNftPage from '../page-objects/pages/asset/import-nft-page';
import BridgeQuotePage from '../page-objects/pages/bridge/quote-page';
import AddTokenConfirmation from '../page-objects/pages/confirmations/add-token-confirmations';
import Confirmation from '../page-objects/pages/confirmations/confirmation';
import ConnectAccountConfirmation from '../page-objects/pages/confirmations/connect-account-confirmation';
import DecryptMessageConfirmation from '../page-objects/pages/confirmations/decrypt-message-confirmation';
import GetEncryptionKeyConfirmation from '../page-objects/pages/confirmations/get-encryption-key-confirmation';
import ConnectHardwareWalletPage from '../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import HardwareWalletSignaturesPage from '../page-objects/pages/hardware-wallet/hardware-wallet-signatures-page';
import ActivityTab from '../page-objects/pages/home/activity-tab';
import HomePage from '../page-objects/pages/home/homepage';
import { PerpsTab } from '../page-objects/pages/home/perps-tab';
import MoneyHomePage from '../page-objects/pages/money/money-home-page';
import MoneyTransactionDetailsPage from '../page-objects/pages/money/money-transaction-details-page';
import NetworksPage from '../page-objects/pages/networks/networks-page';
import NotificationDetailsPage from '../page-objects/pages/notifications/notification-details-page';
import NotificationsListPage from '../page-objects/pages/notifications/notifications-list-page';
import LoginPage from '../page-objects/pages/onboarding/login-page';
import OnboardingCompletePage from '../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../page-objects/pages/onboarding/onboarding-password-page';
import OnboardingPrivacySettingsPage from '../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import OnboardingSrpPage from '../page-objects/pages/onboarding/onboarding-srp-page';
import ResetPasswordPage from '../page-objects/pages/onboarding/reset-password-page';
import SecureWalletPage from '../page-objects/pages/onboarding/secure-wallet-page';
import SetupPasskeyPage from '../page-objects/pages/onboarding/setup-passkey-page';
import StartOnboardingPage from '../page-objects/pages/onboarding/start-onboarding-page';
import GatorPermissionsPage from '../page-objects/pages/permission/gator-permissions-page';
import PermissionListPage from '../page-objects/pages/permission/permission-list-page';
import { PerpsActivityPage } from '../page-objects/pages/perps/perps-activity-page';
import { PerpsMarketDetailPage } from '../page-objects/pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../page-objects/pages/perps/perps-market-list-page';
import { PerpsOrderEntryPage } from '../page-objects/pages/perps/perps-order-entry-page';
import { PerpsWithdrawPage } from '../page-objects/pages/perps/perps-withdraw-page';
import DeepLink from '../page-objects/pages/security/deep-link-page';
import SendPage from '../page-objects/pages/send/send-page';
import AboutPage from '../page-objects/pages/settings/about-page';
import BackupAndSyncSettings from '../page-objects/pages/settings/backup-and-sync-settings';
import BasicFunctionalityOffPage from '../page-objects/pages/settings/basic-functionality-off-page';
import ChangePasswordPage from '../page-objects/pages/settings/change-password-page';
import ContactsSettings from '../page-objects/pages/settings/contacts-settings';
import DebugOptions from '../page-objects/pages/settings/debug-page';
import ExperimentalSettings from '../page-objects/pages/settings/experimental-settings';
import NotificationsSettingsPage from '../page-objects/pages/settings/notifications-settings-page';
import PreferencesAndDisplaySettings from '../page-objects/pages/settings/preferences-and-display-settings';
import PrivacySettings from '../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../page-objects/pages/settings/settings-page';
import ShieldClaimPage from '../page-objects/pages/settings/shield/shield-claim-page';
import ShieldClaimsListPage from '../page-objects/pages/settings/shield/shield-claims-list-page';
import ShieldDetailPage from '../page-objects/pages/settings/shield/shield-detail-page';
import ShieldPlanPage from '../page-objects/pages/settings/shield/shield-plan-page';
import SyncAccountsSettingsPage from '../page-objects/pages/settings/sync-accounts-settings-page';
import TransactionsSettingsPage from '../page-objects/pages/settings/transactions-settings';
import SnapListPage from '../page-objects/pages/snaps/list-page';
import CustomTokenImportPage from '../page-objects/pages/token-management/custom-token-import-page';
import TokenManagementPage from '../page-objects/pages/token-management/token-management-page';
import TransactionDetailsPage from '../page-objects/pages/transaction-details-page';
import type { Driver } from '../webdriver/driver';

/** An E2E page object class, constructed with the driver. */
export type PageObjectClass = new (driver: Driver) => object;

/** Route path pattern → its page object, or `null` when there is none yet. */
export type RoutePageObjectRegistry = Record<string, PageObjectClass | null>;

export const ROUTE_PAGE_OBJECT_REGISTRY: RoutePageObjectRegistry = {
  // Home and wallet
  '/': HomePage,
  '': HomePage,
  '/activity': ActivityTab,
  '/tx/:caipChainId/:txIdentifier': TransactionDetailsPage,
  '/unlock': LoginPage,
  '/lock': null,
  '/rewards': null,
  '/link': DeepLink,
  '/basic-functionality-off': BasicFunctionalityOffPage,
  '/restore-vault': ResetPasswordPage,
  '/seed': null,
  '/seed/:keyringId': null,
  '/import-srp': null,
  '/discover-search': null,
  '/hardware-wallet-repair': null,
  '/shield-plan': ShieldPlanPage,
  '/initialize/experimental-area': null,

  // Money
  '/money-home': MoneyHomePage,
  '/money-home/how-it-works': null,
  '/money-home/activity/:transactionId': MoneyTransactionDetailsPage,
  '/money-home/earn': null,
  '/musd': null,
  '/musd/education': null,

  // Perps
  '/perps-home': PerpsTab,
  '/perps': null,
  '/perps/market-list': PerpsMarketListPage,
  '/perps/market/:symbol': PerpsMarketDetailPage,
  '/perps/trade/:symbol': PerpsOrderEntryPage,
  '/perps/activity': PerpsActivityPage,
  '/perps/transaction-details': null,
  '/perps/withdraw': PerpsWithdrawPage,

  // Accounts
  '/account-list': AccountListPage,
  '/multichain-account-details': AccountDetailsPage,
  '/multichain-wallet-details-page': WalletDetailsPage,
  '/choose-new-wallet-type': null,
  '/add-wallet-page': null,
  '/multichain-smart-account/:address': null,
  '/multichain-account-address-list': AccountAddressListPage,
  '/multichain-account-private-key-list': PrivateKeyModal,
  '/new-account': null,
  '/new-account/connect': ConnectHardwareWalletPage,
  '/sync-accounts': SyncAccountsSettingsPage,
  '/mfa': null,

  // Assets and tokens
  '/asset/image/:asset/:id': null,
  '/asset/:chainId/:asset?/:id?': AssetDetailsPage,
  '/asset/:chainId/:asset?/:id?/security-trust': null,
  '/defi': DeFiDetailsPage,
  '/import-token': null,
  '/import-tokens': null,
  '/confirm-import-token': null,
  '/token-management': TokenManagementPage,
  '/custom-token-import': CustomTokenImportPage,
  '/import-nfts': ImportNftPage,
  '/confirm-add-suggested-token': AddTokenConfirmation,
  '/confirm-add-suggested-nft': null,
  '/batch-sell/select': null,
  '/batch-sell/review': null,

  // Ramps
  '/ramps/build-quote': null,
  '/ramps/token-selection': null,
  '/ramps/payment-method': null,
  '/ramps/complete-buy': null,

  // Send, swap and bridge
  '/send/:page?': SendPage,
  '/cross-chain/swaps/prepare-bridge-page': BridgeQuotePage,
  '/cross-chain/swaps/prepare-bridge-page/assets': null,
  '/swaps/awaiting-signatures': null,
  '/swaps/hardware-wallet-signatures': HardwareWalletSignaturesPage,
  '/remote': null,
  '/remote/setup-swaps': null,
  '/remote/setup-daily-allowance': null,

  // Confirmations
  '/confirm-transaction': Confirmation,
  '/confirm-transaction/:id': Confirmation,
  '/confirm-transaction/:id/signature-request': Confirmation,
  '/confirm-transaction/:id/decrypt-message-request':
    DecryptMessageConfirmation,
  '/confirm-transaction/:id/encryption-public-key-request':
    GetEncryptionKeyConfirmation,
  '/confirmation': null,
  '/confirmation/:id': null,

  // Permissions and connections
  '/connect/:id': ConnectAccountConfirmation,
  '/connect/:id/confirm-permissions': null,
  '/connect/:id/snaps-connect': null,
  '/connect/:id/snap-install': null,
  '/connect/:id/snap-update': null,
  '/connect/:id/snap-install-result': null,
  '/connected': null,
  '/connected/accounts': null,
  '/permissions': PermissionListPage,
  '/review-permissions': null,
  '/gator-permissions': GatorPermissionsPage,
  '/gator-permissions/token-transfer/:origin?': null,
  '/review-gator-permissions/:chainId/:permissionGroupName/:origin?': null,

  // Snaps and notifications
  '/snaps': SnapListPage,
  '/snaps/view': null,
  '/notifications': NotificationsListPage,
  '/notifications/:uuid': NotificationDetailsPage,

  // Networks and contacts
  '/networks': NetworksPage,
  '/networks/form': null,
  '/networks/add-network': null,
  '/networks/add-popular-custom-network': null,
  '/contacts': ContactsSettings,
  '/contacts/add': null,
  '/contacts/view/:chainId/:address': null,
  '/contacts/edit/:chainId/:address': null,

  // Settings
  '/settings': SettingsPage,
  '/settings-v2': null,
  '/settings/about-us': AboutPage,
  '/settings/assets': null,
  '/settings/backup-and-sync': BackupAndSyncSettings,
  '/settings/debug': DebugOptions,
  '/settings/developer-tools': null,
  '/settings/experimental': ExperimentalSettings,
  '/settings/notifications': NotificationsSettingsPage,
  '/settings/notifications/wallet-activity': null,
  '/settings/notifications/perps': null,
  '/settings/notifications/marketing': null,
  '/settings/notifications/agentic-cli': null,
  '/settings/preferences-and-display': PreferencesAndDisplaySettings,
  '/settings/preferences-and-display/currency': null,
  '/settings/preferences-and-display/theme': null,
  '/settings/preferences-and-display/language': null,
  '/settings/preferences-and-display/account-identicon': null,
  '/settings/privacy': PrivacySettings,
  '/settings/privacy/third-party-apis': null,
  '/settings/security-and-password': null,
  '/settings/security-and-password/auto-lock': null,
  '/settings/security-and-password/manage-wallet-recovery': null,
  '/settings/security-and-password/password': ChangePasswordPage,
  '/settings/security-and-password/register-passkey': null,
  '/settings/security-and-password/turn-off-passkey': null,
  '/settings/security-and-password/verification-methods': null,
  '/settings/security-and-password/verification-methods/email': null,
  '/settings/security-and-password/verification-methods/authenticator-app':
    null,
  '/settings/snap': null,
  '/settings/transactions': TransactionsSettingsPage,
  '/settings/transaction-shield': ShieldDetailPage,
  '/settings/transaction-shield/manage-plan': null,
  '/settings/transaction-shield/manage-past-plan': null,
  '/settings/transaction-shield/claims': ShieldClaimsListPage,
  '/settings/transaction-shield/claims/new-claim': ShieldClaimPage,
  '/settings/transaction-shield/claims/edit-draft': null,
  '/settings/transaction-shield/claims/view-pending-claim': null,
  '/settings/transaction-shield/claims/view-history-claim': null,

  // Onboarding
  '/onboarding': null,
  '/onboarding/welcome': StartOnboardingPage,
  '/onboarding/create-password': OnboardingPasswordPage,
  '/onboarding/review-recovery-phrase': SecureWalletPage,
  '/onboarding/confirm-recovery-phrase': null,
  '/onboarding/reveal-recovery-phrase': null,
  '/onboarding/import-with-recovery-phrase': OnboardingSrpPage,
  '/onboarding/unlock': LoginPage,
  '/onboarding/privacy-settings': OnboardingPrivacySettingsPage,
  '/onboarding/completion': OnboardingCompletePage,
  '/onboarding/help-us-improve': null,
  '/onboarding/metametrics': OnboardingMetricsPage,
  '/onboarding/account-exist': null,
  '/onboarding/account-not-found': null,
  '/onboarding/setup-passkey': SetupPasskeyPage,
  '/onboarding/download-app': null,
  '/onboarding/experimental-area': null,
};

import {
  ACCOUNT_LIST_PAGE_ROUTE,
  ACTIVITY_ROUTE,
  ASSET_ACTIVATION_LOADER_ROUTE,
  DEFAULT_ROUTE,
  LEGACY_SETTINGS_V2_ROUTE,
  MFA_SETTINGS_EMAIL_ROUTE,
  MFA_SETTINGS_TOTP_ROUTE,
  MONEY_ACTIVITY_ROUTE,
  MONEY_DEPOSIT_ROUTE,
  MONEY_EARN_ROUTE,
  MONEY_HOME_ROUTE,
  MONEY_HOW_IT_WORKS_ROUTE,
  NOTIFICATIONS_ROUTE,
  PERPS_ACTIVITY_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
  PERPS_ORDER_ENTRY_ROUTE,
  PERPS_TRANSACTION_DETAILS_ROUTE,
  PERPS_WITHDRAW_ROUTE,
  SECURITY_PASSWORD_CHANGE_V2_ROUTE,
  SECURITY_REGISTER_PASSKEY_ROUTE,
  SEND_ROUTE,
  SETTINGS_ROUTE,
  TRANSACTION_SHIELD_CLAIM_ROUTES,
  TX_DETAILS_ROUTE,
} from '../../../helpers/constants/routes';
import { isExtensionUpdateRestingPathname } from './resting-routes';

describe('isExtensionUpdateRestingPathname', () => {
  const restingPathnames = [
    DEFAULT_ROUTE,
    ACTIVITY_ROUTE,
    `${TX_DETAILS_ROUTE}/eip155:1/0xabc`,
    '/asset/0x1/0xtoken',
    '/asset/0x1/0xtoken/1',
    '/asset/0x1/0xtoken/1/security-trust',
    '/asset/image/0xtoken/1',
    SETTINGS_ROUTE,
    `${SETTINGS_ROUTE}/privacy`,
    LEGACY_SETTINGS_V2_ROUTE,
    ACCOUNT_LIST_PAGE_ROUTE,
    NOTIFICATIONS_ROUTE,
    `${NOTIFICATIONS_ROUTE}/notice-1`,
    PERPS_HOME_PAGE_ROUTE,
    `${PERPS_MARKET_DETAIL_ROUTE}/ETH`,
    PERPS_MARKET_LIST_ROUTE,
    PERPS_ACTIVITY_ROUTE,
    PERPS_TRANSACTION_DETAILS_ROUTE,
    MONEY_HOME_ROUTE,
    MONEY_ACTIVITY_ROUTE,
    `${MONEY_ACTIVITY_ROUTE}/tx-1`,
    MONEY_HOW_IT_WORKS_ROUTE,
    MONEY_EARN_ROUTE,
  ];

  const activePathnames = [
    SEND_ROUTE,
    `${SEND_ROUTE}/amount`,
    `${PERPS_ORDER_ENTRY_ROUTE}/ETH`,
    PERPS_WITHDRAW_ROUTE,
    '/perps/market',
    MONEY_DEPOSIT_ROUTE,
    '/cross-chain/swaps/prepare-bridge-page',
    '/ramps/build-quote',
    '/confirmation/1',
    '/confirm-transaction',
    '/connect/1/account',
    '/import-srp',
    ASSET_ACTIVATION_LOADER_ROUTE,
    '/contacts/add',
    '/custom-token-import',
    SECURITY_PASSWORD_CHANGE_V2_ROUTE,
    SECURITY_REGISTER_PASSKEY_ROUTE,
    MFA_SETTINGS_EMAIL_ROUTE,
    MFA_SETTINGS_TOTP_ROUTE,
    TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL,
    TRANSACTION_SHIELD_CLAIM_ROUTES.EDIT_DRAFT.FULL,
  ];

  it.each(restingPathnames)('treats %s as a resting screen', (pathname) => {
    expect(isExtensionUpdateRestingPathname(pathname)).toBe(true);
  });

  it.each(activePathnames)('waits on %s', (pathname) => {
    expect(isExtensionUpdateRestingPathname(pathname)).toBe(false);
  });
});

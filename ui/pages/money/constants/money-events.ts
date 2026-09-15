import { SUPPORT_LINK } from '../../../helpers/constants/common';
import { MONEY_LANDING_URL } from './urls';

export enum MoneyScreenName {
  WalletHome = 'wallet_home',
  MoneyHome = 'money_home',
  MoneyDeposit = 'money_deposit',
  MoneyTransfer = 'money_transfer',
  MoneyActivity = 'money_activity',
  MoneyActivityDetails = 'money_activity_details',
}

export enum MoneyBottomSheetName {
  TransferMoneySheet = 'money_transfer_money_sheet',
  MoreSheet = 'money_more_sheet',
}

export enum MoneyComponentName {
  OnboardingCard = 'money_onboarding_card',
  ActivitySection = 'money_activity_section',
  ActivityListItem = 'money_activity_list_item',
  ActivityFilterAll = 'money_activity_filter_all',
  ActivityFilterDeposits = 'money_activity_filter_deposits',
  ActivityFilterTransfers = 'money_activity_filter_transfers',
  TransferMoneySheetBetweenAccounts = 'money_transfer_money_sheet_between_accounts',
  TransferMoneySheetPerpsAccount = 'money_transfer_money_sheet_perps_account',
  MoreSheetWhatYouGet = 'money_more_sheet_what_you_get',
  MoreSheetContactSupport = 'money_more_sheet_contact_support',
  WhatYouGetSection = 'money_what_you_get_section',
  BalanceCard = 'money_balance_card',
  BalanceProjection = 'money_balance_projection',
  PotentialEarningsSectionTokenRow = 'money_potential_earnings_section_token_row',
  HomeTab = 'money_home_tab',
  ActionButtonRow = 'money_action_button_row',
  More = 'money_more',
}

export enum MoneyButtonIntent {
  AddMoney = 'add_money',
  GoToMoneyHome = 'go_to_money_home',
  TransferMoney = 'transfer_money',
  LearnMore = 'learn_more',
  OpenMoreMenu = 'open_more_menu',
  ViewAll = 'view_all',
  Filter = 'filter',
}

export enum MoneyButtonType {
  Text = 'text',
  Icon = 'icon',
}

export enum MoneyTooltipName {
  MoneyBalance = 'money_balance',
  EarnOnYourCrypto = 'earn_on_your_crypto',
  Apy = 'apy',
}

export enum MoneyTooltipType {
  Info = 'info',
}

export enum MoneySurfaceType {
  Screen = 'screen',
  BottomSheet = 'bottom_sheet',
  Component = 'component',
}

export enum MoneyRedirectTargetType {
  Screen = 'screen',
  BottomSheet = 'bottom_sheet',
  ExternalBrowser = 'external_browser',
}

export const MONEY_URLS = {
  MONEY_LANDING: MONEY_LANDING_URL,
  METAMASK_SUPPORT: SUPPORT_LINK ?? 'https://support.metamask.io',
} as const;

export type MoneyUrl = (typeof MONEY_URLS)[keyof typeof MONEY_URLS];

export type MoneyRedirectTarget =
  | MoneyScreenName
  | MoneyBottomSheetName
  | MoneyUrl;

const SCREEN_TARGETS = new Set<string>(Object.values(MoneyScreenName));
const BOTTOM_SHEET_TARGETS = new Set<string>(
  Object.values(MoneyBottomSheetName),
);

export const resolveMoneyRedirectTargetType = (
  target: MoneyRedirectTarget,
): MoneyRedirectTargetType => {
  if (SCREEN_TARGETS.has(target)) {
    return MoneyRedirectTargetType.Screen;
  }
  if (BOTTOM_SHEET_TARGETS.has(target)) {
    return MoneyRedirectTargetType.BottomSheet;
  }
  return MoneyRedirectTargetType.ExternalBrowser;
};

/**
 * UI messenger type — aggregates all service events exposed to the UI.
 *
 * @see {@link https://github.com/MetaMask/metamask-extension/compare/main...messenger-ui-integration-prototype}
 */
import type { Messenger } from '@metamask/messenger';
import * as currencyRateDataService from '../../shared/messenger-config/currency-rate-data-service';

export type UIMessengerEvents = currencyRateDataService.UIEvents;

export type UIMessengerActions = never;

export type UIMessenger = Messenger<
  'UI',
  UIMessengerActions,
  UIMessengerEvents
>;

export const UI_SYNC_EVENTS = [...currencyRateDataService.UI_EVENTS] as const;

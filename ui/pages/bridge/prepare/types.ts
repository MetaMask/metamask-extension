import type { InternalAccount } from '@metamask/keyring-internal-api';
import { type BannerAlert } from '../../../components/component-library';

type BaseDestinationAccount = {
  isExternal: boolean;
  /**
   * This is used to display the account name in the account picker
   * If the account is external, this is the ENS domain name, or a placeholder label
   * If the account is internal, this is the name of the account group that the account belongs to
   */
  displayName: string;
};

/**
 * External destination accounts are accounts that are not part of the user's internal account tree
 * They are typically ENS domains or other external accounts
 * Populated by the useExternalAccountResolution hook
 */
export type ExternalDestinationAccount = Pick<
  InternalAccount,
  'address' | 'type'
> &
  BaseDestinationAccount & {
    walletName?: string;
  };

/**
 * Internal destination accounts are accounts that are part of the user's internal account tree
 * It includes internal account details and metadata appended by the bridge useDestinationAccount hook
 * Populated by the useDestinationAccount hook
 */
export type InternalDestinationAccount = InternalAccount &
  BaseDestinationAccount & {
    /**
     * This is used to display the wallet name in the account picker
     * If the account is internal, this is the name of the wallet that the account belongs to
     * If the account is external, this is not set
     */
    walletName: string;
  };

/**
 * Destination accounts are the accounts that the user can select to swap to
 * They are either internal or external accounts
 * Populated by the useDestinationAccount hook or the useExternalAccountResolution hook
 */
export type DestinationAccount =
  | InternalDestinationAccount
  | ExternalDestinationAccount;

/** An alert transformed for display purposes */
export type MinimalBridgeAlert = {
  id:
    | `token-warning-${number}`
    | 'price-impact'
    | 'tx-alert'
    | 'market-closed'
    | 'no-quotes'
    | 'insufficient-gas';
  title?: string;
  description: string;
  severity: 'warning' | 'danger';
};

export type BridgeAlert = MinimalBridgeAlert & {
  /** This indicates whether the alert should be shown during the confirmation flow. */
  isConfirmationAlert: boolean;
  /** When shown as a BannerAlert, this indicates whether the alert can be dismissed by the user. */
  isDismissable?: boolean;
  /** If this is defined, the alert will be displayed as a BannerAlert with the props specified. */
  bannerAlertProps?: Pick<
    React.ComponentProps<typeof BannerAlert>,
    'severity' | 'actionButtonLabel' | 'actionButtonOnClick' | 'data-testid'
  >;
  /**
   * This is for the BannerAlert shown in the alert modal, which may appear when the alert modal is opened
   * from the quote card or the confirmation flow.
   */
  alertModalErrorMessage?: string;
};

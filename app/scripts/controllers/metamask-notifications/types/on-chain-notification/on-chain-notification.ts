import type { TRIGGER_TYPES } from '../../constants/notification-schema';
import type { Compute } from '../type-utils';
import type { components } from './schema';

export type Data_MetamaskSwapCompleted =
  components['schemas']['Data_MetamaskSwapCompleted'];
export type Data_LidoStakeReadyToBeWithdrawn =
  components['schemas']['Data_LidoStakeReadyToBeWithdrawn'];
export type Data_LidoStakeCompleted =
  components['schemas']['Data_LidoStakeCompleted'];
export type Data_LidoWithdrawalRequested =
  components['schemas']['Data_LidoWithdrawalRequested'];
export type Data_LidoWithdrawalCompleted =
  components['schemas']['Data_LidoWithdrawalCompleted'];
export type Data_RocketPoolStakeCompleted =
  components['schemas']['Data_RocketPoolStakeCompleted'];
export type Data_RocketPoolUnstakeCompleted =
  components['schemas']['Data_RocketPoolUnstakeCompleted'];
export type Data_ETHSent = components['schemas']['Data_ETHSent'];
export type Data_ETHReceived = components['schemas']['Data_ETHReceived'];
export type Data_ERC20Sent = components['schemas']['Data_ERC20Sent'];
export type Data_ERC20Received = components['schemas']['Data_ERC20Received'];
export type Data_ERC721Sent = components['schemas']['Data_ERC721Sent'];
export type Data_ERC721Received = components['schemas']['Data_ERC721Received'];

type Notification = components['schemas']['Notification'];
type NotificationDataKinds = NonNullable<Notification['data']>['kind'];
type ConvertToEnum<Kind> = {
  [K in TRIGGER_TYPES]: Kind extends `${K}` ? K : never;
}[TRIGGER_TYPES];

/**
 * Type-Computation.
 * 1. Adds a `type` field to the notification, it converts the schema type into the ENUM we use.
 * 2. It ensures that the `data` field is the correct Notification data for this `type`
 * - The `Compute` utility merges the intersections (`&`) for a prettier type.
 */
export type OnChainRawNotification = {
  [K in NotificationDataKinds]: Compute<
    Omit<Notification, 'data'> & {
      type: ConvertToEnum<K>;
      data: Extract<Notification['data'], { kind: K }>;
    }
  >;
}[NotificationDataKinds];

export type OnChainRawNotificationsWithNetworkFields = Extract<
  OnChainRawNotification,
  { data: { network_fee: unknown } }
>;

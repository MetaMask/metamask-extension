import { NotificationServicesController } from '@metamask/notification-services-controller';
import type { NotificationComponent } from './types/notifications/notifications';
import { components as ERC20SentReceivedComponents } from './erc20-sent-received/erc20-sent-received';
import { components as ERC721SentReceivedComponents } from './erc721-sent-received/erc721-sent-received';
import { components as ERC1155SentReceivedComponents } from './erc1155-sent-received/erc1155-sent-received';
import { components as EthSentReceivedComponents } from './eth-sent-received/eth-sent-received';
import { components as FeatureAnnouncementComponents } from './feature-announcement/feature-announcement';
import { components as StakeComponents } from './stake/stake';
import { components as SwapCompletedComponents } from './swap-completed/swap-completed';
import { components as LidoWithdrawalRequestedComponents } from './lido-withdrawal-requested/lido-withdrawal-requested';
import { components as LidoStakeReadyToBeWithdrawnComponents } from './lido-stake-ready-to-be-withdrawn/lido-stake-ready-to-be-withdrawn';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;
type TRIGGER_TYPES = NotificationServicesController.Constants.TRIGGER_TYPES;

/**
 * Each notification component has a specific shape it follows.
 * however for interface consistency (and prevent intersections that cause `never` parameters), we are widening each notification component to a generic notification
 *
 * This does mean that you MUST check the guardFn before using a specific notification
 *
 * @param components - a specific set of notification components
 * @returns a generic set of notification component
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expandComponentsType = <C extends NotificationComponent<any>>(
  components: C,
) => components as NotificationComponent;

export const NotificationComponents = {
  [TRIGGER_TYPES.ERC20_SENT]: expandComponentsType(ERC20SentReceivedComponents),
  [TRIGGER_TYPES.ERC20_RECEIVED]: expandComponentsType(
    ERC20SentReceivedComponents,
  ),
  [TRIGGER_TYPES.ERC721_SENT]: expandComponentsType(
    ERC721SentReceivedComponents,
  ),
  [TRIGGER_TYPES.ERC721_RECEIVED]: expandComponentsType(
    ERC721SentReceivedComponents,
  ),
  [TRIGGER_TYPES.ERC1155_SENT]: expandComponentsType(
    ERC1155SentReceivedComponents,
  ),
  [TRIGGER_TYPES.ERC1155_RECEIVED]: expandComponentsType(
    ERC1155SentReceivedComponents,
  ),
  [TRIGGER_TYPES.ETH_SENT]: expandComponentsType(EthSentReceivedComponents),
  [TRIGGER_TYPES.ETH_RECEIVED]: expandComponentsType(EthSentReceivedComponents),
  [TRIGGER_TYPES.FEATURES_ANNOUNCEMENT]: expandComponentsType(
    FeatureAnnouncementComponents,
  ),
  [TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED]:
    expandComponentsType(StakeComponents),
  [TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED]:
    expandComponentsType(StakeComponents),
  [TRIGGER_TYPES.LIDO_STAKE_COMPLETED]: expandComponentsType(StakeComponents),
  [TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED]:
    expandComponentsType(StakeComponents),
  [TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED]: expandComponentsType(
    LidoWithdrawalRequestedComponents,
  ),
  [TRIGGER_TYPES.METAMASK_SWAP_COMPLETED]: expandComponentsType(
    SwapCompletedComponents,
  ),
  [TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN]: expandComponentsType(
    LidoStakeReadyToBeWithdrawnComponents,
  ),
};

export const hasNotificationComponents = (
  t: TRIGGER_TYPES,
): t is keyof typeof NotificationComponents => t in NotificationComponents;

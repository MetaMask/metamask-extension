import {
  defaultRewardsControllerState,
  RewardsController,
  RewardsControllerMessenger,
} from '../controllers/rewards/rewards-controller';
import { ControllerInitFunction } from './types';

/**
 * Initialize the RewardsController.
 *
 * @param request - The request object.
 * @returns The RewardsController.
 */
export const RewardsControllerInit: ControllerInitFunction<
  RewardsController,
  RewardsControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const rewardsControllerState =
    persistedState.RewardsController ?? defaultRewardsControllerState;

  const controller = new RewardsController({
    messenger: controllerMessenger,
    state: rewardsControllerState,
  });

  return { controller };
};

export { RewardsController };
export type { RewardsControllerMessenger };

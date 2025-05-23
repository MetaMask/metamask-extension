import {
  SeedlessOnboardingController,
  SeedlessOnboardingControllerMessenger,
  Web3AuthNetwork,
} from '@metamask/seedless-onboarding-controller';
import { ControllerInitFunction } from '../types';

export const SeedlessOnboardingControllerInit: ControllerInitFunction<
  SeedlessOnboardingController,
  SeedlessOnboardingControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const network = process.env.WEB3AUTH_NETWORK as Web3AuthNetwork;
  if (!network) {
    throw new Error('WEB3AUTH_NETWORK is not set in the environment');
  }

  const controller = new SeedlessOnboardingController({
    messenger: controllerMessenger,
    state: persistedState.SeedlessOnboardingController,
    network,
  });

  return {
    controller,
  };
};

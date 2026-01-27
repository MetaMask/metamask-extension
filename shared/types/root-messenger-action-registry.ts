import { AllRootMessengerActions } from '../../app/scripts/lib/messenger';

export type RootMessengerActionRegistry = {
  [Action in AllRootMessengerActions as Action['type']]: Action['handler'];
};

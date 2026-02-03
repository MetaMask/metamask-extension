import {
  AgentController,
  AgentControllerMessenger,
} from '../controllers/agent-controller';
import { ControllerInitFunction } from './types';

/**
 * Initialize the agent controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const AgentControllerInit: ControllerInitFunction<
  AgentController,
  AgentControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new AgentController({
    messenger: controllerMessenger,
    state: persistedState.AgentController,
  });

  return {
    controller,
  };
};

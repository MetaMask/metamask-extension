import {
  DataDeletionService,
  DataDeletionServiceMessenger,
} from '../services/data-deletion-service';
import { ControllerInitFunction } from './types';

export const DataDeletionServiceInit: ControllerInitFunction<
  DataDeletionService,
  DataDeletionServiceMessenger
> = ({ controllerMessenger }) => {
  const service = new DataDeletionService({
    messenger: controllerMessenger,
  });

  return {
    controller: service,
    memStateKey: null,
    persistedStateKey: null,
  };
};

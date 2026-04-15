import {
  DataDeletionService,
  DataDeletionServiceMessenger,
} from '../services/data-deletion-service';
import { MessengerClientInitFunction } from './types';

export const DataDeletionServiceInit: MessengerClientInitFunction<
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

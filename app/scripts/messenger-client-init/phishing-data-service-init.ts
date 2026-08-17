import {
  PhishingDataService,
  PhishingDataServiceMessenger,
} from '@metamask/phishing-controller';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the phishing data service, which performs all network requests
 * on behalf of the phishing controller. The service is initialized eagerly so
 * that its persisted query cache is rehydrated during startup.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const PhishingDataServiceInit: MessengerClientInitFunction<
  PhishingDataService,
  PhishingDataServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new PhishingDataService({
    messenger: controllerMessenger,
  });

  messengerClient.init();

  return {
    messengerClient,
    persistedStateKey: null,
    memStateKey: null,
  };
};

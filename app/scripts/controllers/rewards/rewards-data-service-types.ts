/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { Messenger } from '@metamask/messenger';
import { PreferencesControllerGetStateAction } from '../preferences-controller';
import { RewardsDataServiceMethodActions } from './rewards-data-service-method-action-types';

const SERVICE_NAME = 'RewardsDataService';

export type RewardsDataServiceMessenger = Messenger<
  typeof SERVICE_NAME,
  Actions | AllowedActions,
  never
>;

export type Actions = RewardsDataServiceMethodActions;

type AllowedActions = PreferencesControllerGetStateAction;

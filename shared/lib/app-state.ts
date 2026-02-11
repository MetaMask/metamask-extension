import { EnvironmentType } from '../constants/app';

export type PendingRedirectRoute = {
  path: string;
  search?: string;
  /**
   * This is used to determine if the redirect should only be applied to the set environment type.
   */
  environmentType?: EnvironmentType;
};

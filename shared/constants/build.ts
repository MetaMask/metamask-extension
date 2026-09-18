import environment from './build-environment.json';

export const ENVIRONMENT = environment;

export type MetaMaskBuildEnvironment =
  (typeof ENVIRONMENT)[keyof typeof ENVIRONMENT];

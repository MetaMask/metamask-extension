import environment from './build.json';

export const ENVIRONMENT = environment;

export type MetaMaskBuildEnvironment =
  (typeof ENVIRONMENT)[keyof typeof ENVIRONMENT];

import { Context, Environment, OnRampSdk } from '@consensys/on-ramp-sdk';

const isNotDevelopment =
  process.env.METAMASK_ENVIRONMENT !== 'development' &&
  process.env.METAMASK_ENVIRONMENT !== 'testing';

const SDK = OnRampSdk.create(
  isNotDevelopment ? Environment.Production : Environment.Development,
  Context.Extension,
  {
    verbose: !isNotDevelopment,
  },
);

export default SDK;

import { Context, Environment, OnRampSdk } from '@consensys/on-ramp-sdk';

const SDK = OnRampSdk.create(
  // TODO(wachunei): define the environment based on the build
  // isDev ? Environment.Staging : Environment.Production,
  Environment.Development,
  Context.Extension,
  {
    verbose: true,
  },
);

export default SDK;

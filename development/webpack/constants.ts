import { defineReactCompilerLoaderOption } from 'react-compiler-webpack';

export const reactCompilerOptions = {
  target: '17',
  // environment: EnvironmentConfig,
  logger: null,
  gating: null,
  // panicThreshold: PanicThresholdOptions,
  noEmit: true,
  compilationMode: 'all',
  eslintSuppressionRules: null,
  flowSuppressions: false,
  ignoreUseNoForget: false,
  sources: (filename) => {
    return (
      filename.indexOf('ui/') !== -1 &&
      filename.indexOf('ui/pages/confirmations') === -1 &&
      filename.indexOf('ui/components/app/identity') === -1
    );
  },
  enableReanimatedCheck: false,
} as const satisfies Parameters<typeof defineReactCompilerLoaderOption>[0];

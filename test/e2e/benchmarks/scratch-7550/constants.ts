import { WITH_STATE_POWER_USER } from '../utils/constants';

export const SCRATCH_7550_PRESET = 'react18ConcurrentPerf7550' as const;

export const PRE_7475_SHA = '23a9a0e2284fb7aa2e8fc51cb40553f93249ed30';

export const PRE_7476_SHA = '384fb12684915651d4a82f6344de354309a9ed01';

// 1000 tokens stopped booting within the controller wait once the live
// token/price calls this fixture makes under pass-through mocking slowed down.
// Both arms share this count, so the before/after delta stays comparable even
// though absolute values differ from the 1000-token runs.
export const WITH_STATE_POWER_USER_MANY_TOKENS = {
  ...WITH_STATE_POWER_USER,
  withErc20TokenCount: 250,
};

export const SCRATCH_7550_HARNESS_PATHS = [
  'test/e2e/benchmarks',
  'app/scripts/fixtures/generate-wallet-state.js',
  '.github/workflows/react18-concurrent-perf-7550.yml',
  'package.json',
] as const;

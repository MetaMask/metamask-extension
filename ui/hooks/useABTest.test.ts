import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';

import { MetaMetricsContext } from '../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
import type { ABTestExposureMetadata } from './useABTest';
import { clearABTestExposureTrackingForTest, useABTest } from './useABTest';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../selectors/remote-feature-flags', () => ({
  getRemoteFeatureFlags: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockTrackEvent = jest.fn().mockResolvedValue(undefined);

const mockMetaMetricsContext = {
  trackEvent: mockTrackEvent,
  bufferedTrace: jest.fn().mockResolvedValue(undefined),
  bufferedEndTrace: jest.fn(),
  onboardingParentContext: { current: null },
};

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    MetaMetricsContext.Provider,
    { value: mockMetaMetricsContext },
    children,
  );

const buttonColorVariants = {
  control: { long: 'green', short: 'red' },
  monochrome: { long: 'white', short: 'white' },
} as const;

const experimentVariants = {
  control: { buttons: [25, 50, 75, 'MAX'] },
  treatment: { buttons: [50, 75, 90, 'MAX'] },
} as const;

const inactiveAssignmentFixtures: [string, Record<string, unknown>][] = [
  ['missing flag', {}],
  ['unknown assignment', { buttonColorTest: { name: 'unknown' } }],
  [
    'unprocessed threshold array',
    {
      buttonColorTest: [
        {
          name: 'control',
          scope: { type: 'threshold', value: 0.5 },
        },
        {
          name: 'monochrome',
          scope: { type: 'threshold', value: 1 },
        },
      ],
    },
  ],
  ['empty string', { buttonColorTest: '' }],
];

const renderABTestHook = <
  TVariants extends { control: unknown } & Record<string, unknown>,
>(
  flagKey: string,
  variants: TVariants,
  exposureMetadata?: ABTestExposureMetadata<TVariants>,
) =>
  renderHook(() => useABTest(flagKey, variants, exposureMetadata), {
    wrapper,
  });

const setRemoteFeatureFlags = (flags: unknown) => {
  mockUseSelector.mockReturnValue(flags as never);
};

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useABTest', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
    mockTrackEvent.mockReset();
    mockTrackEvent.mockResolvedValue(undefined);
    clearABTestExposureTrackingForTest();
    setRemoteFeatureFlags({});
  });

  describe('variant assignment', () => {
    it('returns the assigned variant for controller object assignments', () => {
      setRemoteFeatureFlags({
        buttonColorTest: { name: 'monochrome', value: { ignored: true } },
      });

      const { result } = renderABTestHook(
        'buttonColorTest',
        buttonColorVariants,
      );

      expect(result.current.variant).toEqual({
        long: 'white',
        short: 'white',
      });
      expect(result.current.variantName).toBe('monochrome');
      expect(result.current.isActive).toBe(true);
    });

    it('returns the assigned variant for legacy string assignments', () => {
      setRemoteFeatureFlags({
        buttonColorTest: 'monochrome',
      });

      const { result } = renderABTestHook(
        'buttonColorTest',
        buttonColorVariants,
      );

      expect(result.current.variant).toEqual({
        long: 'white',
        short: 'white',
      });
      expect(result.current.variantName).toBe('monochrome');
      expect(result.current.isActive).toBe(true);
    });

    inactiveAssignmentFixtures.forEach(([description, flags]) => {
      it(`falls back to control for ${description}`, () => {
        setRemoteFeatureFlags(flags);

        const { result } = renderABTestHook(
          'buttonColorTest',
          buttonColorVariants,
        );

        expect(result.current.variant).toEqual({
          long: 'green',
          short: 'red',
        });
        expect(result.current.variantName).toBe('control');
        expect(result.current.isActive).toBe(false);
      });
    });

    it('uses the control variant even when it is not the first key', () => {
      setRemoteFeatureFlags({});

      const { result } = renderABTestHook('buttonColorTest', {
        treatment: { color: 'blue' },
        control: { color: 'green' },
      });

      expect(result.current.variant).toEqual({ color: 'green' });
      expect(result.current.variantName).toBe('control');
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('experiment exposure tracking', () => {
    it('emits Experiment Viewed with required and optional metadata', () => {
      const flagKey = 'swapsSWAPS4135AbtestNumpadQuickAmounts';
      setRemoteFeatureFlags({
        [flagKey]: { name: 'treatment' },
      });

      renderABTestHook(flagKey, experimentVariants, {
        experimentName: 'Swaps Quick Amounts',
        variationNames: {
          control: 'Control',
          treatment: 'Larger Presets',
        },
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.ExperimentViewed,
        category: MetaMetricsEventCategory.Analytics,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          experiment_id: flagKey,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          variation_id: 'treatment',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          experiment_name: 'Swaps Quick Amounts',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          variation_name: 'Larger Presets',
        },
      });
    });

    it('does not emit an exposure event for inactive assignments', () => {
      setRemoteFeatureFlags({
        swapsSWAPS4135AbtestNumpadQuickAmounts: { name: 'unknown' },
      });

      renderABTestHook(
        'swapsSWAPS4135AbtestNumpadQuickAmounts',
        experimentVariants,
      );

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });

    it('emits once per experiment and variation after a successful track', async () => {
      const flagKey = 'swapsSWAPS4135AbtestNumpadQuickAmounts';
      setRemoteFeatureFlags({
        [flagKey]: { name: 'control' },
      });

      renderABTestHook(flagKey, experimentVariants);
      await flushPromises();

      renderABTestHook(flagKey, experimentVariants);

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    });

    it('emits a new exposure event when the assigned variation changes', () => {
      const flagKey = 'swapsSWAPS4135AbtestNumpadQuickAmounts';
      let flags = {
        [flagKey]: { name: 'control' },
      };

      mockUseSelector.mockImplementation(() => flags as never);

      const { rerender } = renderABTestHook(flagKey, experimentVariants);

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);

      flags = {
        [flagKey]: { name: 'treatment' },
      };

      rerender();

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
      expect(mockTrackEvent.mock.calls[1][0]).toEqual({
        event: MetaMetricsEventName.ExperimentViewed,
        category: MetaMetricsEventCategory.Analytics,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          experiment_id: flagKey,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          variation_id: 'treatment',
        },
      });
    });

    it('does not emit duplicate exposures while the first emit is in flight', async () => {
      const flagKey = 'swapsSWAPS4135AbtestNumpadQuickAmounts';
      let resolveTrackingPromise: (() => void) | undefined;

      mockTrackEvent.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveTrackingPromise = resolve;
        }),
      );
      setRemoteFeatureFlags({
        [flagKey]: { name: 'control' },
      });

      renderABTestHook(flagKey, experimentVariants);
      renderABTestHook(flagKey, experimentVariants);

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);

      resolveTrackingPromise?.();
      await flushPromises();

      renderABTestHook(flagKey, experimentVariants);

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    });

    it('retries exposure tracking after a failed emit', async () => {
      const flagKey = 'swapsSWAPS4135AbtestNumpadQuickAmounts';

      mockTrackEvent
        .mockRejectedValueOnce(new Error('track failed'))
        .mockResolvedValue(undefined);
      setRemoteFeatureFlags({
        [flagKey]: { name: 'control' },
      });

      renderABTestHook(flagKey, experimentVariants);
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);

      await flushPromises();

      renderABTestHook(flagKey, experimentVariants);

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    });

    it('evicts the oldest tracked assignment when the cache reaches capacity', async () => {
      const unmountHooks: (() => void)[] = [];
      const flagKeys = Array.from(
        { length: 501 },
        (_, index) => `swapsSWAPS4135AbtestCapacity${index}`,
      );

      for (const flagKey of flagKeys) {
        setRemoteFeatureFlags({
          [flagKey]: { name: 'control' },
        });

        const { unmount } = renderABTestHook(flagKey, {
          control: { enabled: true },
        });

        unmountHooks.push(unmount);
      }

      expect(mockTrackEvent).toHaveBeenCalledTimes(501);

      await flushPromises();

      setRemoteFeatureFlags({
        [flagKeys[0]]: { name: 'control' },
      });

      renderABTestHook(flagKeys[0], {
        control: { enabled: true },
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(502);

      unmountHooks.forEach((unmount) => unmount());
    });
  });
});

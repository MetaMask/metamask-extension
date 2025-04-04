/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { renderHook } from '@testing-library/react-hooks';
import { Hex } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useSamplePetnamesMetrics } from './useSamplePetnamesMetrics';

// Mock the useContext hook
const mockTrackEvent = jest.fn();
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useContext: () => mockTrackEvent,
  };
});

const it = global.it as unknown as jest.It;

describe('useSamplePetnamesMetrics', () => {
  // Define the type of the hooks object to avoid 'any' type errors
  let metricsHook: ReturnType<typeof useSamplePetnamesMetrics>;

  // Helper function to verify event tracking with expected properties
  const verifyTracking = (expectedProps: Record<string, unknown>) => {
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        ...expectedProps,
      }),
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { result } = renderHook(() => useSamplePetnamesMetrics());
    metricsHook = result.current;
  });

  it('trackPetnamesFormViewed should call trackEvent with correct parameters', () => {
    metricsHook.trackPetnamesFormViewed();

    verifyTracking({
      event: MetaMetricsEventName.SampleFeatureViewed,
      category: MetaMetricsEventCategory.Wallet,
      properties: {
        component: 'petnames-form',
        feature: 'sample-petnames',
      },
    });
  });

  it.each([
    {
      desc: 'regular address',
      address: '0x1234567890abcdef1234567890abcdef12345678' as Hex,
      nameLength: 5,
      expectedPrefix: '0x1234',
      expectedSuffix: '5678',
    },
    {
      desc: 'short address',
      address: '0xabc' as Hex,
      nameLength: 3,
      expectedPrefix: '0xabc',
      expectedSuffix: 'xabc',
    },
  ])(
    'trackPetnameAdded should handle $desc correctly',
    ({ address, nameLength, expectedPrefix, expectedSuffix }) => {
      metricsHook.trackPetnameAdded(address, nameLength);

      verifyTracking({
        event: MetaMetricsEventName.SampleFeaturePetnameAdded,
        category: MetaMetricsEventCategory.Wallet,
        properties: expect.objectContaining({
          address_prefix: expectedPrefix,
          address_suffix: expectedSuffix,
          petname_length: nameLength,
        }),
      });
    },
  );

  // Test validation error scenarios

  it.each([
    { addressError: true, nameError: false, desc: 'address error only' },
    { addressError: false, nameError: true, desc: 'name error only' },
    { addressError: true, nameError: true, desc: 'both errors' },
  ])(
    'trackFormValidationError should track $desc',
    ({ addressError, nameError }) => {
      metricsHook.trackFormValidationError({ addressError, nameError });

      verifyTracking({
        event: MetaMetricsEventName.SampleFeatureFormError,
        category: MetaMetricsEventCategory.Wallet,
        properties: {
          feature: 'sample-petnames',
          error_type: 'validation',
          address_error: addressError,
          name_error: nameError,
        },
      });
    },
  );

  it.each([
    { message: 'Failed to submit form', desc: 'with error message' },
    { message: '', desc: 'with empty error message' },
  ])('trackFormSubmissionError should track $desc', ({ message }) => {
    metricsHook.trackFormSubmissionError(message);

    verifyTracking({
      properties: expect.objectContaining({
        error_message: message,
      }),
    });
  });
});

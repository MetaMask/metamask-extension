import { renderHook } from '@testing-library/react-hooks';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useSamplePetnamesMetrics } from './useSamplePetnamesMetrics';

// Mock the MetaMetricsContext
const mockTrackEvent = jest.fn();
jest.mock('../../../contexts/metametrics', () => ({
  ...jest.requireActual('../../../contexts/metametrics'),
  MetaMetricsContext: {
    Consumer: jest.fn(),
    Provider: jest.fn(),
  },
  useMetaMetricsContext: () => mockTrackEvent,
}));

describe('useSamplePetnamesMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide all required tracking functions', () => {
    const { result } = renderHook(() => useSamplePetnamesMetrics());

    expect(result.current.trackPetnamesFormViewed).toBeDefined();
    expect(result.current.trackPetnameAdded).toBeDefined();
    expect(result.current.trackFormValidationError).toBeDefined();
    expect(result.current.trackFormSubmissionError).toBeDefined();
    expect(result.current.trackFormInteraction).toBeDefined();
  });

  describe('trackPetnamesFormViewed', () => {
    it('should call trackEvent with correct parameters', () => {
      const { result } = renderHook(() => useSamplePetnamesMetrics());
      result.current.trackPetnamesFormViewed();

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.SampleFeatureViewed,
        category: MetaMetricsEventCategory.Wallet,
        properties: {
          component: 'petnames-form',
          feature: 'sample-petnames',
        },
      });
    });
  });

  describe('trackPetnameAdded', () => {
    it('should call trackEvent with correct parameters and mask address', () => {
      const { result } = renderHook(() => useSamplePetnamesMetrics());
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const nameLength = 5;

      result.current.trackPetnameAdded(testAddress, nameLength);

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.SampleFeaturePetnameAdded,
        category: MetaMetricsEventCategory.Wallet,
        properties: {
          feature: 'sample-petnames',
          action: 'add',
          petname_length: nameLength,
          address_prefix: '0x1234',
          address_suffix: '5678',
        },
      });
    });
  });

  describe('trackFormValidationError', () => {
    it('should call trackEvent with correct error parameters', () => {
      const { result } = renderHook(() => useSamplePetnamesMetrics());
      const errorTypes = {
        addressError: true,
        nameError: false,
      };

      result.current.trackFormValidationError(errorTypes);

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.SampleFeatureFormError,
        category: MetaMetricsEventCategory.Wallet,
        properties: {
          feature: 'sample-petnames',
          error_type: 'validation',
          address_error: true,
          name_error: false,
        },
      });
    });
  });

  describe('trackFormSubmissionError', () => {
    it('should call trackEvent with correct error message', () => {
      const { result } = renderHook(() => useSamplePetnamesMetrics());
      const errorMessage = 'Failed to submit form';

      result.current.trackFormSubmissionError(errorMessage);

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.SampleFeatureError,
        category: MetaMetricsEventCategory.Wallet,
        properties: {
          feature: 'sample-petnames',
          error_type: 'submission',
          error_message: errorMessage,
        },
      });
    });
  });

  describe('trackFormInteraction', () => {
    it('should call trackEvent with correct interaction type', () => {
      const { result } = renderHook(() => useSamplePetnamesMetrics());
      const interactionType = 'button_click';

      result.current.trackFormInteraction(interactionType);

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.SampleFeatureInteraction,
        category: MetaMetricsEventCategory.Wallet,
        properties: {
          feature: 'sample-petnames',
          action: interactionType,
        },
      });
    });
  });
});

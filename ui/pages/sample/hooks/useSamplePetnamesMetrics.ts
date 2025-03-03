import { useCallback, useContext } from 'react';
import { Hex } from '@metamask/utils';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

/**
 * Hook that provides tracking functions for the sample petnames feature
 *
 * @returns Object containing tracking functions for petnames actions
 */
export function useSamplePetnamesMetrics() {
  const trackEvent = useContext(MetaMetricsContext);

  /**
   * Track when the petnames form is viewed
   */
  const trackPetnamesFormViewed = useCallback(() => {
    trackEvent({
      event: MetaMetricsEventName.SampleFeatureViewed,
      category: MetaMetricsEventCategory.Wallet,
      properties: {
        component: 'petnames-form',
        feature: 'sample-petnames',
      },
    });
  }, [trackEvent]);

  /**
   * Track when a user successfully adds a petname
   *
   * @param address - The Ethereum address
   * @param nameLength - The length of the petname added
   */
  const trackPetnameAdded = useCallback(
    (address: Hex, nameLength: number) => {
      trackEvent({
        event: MetaMetricsEventName.SampleFeaturePetnameAdded,
        category: MetaMetricsEventCategory.Wallet,
        properties: {
          feature: 'sample-petnames',
          action: 'add',
          petname_length: nameLength,
          // Using only the first and last few characters of the address for privacy
          address_prefix: address.substring(0, 6),
          address_suffix: address.substring(address.length - 4),
        },
      });
    },
    [trackEvent],
  );

  /**
   * Track form validation errors
   *
   * @param errorTypes - Types of errors encountered
   */
  const trackFormValidationError = useCallback(
    (errorTypes: { addressError: boolean; nameError: boolean }) => {
      trackEvent({
        event: MetaMetricsEventName.SampleFeatureFormError,
        category: MetaMetricsEventCategory.Wallet,
        properties: {
          feature: 'sample-petnames',
          error_type: 'validation',
          address_error: errorTypes.addressError,
          name_error: errorTypes.nameError,
        },
      });
    },
    [trackEvent],
  );

  /**
   * Track form submission errors
   *
   * @param errorMessage - The error message
   */
  const trackFormSubmissionError = useCallback(
    (errorMessage: string) => {
      trackEvent({
        event: MetaMetricsEventName.SampleFeatureError,
        category: MetaMetricsEventCategory.Wallet,
        properties: {
          feature: 'sample-petnames',
          error_type: 'submission',
          error_message: errorMessage,
        },
      });
    },
    [trackEvent],
  );

  return {
    trackPetnamesFormViewed,
    trackPetnameAdded,
    trackFormValidationError,
    trackFormSubmissionError,
  };
}

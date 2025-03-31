import { useEffect } from 'react';
import { Hex } from '@metamask/utils';
import { useSamplePetnames } from '../../../ducks/sample-petnames';
import { useForm } from '../../../hooks/useForm';
import { validateAddress, validatePetname } from '../utils/petnames-utils';
import { useSamplePetnamesMetrics } from './useSamplePetnamesMetrics';
import { useSamplePerformanceTrace } from './useSamplePerformanceTrace';

export type FormValues = {
  address: Hex;
  petname: string;
};

const validateForm = (values: FormValues) => ({
  address: validateAddress(values.address),
  petname: validatePetname(values.petname),
});

/**
 * Hook that manages the pet names form state and logic
 *
 * @returns Object containing form state, handlers, and validation
 */
export function useSamplePetnamesForm() {
  const petnames = useSamplePetnames();
  const metrics = useSamplePetnamesMetrics();
  const { traceFormSubmission } = useSamplePerformanceTrace({
    componentName: 'SamplePetnamesForm',
    featureId: 'petnames-feature',
  });

  // Track when the form is viewed
  useEffect(() => {
    metrics.trackPetnamesFormViewed();
  }, [metrics]);

  const handleSubmit = async (values: FormValues) => {
    const formSubmissionTrace = traceFormSubmission();
    formSubmissionTrace.startTrace();

    // Check for validation errors first
    const validationErrors = validateForm(values);
    const hasAddressError = Boolean(validationErrors.address);
    const hasPetnameError = Boolean(validationErrors.petname);

    if (hasAddressError || hasPetnameError) {
      // Track validation errors
      metrics.trackFormValidationError({
        addressError: hasAddressError,
        nameError: hasPetnameError,
      });

      // End trace with validation errors
      formSubmissionTrace.endTrace(false, {
        reason: 'validation_error',
        hasAddressError,
        hasPetnameError,
      });

      throw new Error(
        `Validation failed: ${Object.values(validationErrors).join(', ')}`,
      );
    }

    try {
      await petnames.assignPetname(values.address, values.petname);
      metrics.trackPetnameAdded(values.address, values.petname.length);
      formSubmissionTrace.endTrace(true, {
        success: true,
        addressLength: values.address.length,
        petnameLength: values.petname.length,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to add pet name';
      metrics.trackFormSubmissionError(errorMessage);
      formSubmissionTrace.endTrace(false, {
        success: false,
        error: errorMessage,
      });
      throw error;
    }
  };

  return useForm<FormValues>({
    initialValues: {
      address: '0x',
      petname: '',
    },
    validate: validateForm,
    onSubmit: handleSubmit,
  });
}

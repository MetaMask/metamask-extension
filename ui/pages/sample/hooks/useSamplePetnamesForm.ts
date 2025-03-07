import { useEffect } from 'react';
import { Hex } from '@metamask/utils';
import { useSamplePetnamesController } from '../../../ducks/metamask/sample-petnames-controller';
import { useForm } from '../../../hooks/useForm';
import {
  validateAddress,
  validatePetname,
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../app/scripts/controllers/sample/sample-petnames-controller-utils';
import { useSamplePetnamesMetrics } from './useSamplePetnamesMetrics';
import { useSamplePerformanceTrace } from './useSamplePerformanceTrace';

type FormState = {
  address: Hex;
  petName: string;
};

const validateForm = (values: FormState) => ({
  address: validateAddress(values.address),
  petName: validatePetname(values.petName),
});

/**
 * Hook that manages the pet names form state and logic
 *
 * @returns Object containing form state, handlers, and validation
 */
export function useSamplePetnamesForm() {
  const petNames = useSamplePetnamesController();
  const metrics = useSamplePetnamesMetrics();
  const { traceFormSubmission } = useSamplePerformanceTrace({
    componentName: 'SamplePetnamesForm',
    featureId: 'petnames-feature',
  });

  // Track when the form is viewed
  useEffect(() => {
    metrics.trackPetnamesFormViewed();
  }, [metrics]);

  const handleSubmit = async (values: FormState) => {
    const formSubmissionTrace = traceFormSubmission();
    formSubmissionTrace.startTrace();

    // Check for validation errors first
    const validationErrors = validateForm(values);
    const hasAddressError = Boolean(validationErrors.address);
    const hasPetNameError = Boolean(validationErrors.petName);

    if (hasAddressError || hasPetNameError) {
      // Track validation errors
      metrics.trackFormValidationError({
        addressError: hasAddressError,
        nameError: hasPetNameError,
      });

      // End trace with validation errors
      formSubmissionTrace.endTrace(false, {
        reason: 'validation_error',
        hasAddressError,
        hasPetNameError,
      });

      throw new Error(
        `Validation failed: ${Object.values(validationErrors).join(', ')}`,
      );
    }

    try {
      await petNames.assignPetname(values.address, values.petName);
      metrics.trackPetnameAdded(values.address, values.petName.length);
      formSubmissionTrace.endTrace(true, {
        success: true,
        addressLength: values.address.length,
        petNameLength: values.petName.length,
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

  return useForm<FormState>({
    initialValues: {
      address: '0x',
      petName: '',
    },
    validate: validateForm,
    onSubmit: handleSubmit,
  });
}

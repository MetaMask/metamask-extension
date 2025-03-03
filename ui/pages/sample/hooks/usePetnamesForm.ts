import { useEffect } from 'react';
import { Hex } from '@metamask/utils';
import { usePetnames } from '../../../ducks/metamask/sample-petnames-controller';
import { useSamplePetnamesMetrics } from './useSamplePetnamesMetrics';
import { useSamplePerformanceTrace } from './useSamplePerformanceTrace';
import { useForm } from '../../../hooks/useForm';

type FormState = {
  address: Hex;
  petName: string;
};

// Validation utilities
const validateAddress = (address: string): string | undefined => {
  if (!address) {
    return 'Address is required';
  }

  if (!address.startsWith('0x') || address.length !== 42) {
    return 'Invalid Ethereum address format';
  }

  return undefined;
};

const validatePetName = (name: string): string | undefined => {
  if (!name) {
    return 'Pet name is required';
  }

  if (name.trim() === '') {
    return 'Pet name cannot be empty';
  }

  if (name.length > 32) {
    return 'Pet name must be 32 characters or less';
  }

  return undefined;
};

const validateForm = (values: FormState) => ({
  address: validateAddress(values.address),
  petName: validatePetName(values.petName),
});

/**
 * Hook that manages the pet names form state and logic
 *
 * @returns Object containing form state, handlers, and validation
 */
export function usePetnamesForm() {
  const petNames = usePetnames();
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

  const form = useForm<FormState>({
    initialValues: {
      address: '0x',
      petName: '',
    },
    validate: validateForm,
    onSubmit: handleSubmit,
  });

  return form;
}

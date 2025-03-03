import { useState, useEffect, useCallback } from 'react';

type FormStatus = 'default' | 'success' | 'error';

type ValidationErrors<T> = {
  [K in keyof T]?: string;
} & {
  form?: string;
};

type TouchedState<T> = {
  [K in keyof T]: boolean;
};

type FormConfig<T> = {
  initialValues: T;
  validate: (values: T) => ValidationErrors<T>;
  onSubmit: (values: T) => Promise<void>;
};

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: FormConfig<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<TouchedState<T>>(
    Object.keys(initialValues).reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {} as TouchedState<T>,
    ),
  );
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormStatus>('default');
  const [submissionError, setSubmissionError] = useState<string | undefined>();

  // Validate inputs on change
  useEffect(() => {
    const validationErrors = validate(values);
    setErrors(validationErrors); // Always store all validation errors

    // Reset form state when inputs change
    if (formState === 'error' || formState === 'success') {
      setFormState('default');
    }
  }, [values, formState, validate]);

  const handleInputChange = useCallback(
    (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues({
        ...values,
        [field]: e.target.value,
      });
    },
    [values],
  );

  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    // Mark all fields as touched
    setTouched(
      Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as TouchedState<T>,
      ),
    );

    const validationErrors = validate(values);
    const hasErrors = Object.values(validationErrors).some(Boolean);

    if (hasErrors) {
      setErrors(validationErrors);
      setFormState('error');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmissionError(undefined);
      await onSubmit(values);
      setFormState('success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Form submission failed';
      setSubmissionError(errorMessage);
      setFormState('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  // Calculate form validity based on current validation errors
  const isFormValid = useCallback(() => {
    const validationErrors = validate(values);
    return !Object.values(validationErrors).some(Boolean);
  }, [values, validate]);

  const getFieldProps = useCallback(
    (field: keyof T) => ({
      name: field,
      value: values[field],
      onChange: handleInputChange(field),
      onBlur: handleBlur(field),
      error: Boolean(errors[field]),
      helpText: errors[field],
      disabled: isSubmitting,
    }),
    [values, errors, isSubmitting, handleInputChange, handleBlur],
  );

  return {
    // Form state
    values,
    errors,
    isSubmitting,
    formState,
    submissionError,
    isFormValid: isFormValid(),

    // Form handlers
    handleInputChange,
    handleBlur,
    handleSubmit,
    getFieldProps,
  };
}

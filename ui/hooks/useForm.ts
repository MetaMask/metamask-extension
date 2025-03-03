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

  // Validate inputs on change, but only show errors for touched fields
  useEffect(() => {
    const validationErrors = validate(values);
    const newErrors = Object.keys(values).reduce((acc, key) => {
      if (touched[key as keyof T]) {
        acc[key as keyof T] = validationErrors[key as keyof T];
      }
      return acc;
    }, {} as ValidationErrors<T>);

    setErrors(newErrors);

    // Reset form state when inputs change
    if (formState === 'error' || formState === 'success') {
      setFormState('default');
    }
  }, [values, touched, formState, validate]);

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
      const validationErrors = validate(values);
      setErrors((prev) => ({
        ...prev,
        [field]: validationErrors[field],
      }));
    },
    [values, validate],
  );

  const handleSubmit = useCallback(async () => {
    const validationErrors = validate(values);
    const hasErrors = Object.values(validationErrors).some(Boolean);

    if (hasErrors) {
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

  const isFormValid = Object.keys(values).every(
    (key) => values[key as keyof T] && !errors[key as keyof T],
  );

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
    isFormValid,

    // Form handlers
    handleInputChange,
    handleBlur,
    handleSubmit,
    getFieldProps,
  };
}

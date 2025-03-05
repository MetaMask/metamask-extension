import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { produce } from 'immer';

type FormConfig<T> = {
  initialValues: T;
  validate: (values: T) => ValidationErrors<T>;
  onSubmit: (values: T) => Promise<void>;
};

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

type TouchedState<T> = {
  [K in keyof T]: boolean;
};

type FormState<T> = {
  values: T;
  touched: TouchedState<T>;
  fieldErrors: ValidationErrors<T>;
  formError?: string; // Single source for form-level errors
  submitStatus: SubmitStatus; // Single field for submission state
};

type FormAction<T> =
  | { type: 'SET_VALUE'; field: keyof T; value: T[keyof T] }
  | { type: 'MARK_TOUCHED'; field: keyof T }
  | { type: 'MARK_ALL_TOUCHED' }
  | { type: 'VALIDATE_FIELDS'; errors: ValidationErrors<T> }
  | { type: 'SET_FORM_ERROR'; error?: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END'; success: boolean; error?: string };

function formReducer<T extends Record<string, unknown>>(
  state: FormState<T>,
  action: FormAction<T>,
): FormState<T> {
  return produce(state, (draft: FormState<T>) => {
    switch (action.type) {
      case 'SET_VALUE':
        draft.values[action.field] = action.value;
        break;

      case 'MARK_TOUCHED':
        draft.touched[action.field] = true;
        break;

      case 'MARK_ALL_TOUCHED':
        draft.touched = Object.keys(draft.values as object).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as TouchedState<T>,
        );
        break;

      case 'VALIDATE_FIELDS':
        draft.fieldErrors = action.errors;
        break;

      case 'SET_FORM_ERROR':
        draft.formError = action.error;
        break;

      case 'SUBMIT_START':
        draft.submitStatus = 'submitting';
        draft.formError = undefined;
        break;

      case 'SUBMIT_END':
        draft.submitStatus = action.success ? 'success' : 'error';
        draft.formError = action.error;
        break;

      default:
        // No action for default case
        break;
    }
  });
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: FormConfig<T>) {
  // Initialize form state
  const initialState: FormState<T> = {
    values: initialValues,
    touched: Object.keys(initialValues).reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {} as TouchedState<T>,
    ),
    fieldErrors: {},
    formError: undefined,
    submitStatus: 'idle',
  };

  const [state, dispatch] = useReducer(formReducer<T>, initialState);
  const { values, touched, fieldErrors, formError, submitStatus } = state;

  const isSubmitting = submitStatus === 'submitting';

  // Validate inputs on change
  useEffect(() => {
    const validationErrors = validate(values);
    dispatch({ type: 'VALIDATE_FIELDS', errors: validationErrors });
  }, [values, submitStatus, validate]);

  // Create a reusable utility for field handling
  const getFieldProps = useCallback(
    (field: keyof T) => ({
      name: field,
      value: values[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        dispatch({
          type: 'SET_VALUE',
          field,
          value: e.target.value as T[keyof T],
        }),
      onBlur: () => dispatch({ type: 'MARK_TOUCHED', field }),
      error: Boolean(fieldErrors[field] && touched[field]),
      helpText: touched[field] ? fieldErrors[field] : undefined,
      disabled: isSubmitting,
    }),
    [values, fieldErrors, touched, isSubmitting],
  );

  const handleSubmit = useCallback(async () => {
    // Mark all fields as touched
    dispatch({ type: 'MARK_ALL_TOUCHED' });

    const validationErrors = validate(values);
    const hasFieldErrors = Object.values(validationErrors).some(Boolean);

    if (hasFieldErrors) {
      dispatch({ type: 'VALIDATE_FIELDS', errors: validationErrors });
      dispatch({
        type: 'SET_FORM_ERROR',
        error: 'Please fix the errors in the form',
      });
      return;
    }

    try {
      dispatch({ type: 'SUBMIT_START' });
      await onSubmit(values);
      dispatch({ type: 'SUBMIT_END', success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Form submission failed';
      dispatch({ type: 'SUBMIT_END', success: false, error: errorMessage });
    }
  }, [values, validate, onSubmit]);

  // Calculate form validity based on current validation errors
  const isFormValid = useMemo(() => {
    const validationErrors = validate(values);
    return !Object.values(validationErrors).some(Boolean);
  }, [values, validate]);

  return {
    // Form state
    values,
    fieldErrors,
    touched,
    formError,
    isSubmitting,
    isFormValid,
    submitStatus,

    // Form handlers
    handleSubmit,
    getFieldProps,
  };
}

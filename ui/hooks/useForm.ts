import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { produce } from 'immer';

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

type FormStatus = 'default' | 'success' | 'error';

// Define the form state type
type FormState<T> = {
  values: T;
  touched: TouchedState<T>;
  errors: ValidationErrors<T>;
  isSubmitting: boolean;
  formStatus: FormStatus;
  submissionError?: string;
};

function createTouchedState<T>(values: T, touched: boolean): TouchedState<T> {
  return Object.keys(values as object).reduce(
    (acc, key) => ({ ...acc, [key]: touched }),
    {} as TouchedState<T>,
  );
}

// Define the action types
type FormAction<T> =
  | { type: 'SET_VALUE'; field: keyof T; value: T[keyof T] }
  | { type: 'MARK_TOUCHED'; field: keyof T }
  | { type: 'MARK_ALL_TOUCHED' }
  | { type: 'SET_ERRORS'; errors: ValidationErrors<T> }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'RESET_FORM_STATUS' };

// Define the reducer function using Immer for cleaner state updates
function formReducer<T extends Record<string, unknown>>(
  state: FormState<T>,
  action: FormAction<T>,
): FormState<T> {
  return produce(state, (draft: FormState<T>) => {
    switch (action.type) {
      case 'SET_VALUE':
        draft.values[action.field as keyof T] = action.value;
        break;

      case 'MARK_TOUCHED':
        draft.touched[action.field as keyof T] = true;
        break;

      case 'MARK_ALL_TOUCHED':
        draft.touched = createTouchedState(draft.values, true);
        break;

      case 'SET_ERRORS':
        draft.errors = action.errors;
        break;

      case 'SUBMIT_START':
        draft.isSubmitting = true;
        draft.submissionError = undefined;
        break;

      case 'SUBMIT_SUCCESS':
        draft.isSubmitting = false;
        draft.formStatus = 'success';
        break;

      case 'SUBMIT_ERROR':
        draft.isSubmitting = false;
        draft.formStatus = 'error';
        draft.submissionError = action.error;
        break;

      case 'RESET_FORM_STATUS':
        draft.formStatus = 'default';
        break;

      default:
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
    touched: createTouchedState(initialValues, false),
    errors: {},
    isSubmitting: false,
    formStatus: 'default',
    submissionError: undefined,
  };

  const [state, dispatch] = useReducer(formReducer<T>, initialState);
  const { values, touched, errors, isSubmitting, formStatus, submissionError } =
    state;

  // Validate inputs on change
  useEffect(() => {
    const validationErrors = validate(values);
    dispatch({ type: 'SET_ERRORS', errors: validationErrors });

    // Reset form state when inputs change
    if (formStatus === 'error' || formStatus === 'success') {
      dispatch({ type: 'RESET_FORM_STATUS' });
    }
  }, [values, formStatus, validate]);

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
      error: Boolean(errors[field] && touched[field]),
      helpText: touched[field] ? errors[field] : undefined,
      disabled: isSubmitting,
    }),
    [values, errors, touched, isSubmitting, dispatch],
  );

  const handleSubmit = useCallback(async () => {
    // Mark all fields as touched
    dispatch({ type: 'MARK_ALL_TOUCHED' });

    const validationErrors = validate(values);
    const hasErrors = Object.values(validationErrors).some(Boolean);

    if (hasErrors) {
      dispatch({ type: 'SET_ERRORS', errors: validationErrors });
      dispatch({
        type: 'SUBMIT_ERROR',
        error: validationErrors.form || 'Validation failed',
      });
      return;
    }

    try {
      dispatch({ type: 'SUBMIT_START' });
      await onSubmit(values);
      dispatch({ type: 'SUBMIT_SUCCESS' });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Form submission failed';
      dispatch({ type: 'SUBMIT_ERROR', error: errorMessage });
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
    errors,
    touched,
    isSubmitting,
    formStatus,
    submissionError,
    isFormValid,

    // Form handlers
    handleSubmit,
    getFieldProps,
  };
}

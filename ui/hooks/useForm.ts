import { useReducer, useMemo, useCallback } from 'react';
import { produce } from 'immer';
import { useIsMountedRef } from './useIsMounted';

// Define possible field types to enhance type safety
export type FieldValue = string | number | boolean | undefined;
type ValidationResult = string | undefined;

// Field configuration
export type FieldConfig<T> = {
  initialValue: T;
  validate?: (value: T) => ValidationResult;
};

// Field state containing all field-specific properties
export type FieldState<T> = {
  value: T;
  error?: string;
  touched: boolean;
};

// Form configuration type
export type FormConfig<T extends Record<string, FieldValue>> = {
  fields: {
    [K in keyof T]: FieldConfig<T[K]>;
  };
  onSubmit: (values: T) => Promise<void> | void;
};

// Internal form state with fields grouped by FieldState
export interface FormState<T extends Record<string, FieldValue>> {
  fields: { [K in keyof T]: FieldState<T[K]> };
  topLevelError?: string;
  isSubmitting: boolean;
  formStatus: 'idle' | 'success' | 'error';
}

// Define action types for the reducer
type FormAction<T extends Record<string, FieldValue>> =
  | { type: 'SET_FIELD_VALUE'; field: keyof T; value: T[keyof T] }
  | { type: 'SET_FIELD_ERROR'; field: keyof T; error: ValidationResult }
  | { type: 'SET_FIELD_TOUCHED'; field: keyof T; touched: boolean }
  | {
      type: 'SET_FORM_ERRORS';
      errors: Partial<Record<keyof T, ValidationResult>>;
    }
  | { type: 'SET_FORM_TOUCHED'; touched: Record<keyof T, boolean> }
  | { type: 'SET_FORM_ERROR'; error?: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error?: string }
  | { type: 'RESET_FORM'; state: FormState<T> };

// Form reducer using Immer for state updates
function formReducer<T extends Record<string, FieldValue>>(
  state: FormState<T>,
  action: FormAction<T>,
): FormState<T> {
  if (action.type === 'RESET_FORM') {
    // Handle reset outside of produce to avoid return within produce
    return action.state;
  }

  return produce(state, (draft: FormState<T>) => {
    switch (action.type) {
      case 'SET_FIELD_VALUE':
        draft.fields[action.field].value = action.value;
        break;

      case 'SET_FIELD_ERROR':
        draft.fields[action.field].error = action.error;
        break;

      case 'SET_FIELD_TOUCHED':
        draft.fields[action.field].touched = action.touched;
        break;

      case 'SET_FORM_ERRORS':
        for (const [field, error] of Object.entries(action.errors)) {
          draft.fields[field as keyof T].error = error;
        }
        break;

      case 'SET_FORM_TOUCHED':
        for (const [field, touched] of Object.entries(action.touched)) {
          draft.fields[field as keyof T].touched = touched;
        }
        break;

      case 'SET_FORM_ERROR':
        draft.topLevelError = action.error;
        break;

      case 'SUBMIT_START':
        draft.isSubmitting = true;
        draft.topLevelError = undefined;
        break;

      case 'SUBMIT_SUCCESS':
        draft.isSubmitting = false;
        draft.formStatus = 'success';
        break;

      case 'SUBMIT_ERROR':
        draft.isSubmitting = false;
        draft.formStatus = 'error';
        draft.topLevelError = action.error;
        break;
    }
  });
}

/**
 * A form hook that manages form state, validation, and submission.
 * Uses a reducer pattern with Immer for predictable state updates.
 */
export function useForm<T extends Record<string, FieldValue>>(
  config: FormConfig<T>,
) {
  // Initialize form state from field configs
  const initialFormState: FormState<T> = {
    fields: Object.fromEntries(
      Object.entries(config.fields).map(([key, fieldConfig]) => [
        key as keyof T,
        {
          value: fieldConfig.initialValue,
          error: undefined,
          touched: false,
        },
      ]),
    ) as Record<keyof T, FieldState<any>>,
    isSubmitting: false,
    formStatus: 'idle',
  };

  const [formState, dispatch] = useReducer(formReducer<T>, initialFormState);
  const isMountedRef = useIsMountedRef();

  /**
   * Field operations for manipulating field state
   */
  const fieldActions = useMemo(() => {
    const validate = <K extends keyof T>(name: K) => {
      const validator = config.fields[name]?.validate;
      return validator ? validator(formState.fields[name].value) : undefined;
    };

    const setError = <K extends keyof T>(name: K, error?: string) =>
      dispatch({ type: 'SET_FIELD_ERROR', field: name, error });

    const updateValidation = <K extends keyof T>(name: K) => {
      if (formState.fields[name].touched) {
        setError(name, validate(name));
      }
    };

    return {
      setValue: <K extends keyof T>(name: K, value: T[K]) => {
        dispatch({ type: 'SET_FIELD_VALUE', field: name, value });
        updateValidation(name);
      },

      setTouched: <K extends keyof T>(name: K, touched: boolean = true) => {
        dispatch({ type: 'SET_FIELD_TOUCHED', field: name, touched });
        updateValidation(name);
      },
    };
  }, [formState.fields, config.fields]);

  /**
   * Form-level operations
   */
  const formActions = useMemo(() => {
    return {
      setFormError: (error?: string) =>
        dispatch({ type: 'SET_FORM_ERROR', error }),

      startSubmit: () => dispatch({ type: 'SUBMIT_START' }),

      submitSuccess: () => dispatch({ type: 'SUBMIT_SUCCESS' }),

      submitError: (error?: string) =>
        dispatch({ type: 'SUBMIT_ERROR', error }),

      reset: () => dispatch({ type: 'RESET_FORM', state: initialFormState }),
    };
  }, []);

  /**
   * Event handlers
   */

  const createChangeHandler = useCallback(
    <K extends keyof T>(name: K) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
      ) => {
        const value =
          e.target.type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : e.target.value;

        fieldActions.setValue(name, value as T[K]);
      },
    [fieldActions],
  );

  const createBlurHandler = useCallback(
    <K extends keyof T>(name: K) =>
      () => {
        fieldActions.setTouched(name);
      },
    [fieldActions],
  );

  /**
   * Memoized computed values
   */
  const values = useMemo(() => {
    return Object.fromEntries(
      Object.entries(formState.fields).map(([key, field]) => [
        key,
        field.value,
      ]),
    ) as T;
  }, [formState.fields]);

  const memoized = useMemo(() => {
    // Extract values from fields
    const getValues = () => {
      return Object.entries(formState.fields).reduce((vals, [key, field]) => {
        vals[key as keyof T] = field.value;
        return vals;
      }, {} as T);
    };

    // Check if form is valid
    const isFormValid = () => {
      return !Object.values(formState.fields).some(
        (field) => field.error !== undefined,
      );
    };

    return {
      values: getValues(),
      isValid: isFormValid(),
    };
  }, [formState.fields]);

  /**
   * Form submission
   */
  const submit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const isValid = memoized.isValid;
    if (!isValid) {
      formActions.submitError();
      return;
    }

    try {
      formActions.startSubmit();

      await config.onSubmit(memoized.values);

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        formActions.submitSuccess();
      }
    } catch (error) {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        formActions.submitError(
          error instanceof Error ? error.message : 'Submission failed',
        );
      }
    }
  };

  /**
   * Field props factory
   */
  const fieldProps = <K extends keyof T>(
    name: K,
    options?: { severity?: any },
  ) => {
    const fieldState = formState.fields[name];
    const hasError = Boolean(fieldState.touched && fieldState.error);
    const errorMessage = fieldState.touched ? fieldState.error : undefined;

    return {
      value: fieldState.value,
      onChange: createChangeHandler(name),
      onBlur: createBlurHandler(name),
      id: `${String(name)}-input`,
      name: String(name),
      error: hasError,
      helpText: errorMessage,
      helpTextProps: hasError
        ? {
            severity: options?.severity,
            children: errorMessage || '',
          }
        : undefined,
    };
  };

  return {
    // Form state with new structure
    fields: formState.fields,
    topLevelError: formState.topLevelError,
    isSubmitting: formState.isSubmitting,
    status: formState.formStatus,
    values: memoized.values,

    // Field operations
    setValue: fieldActions.setValue,
    setTouched: fieldActions.setTouched,

    // Form operations
    reset: formActions.reset,
    submit,

    // Status helpers
    isValid: memoized.isValid,
    canSubmit: memoized.isValid && !formState.isSubmitting,
    hasTopLevelError: Boolean(formState.topLevelError),
    isSuccess: formState.formStatus === 'success',
    isError: formState.formStatus === 'error',

    // Actions
    fieldProps,
  };
}

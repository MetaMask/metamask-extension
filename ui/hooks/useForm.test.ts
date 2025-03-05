import { renderHook, act } from '@testing-library/react-hooks';
import { useForm } from './useForm';

const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('useForm', () => {
  // Type definitions and test data
  const initialValues = {
    name: '',
    email: '',
  };

  type FormValues = typeof initialValues;

  const mockErrorMessages = {
    requiredName: 'Name is required',
    requiredEmail: 'Email is required',
    invalidEmail: 'Email is invalid',
    submissionFailed: 'Submission failed',
  };

  // Create a validator function for testing
  const createValidator = (overrides = {}) => {
    return (values: FormValues) => {
      const errors: Record<string, string> = {};

      if (!values.name) {
        errors.name = mockErrorMessages.requiredName;
      }

      if (!values.email) {
        errors.email = mockErrorMessages.requiredEmail;
      } else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.email = mockErrorMessages.invalidEmail;
      }

      return { ...errors, ...overrides };
    };
  };

  // Setup options interface
  interface SetupOptions {
    initialValues?: FormValues;
    validator?: (values: FormValues) => Record<string, string>;
    onSubmit?: jest.Mock;
  }

  // Hook setup helper
  const setupHook = ({
    initialValues: customInitialValues = initialValues,
    validator = createValidator(),
    onSubmit = jest.fn().mockResolvedValue(undefined),
  }: SetupOptions = {}) => {
    const utils = renderHook(() =>
      useForm({
        initialValues: customInitialValues,
        validate: validator,
        onSubmit,
      }),
    );

    return {
      ...utils,
      onSubmit,
    };
  };

  type SetupHookResult = ReturnType<typeof setupHook>['result'];

  // Simplified form interactions
  const formInteractions = {
    // Set a field value
    setValue: async (
      result: SetupHookResult,
      field: keyof FormValues,
      value: string,
    ) => {
      await act(async () => {
        // Get field props and use the onChange handler
        const fieldProps = result.current.getFieldProps(field);
        fieldProps.onChange({
          target: { value },
        } as React.ChangeEvent<HTMLInputElement>);
      });
    },

    // Fill multiple form fields
    fillForm: async (result: SetupHookResult, values: Partial<FormValues>) => {
      for (const [field, value] of Object.entries(values)) {
        await formInteractions.setValue(
          result,
          field as keyof FormValues,
          value,
        );
      }
    },

    // Blur a field
    blur: async (result: SetupHookResult, field: keyof FormValues) => {
      await act(async () => {
        const fieldProps = result.current.getFieldProps(field);
        fieldProps.onBlur();
      });
    },

    // Submit the form
    submit: async (result: SetupHookResult) => {
      await act(async () => {
        await result.current.handleSubmit();
      });
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default values and state', () => {
      const { result } = setupHook();

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.submitStatus).toBe('idle');
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.touched).toEqual({
        name: false,
        email: false,
      });
      expect(result.current.formError).toBeUndefined();
    });

    it('should initialize with validation errors and show isFormValid as false', () => {
      const { result } = setupHook();
      expect(result.current.fieldErrors).toEqual({
        name: mockErrorMessages.requiredName,
        email: mockErrorMessages.requiredEmail,
      });
      expect(result.current.isFormValid).toBe(false);
    });

    it('should have no validation errors and isFormValid true when validator returns no errors', () => {
      const { result } = setupHook({
        validator: () => ({}),
      });
      expect(result.current.fieldErrors).toEqual({});
      expect(result.current.isFormValid).toBe(true);
    });

    it('should respect custom initial values', () => {
      const customValues = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const { result } = setupHook({ initialValues: customValues });

      expect(result.current.values).toEqual(customValues);
      expect(result.current.fieldErrors).toEqual({});
      expect(result.current.isFormValid).toBe(true);
    });
  });

  describe('field interactions', () => {
    it('should update values and validation when input changes', async () => {
      const { result } = setupHook();

      await formInteractions.setValue(result, 'name', 'John Doe');

      expect(result.current.values.name).toBe('John Doe');
      expect(result.current.fieldErrors.name).toBeUndefined();
      expect(result.current.fieldErrors.email).toBe(
        mockErrorMessages.requiredEmail,
      );
    });

    it('should mark fields as touched on blur', async () => {
      const { result } = setupHook();

      await formInteractions.blur(result, 'name');

      expect(result.current.touched.name).toBe(true);
      expect(result.current.touched.email).toBe(false);
    });

    it('should validate email format correctly', async () => {
      const { result } = setupHook();

      await formInteractions.setValue(result, 'email', 'invalid-email');
      expect(result.current.fieldErrors.email).toBe(
        mockErrorMessages.invalidEmail,
      );

      await formInteractions.setValue(result, 'email', 'valid@example.com');
      expect(result.current.fieldErrors.email).toBeUndefined();
    });
  });

  describe('getFieldProps', () => {
    it('should provide correct field props based on field state', async () => {
      const { result } = setupHook();

      // Initially no errors shown because not touched
      let nameProps = result.current.getFieldProps('name');
      expect(nameProps).toEqual({
        name: 'name',
        value: '',
        onChange: expect.any(Function),
        onBlur: expect.any(Function),
        error: false,
        helpText: undefined,
        disabled: false,
      });

      // After blur, should show error
      await formInteractions.blur(result, 'name');
      nameProps = result.current.getFieldProps('name');
      expect(nameProps.error).toBe(true);
      expect(nameProps.helpText).toBe(mockErrorMessages.requiredName);

      // After setting value, error should be cleared
      await formInteractions.setValue(result, 'name', 'John Doe');
      nameProps = result.current.getFieldProps('name');
      expect(nameProps.error).toBe(false);
      expect(nameProps.helpText).toBeUndefined();
    });

    it('should disable fields when form is submitting', async () => {
      // Create a controlled submission that we can resolve manually
      let resolveSubmit: (value: unknown) => void;
      const controlledSubmit = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmit = resolve;
          }),
      );

      const { result } = setupHook({
        initialValues: { name: 'John Doe', email: 'john@example.com' },
        onSubmit: controlledSubmit,
      });

      // Start submission
      let submitPromise: Promise<void>;
      await act(async () => {
        submitPromise = result.current.handleSubmit();
      });

      // Fields should be disabled during submission
      const nameProps = result.current.getFieldProps('name');
      expect(nameProps.disabled).toBe(true);

      // Complete submission
      await act(async () => {
        resolveSubmit!(undefined);
        await submitPromise;
      });
    });
  });

  describe('form validation', () => {
    it('should update isFormValid property when form state changes', async () => {
      const { result } = setupHook();

      expect(result.current.isFormValid).toBe(false);

      await formInteractions.setValue(result, 'name', 'John Doe');
      expect(result.current.isFormValid).toBe(false);

      await formInteractions.setValue(result, 'email', 'john@example.com');
      expect(result.current.isFormValid).toBe(true);

      await formInteractions.setValue(result, 'email', 'invalid');
      expect(result.current.isFormValid).toBe(false);
    });
  });

  describe('form submission', () => {
    it('should mark fields as touched on invalid submission', async () => {
      const { result, onSubmit } = setupHook();

      await formInteractions.submit(result);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.touched).toEqual({
        name: true,
        email: true,
      });
    });

    it('should call onSubmit with form values when valid', async () => {
      const { result, onSubmit } = setupHook();

      await formInteractions.setValue(result, 'name', 'John Doe');
      await formInteractions.setValue(result, 'email', 'john@example.com');

      expect(result.current.isFormValid).toBe(true);

      await formInteractions.submit(result);

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should set isSubmitting to true during submission', async () => {
      let resolveSubmit: (value: unknown) => void;
      const controlledSubmit = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmit = resolve;
          }),
      );

      const { result } = setupHook({
        initialValues: { name: 'John Doe', email: 'john@example.com' },
        onSubmit: controlledSubmit,
      });

      let submitPromise: Promise<void>;
      await act(async () => {
        submitPromise = result.current.handleSubmit();
      });

      expect(result.current.isSubmitting).toBe(true);

      await act(async () => {
        resolveSubmit!(undefined);
        await submitPromise;
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should record submission error message when submission fails', async () => {
      const error = new Error(mockErrorMessages.submissionFailed);
      const failingSubmit = jest.fn().mockRejectedValue(error);

      const { result } = setupHook({
        initialValues: { name: 'John Doe', email: 'john@example.com' },
        onSubmit: failingSubmit,
      });

      await act(async () => {
        try {
          await result.current.handleSubmit();
        } catch (e) {
          // Intentionally catch error to prevent test failure
        }
      });

      expect(failingSubmit).toHaveBeenCalledTimes(1);
      expect(result.current.formError).toBe(mockErrorMessages.submissionFailed);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.submitStatus).toBe('error');
    });
  });
});

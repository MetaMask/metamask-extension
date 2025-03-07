import { renderHook, act } from '@testing-library/react-hooks';
import { Hex } from '@metamask/utils';
import { useSamplePetnamesForm } from './useSamplePetnamesForm';
import { useSamplePetnamesController } from '../../../ducks/metamask/sample-petnames-controller';
import { useSamplePetnamesMetrics } from './useSamplePetnamesMetrics';
import { useSamplePerformanceTrace } from './useSamplePerformanceTrace';
import { ChangeEvent } from 'react';

// Mock the dependencies
jest.mock('../../../ducks/metamask/sample-petnames-controller');
jest.mock('./useSamplePetnamesMetrics');
jest.mock('./useSamplePerformanceTrace');
jest.mock('../../../hooks/useForm', () => ({
  useForm: jest
    .fn()
    .mockImplementation(({ initialValues, validate, onSubmit }) => {
      let values = { ...initialValues };
      const errors = validate ? validate(values) : {};

      return {
        values,
        errors,
        isSubmitting: false,
        formState: 'default',
        handleSubmit: async () => {
          const validationErrors = validate(values);
          const hasErrors = Object.values(validationErrors).some(
            (error) => error,
          );

          if (hasErrors) {
            // This will trigger the validation error tracking in the hook's handleSubmit
            onSubmit(values).catch(() => {
              // Ignore error, we'll throw it below
            });
            throw new Error('Validation failed');
          }

          return onSubmit(values);
        },
        handleInputChange:
          (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
            values = { ...values, [field]: e.target.value };
          },
        handleBlur: jest.fn(),
        getFieldProps: jest.fn(),
        isFormValid: Object.values(validate(values)).every((error) => !error),
      };
    }),
}));

describe('useSamplePetnamesForm', () => {
  // Test helpers and constants
  const VALID_ADDRESS = '0x1234567890123456789012345678901234567890' as Hex;
  const INVALID_ADDRESS = '0xinvalid';
  const VALID_PETNAME = 'Valid Name';
  const EMPTY_PETNAME = '';
  const TOO_LONG_PETNAME = 'This name is way too long and should be rejected';

  // Mock functions
  const mocks = {
    assignPetname: jest.fn(),
    trackPetnamesFormViewed: jest.fn(),
    trackPetnameAdded: jest.fn(),
    trackFormValidationError: jest.fn(),
    trackFormSubmissionError: jest.fn(),
    startTrace: jest.fn(),
    endTrace: jest.fn(),
    traceFormSubmission: jest.fn(),
  };

  // Helper function to create a change event
  const createChangeEvent = (value: string) =>
    ({ target: { value } } as ChangeEvent<HTMLInputElement>);

  // Helper function to set form values
  const setFormValues = (result: any, address: string, petName: string) => {
    act(() => {
      result.current.handleInputChange('address')(createChangeEvent(address));
      result.current.handleInputChange('petName')(createChangeEvent(petName));
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks return values
    mocks.traceFormSubmission.mockReturnValue({
      startTrace: mocks.startTrace,
      endTrace: mocks.endTrace,
    });

    // Setup hook mocks
    (useSamplePetnamesController as jest.Mock).mockReturnValue({
      namesForCurrentChain: {},
      assignPetname: mocks.assignPetname,
    });

    (useSamplePetnamesMetrics as jest.Mock).mockReturnValue({
      trackPetnamesFormViewed: mocks.trackPetnamesFormViewed,
      trackPetnameAdded: mocks.trackPetnameAdded,
      trackFormValidationError: mocks.trackFormValidationError,
      trackFormSubmissionError: mocks.trackFormSubmissionError,
    });

    (useSamplePerformanceTrace as jest.Mock).mockReturnValue({
      traceFormSubmission: mocks.traceFormSubmission,
    });
  });

  describe('Initialization', () => {
    it('should initialize the form with default values', () => {
      const { result } = renderHook(() => useSamplePetnamesForm());

      expect(result.current.values).toEqual({
        address: '0x',
        petName: '',
      });
    });

    it('should track form view on mount', () => {
      renderHook(() => useSamplePetnamesForm());

      expect(mocks.trackPetnamesFormViewed).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form validation', () => {
    it('should reject invalid addresses', async () => {
      const { result } = renderHook(() => useSamplePetnamesForm());

      setFormValues(result, INVALID_ADDRESS, VALID_PETNAME);

      await act(async () => {
        await expect(result.current.handleSubmit()).rejects.toThrow();
      });

      expect(mocks.assignPetname).not.toHaveBeenCalled();
    });

    it('should reject empty pet names', async () => {
      const { result } = renderHook(() => useSamplePetnamesForm());

      setFormValues(result, VALID_ADDRESS, EMPTY_PETNAME);

      await act(async () => {
        await expect(result.current.handleSubmit()).rejects.toThrow();
      });

      expect(mocks.trackFormValidationError).toHaveBeenCalled();
    });

    it('should reject too long pet names', async () => {
      const { result } = renderHook(() => useSamplePetnamesForm());

      setFormValues(result, VALID_ADDRESS, TOO_LONG_PETNAME);

      await act(async () => {
        await expect(result.current.handleSubmit()).rejects.toThrow();
      });

      expect(mocks.trackFormValidationError).toHaveBeenCalled();
    });
  });

  describe('Form submission', () => {
    it('should successfully submit with valid inputs', async () => {
      mocks.assignPetname.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useSamplePetnamesForm());

      setFormValues(result, VALID_ADDRESS, VALID_PETNAME);

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Check tracing
      expect(mocks.startTrace).toHaveBeenCalled();
      expect(mocks.endTrace).toHaveBeenCalledWith(true, {
        success: true,
        addressLength: VALID_ADDRESS.length,
        petNameLength: VALID_PETNAME.length,
      });

      // Check form submission
      expect(mocks.assignPetname).toHaveBeenCalledWith(
        VALID_ADDRESS,
        VALID_PETNAME,
      );
      expect(mocks.trackPetnameAdded).toHaveBeenCalledWith(
        VALID_ADDRESS,
        VALID_PETNAME.length,
      );
    });

    it('should handle submission errors correctly', async () => {
      const errorMessage = 'Failed to assign petname';
      mocks.assignPetname.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useSamplePetnamesForm());

      setFormValues(result, VALID_ADDRESS, VALID_PETNAME);

      await act(async () => {
        await expect(result.current.handleSubmit()).rejects.toThrow(
          errorMessage,
        );
      });

      // Check error handling
      expect(mocks.trackFormSubmissionError).toHaveBeenCalledWith(errorMessage);
      expect(mocks.endTrace).toHaveBeenCalledWith(false, {
        success: false,
        error: errorMessage,
      });
    });
  });
});

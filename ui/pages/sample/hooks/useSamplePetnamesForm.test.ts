// eslint-disable-next-line spaced-comment
/// <reference types="@types/jest" />

import {
  renderHook,
  act,
  RenderHookResult,
} from '@testing-library/react-hooks';
import { Hex } from '@metamask/utils';
import { ChangeEvent } from 'react';
import { useSamplePetnames } from '../../../ducks/sample-petnames';
import { useSamplePetnamesForm } from './useSamplePetnamesForm';
import { useSamplePetnamesMetrics } from './useSamplePetnamesMetrics';
import { useSamplePerformanceTrace } from './useSamplePerformanceTrace';

const it = global.it as unknown as jest.It;

// Mock the dependencies
jest.mock('../../../ducks/sample-petnames');
jest.mock('./useSamplePetnamesMetrics');
jest.mock('./useSamplePerformanceTrace');

describe('useSamplePetnamesForm', () => {
  // Test helpers and constants
  const VALID_ADDRESS = '0x1234567890123456789012345678901234567890' as Hex;
  const INVALID_ADDRESS = '0xinvalid';
  const VALID_PETNAME = 'Valid Name';
  const EMPTY_PETNAME = '';
  const TOO_LONG_PETNAME = 'This name is way too long and should be rejected';

  // Type for the hook result to make testing easier
  type HookResult = RenderHookResult<
    unknown,
    ReturnType<typeof useSamplePetnamesForm>
  >;

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
  const setFormValues = (
    result: HookResult['result'],
    address: string,
    petname: string,
  ) => {
    act(() => {
      result.current
        .getFieldProps('address')
        .onChange(createChangeEvent(address));
      result.current
        .getFieldProps('petname')
        .onChange(createChangeEvent(petname));
    });
  };

  // Helper function to submit the form
  const submitForm = async (result: HookResult['result']) => {
    await act(async () => {
      await result.current.handleSubmit();
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
    (useSamplePetnames as jest.Mock).mockReturnValue({
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
        petname: '',
      });
    });

    it('should track form view on mount', () => {
      renderHook(() => useSamplePetnamesForm());

      expect(mocks.trackPetnamesFormViewed).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form validation', () => {
    it.each([
      {
        scenario: 'invalid address',
        address: INVALID_ADDRESS,
        petname: VALID_PETNAME,
        expectedFieldError: 'address',
      },
      {
        scenario: 'empty pet name',
        address: VALID_ADDRESS,
        petname: EMPTY_PETNAME,
        expectedFieldError: 'petname',
      },
      {
        scenario: 'too long pet name',
        address: VALID_ADDRESS,
        petname: TOO_LONG_PETNAME,
        expectedFieldError: 'petname',
      },
    ])(
      'should reject $scenario',
      async ({ address, petname, expectedFieldError }) => {
        const { result } = renderHook(() => useSamplePetnamesForm());

        setFormValues(result, address, petname);

        // Submit the form
        await submitForm(result);

        // Check that validation errors are set
        expect(
          result.current.fieldErrors[
            expectedFieldError as keyof typeof result.current.fieldErrors
          ],
        ).toBeTruthy();
        expect(result.current.isFormValid).toBe(false);
        expect(mocks.assignPetname).not.toHaveBeenCalled();

        // Check that the form is in error state due to validation
        expect(result.current.submitStatus).not.toBe('success');
      },
    );
  });

  describe('Form submission', () => {
    it('should successfully submit with valid inputs', async () => {
      mocks.assignPetname.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useSamplePetnamesForm());

      setFormValues(result, VALID_ADDRESS, VALID_PETNAME);
      await submitForm(result);

      // Check tracing
      expect(mocks.startTrace).toHaveBeenCalled();
      expect(mocks.endTrace).toHaveBeenCalledWith(true, {
        success: true,
        addressLength: VALID_ADDRESS.length,
        petnameLength: VALID_PETNAME.length,
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

      // Check form state
      expect(result.current.submitStatus).toBe('success');
      expect(result.current.formError).toBeUndefined();
    });

    it('should handle submission errors correctly', async () => {
      const errorMessage = 'Failed to assign petname';
      mocks.assignPetname.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useSamplePetnamesForm());

      setFormValues(result, VALID_ADDRESS, VALID_PETNAME);

      // The form is valid but the submission will fail
      expect(result.current.isFormValid).toBe(true);

      // Submit the form and expect it to fail
      await submitForm(result);

      // Check error handling
      expect(result.current.formError).toBeTruthy();
      expect(result.current.submitStatus).toBe('error');
      expect(mocks.trackFormSubmissionError).toHaveBeenCalledWith(errorMessage);
      expect(mocks.endTrace).toHaveBeenCalledWith(false, {
        success: false,
        error: errorMessage,
      });
    });
  });

  describe('Form field validation', () => {
    // Test validateAddress function behavior
    it.each([
      {
        scenario: 'empty address',
        address: '',
        expectedError: 'Address is required',
      },
      {
        scenario: 'invalid address format',
        address: INVALID_ADDRESS,
        expectedError: 'Invalid Ethereum address',
      },
      {
        scenario: 'valid address',
        address: VALID_ADDRESS,
        expectedError: undefined,
      },
    ])(
      'should validate address: $scenario',
      async ({ address, expectedError }) => {
        const { result } = renderHook(() => useSamplePetnamesForm());

        act(() => {
          result.current
            .getFieldProps('address')
            .onChange(createChangeEvent(address));
          result.current.getFieldProps('address').onBlur();
        });

        expect(result.current.fieldErrors.address).toBe(expectedError);
      },
    );

    // Test validatePetname function behavior
    it.each([
      {
        scenario: 'empty petname',
        petname: EMPTY_PETNAME,
        expectedError: 'Pet name is required',
      },
      {
        scenario: 'too long petname',
        petname: TOO_LONG_PETNAME,
        expectedError: 'Pet name must be 12 characters or less',
      },
      {
        scenario: 'valid petname',
        petname: VALID_PETNAME,
        expectedError: undefined,
      },
    ])(
      'should validate petname: $scenario',
      async ({ petname, expectedError }) => {
        const { result } = renderHook(() => useSamplePetnamesForm());

        act(() => {
          result.current
            .getFieldProps('petname')
            .onChange(createChangeEvent(petname));
          result.current.getFieldProps('petname').onBlur();
        });

        expect(result.current.fieldErrors.petname).toBe(expectedError);
      },
    );
  });
});

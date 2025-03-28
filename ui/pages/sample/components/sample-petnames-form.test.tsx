import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Hex } from '@metamask/utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { useSamplePetnames } from '../../../ducks/sample-petnames';
import {
  FormValues,
  useSamplePetnamesForm,
} from '../hooks/useSamplePetnamesForm';
import { SamplePetnamesForm } from './sample-petnames-form';

// Mock all external dependencies
jest.mock('../../../ducks/sample-petnames');
jest.mock('../hooks/useSamplePetnamesForm');

describe('SamplePetnamesForm', () => {
  // Test data constants
  const TEST_DATA = {
    validAddress: '0x1234567890abcdef1234567890abcdef12345678' as Hex,
    validName: 'Valid Name',
    secondAddress: '0xabcdef1234567890abcdef1234567890abcdef12' as Hex,
    secondName: 'TestName2',
    errorMessage: 'Something went wrong',
  };

  // Common mock functions
  const mockFunctions = {
    assignPetname: jest.fn().mockResolvedValue(undefined),
    handleSubmit: jest.fn().mockResolvedValue(undefined),
    traceFormSubmission: jest.fn().mockReturnValue({
      startTrace: jest.fn(),
      endTrace: jest.fn(),
    }),
    trackPetnamesFormViewed: jest.fn(),
    trackPetnameAdded: jest.fn(),
    trackFormValidationError: jest.fn(),
    trackFormSubmissionError: jest.fn(),
    onChange: jest.fn(),
    onBlur: jest.fn(),
  };

  // Store setup
  const createStore = () => {
    const mockStore = configureStore([]);
    return mockStore({
      metamask: {
        namesByChainIdAndAddress: {},
      },
    });
  };

  type UseSamplePetnamesFormResult = ReturnType<typeof useSamplePetnamesForm>;
  const mockUseSamplePetnamesForm =
    useSamplePetnamesForm as jest.Mock<UseSamplePetnamesFormResult>;

  type UseSamplePetnamesFormResultPartial = Pick<
    UseSamplePetnamesFormResult,
    | 'values'
    | 'fieldErrors'
    | 'formError'
    | 'isSubmitting'
    | 'submitStatus'
    | 'isFormValid'
  >;

  // Helper to create a sample petnames form result
  const createSamplePetnamesFormResult = (
    resultPartial: UseSamplePetnamesFormResultPartial,
  ): UseSamplePetnamesFormResult => {
    // Mock the getFieldProps function
    const mockGetFieldProps = jest
      .fn()
      .mockImplementation((field: keyof FormValues) => ({
        name: field,
        value: resultPartial.values[field],
        onChange: mockFunctions.onChange,
        onBlur: mockFunctions.onBlur,
        error: Boolean(resultPartial.fieldErrors[field]),
        helpText: resultPartial.fieldErrors[field],
        disabled: false,
      }));

    return {
      handleSubmit: jest.fn(),
      touched: { address: false, petname: false },
      getFieldProps: mockGetFieldProps,
      ...resultPartial,
    };
  };

  const USE_FORM_RESULTS: Record<string, UseSamplePetnamesFormResult> = {
    default: createSamplePetnamesFormResult({
      isSubmitting: false,
      submitStatus: 'idle',
      formError: undefined,
      isFormValid: false,
      values: { address: '0x', petname: '' },
      fieldErrors: {},
    }),
    valid: createSamplePetnamesFormResult({
      isSubmitting: false,
      submitStatus: 'idle',
      formError: undefined,
      isFormValid: true,
      values: { address: TEST_DATA.validAddress, petname: TEST_DATA.validName },
      fieldErrors: {},
    }),
    submitting: createSamplePetnamesFormResult({
      isSubmitting: true,
      submitStatus: 'submitting',
      formError: undefined,
      isFormValid: false,
      values: { address: '0x', petname: '' },
      fieldErrors: {},
    }),
    success: createSamplePetnamesFormResult({
      isSubmitting: false,
      submitStatus: 'success',
      formError: undefined,
      isFormValid: false,
      values: { address: '0x', petname: '' },
      fieldErrors: {},
    }),
    error: createSamplePetnamesFormResult({
      isSubmitting: false,
      submitStatus: 'error',
      formError: TEST_DATA.errorMessage,
      isFormValid: false,
      values: { address: '0x', petname: '' },
      fieldErrors: {},
    }),
    validation_error: createSamplePetnamesFormResult({
      isSubmitting: false,
      submitStatus: 'idle',
      formError: undefined,
      isFormValid: false,
      values: { address: 'invalid' as Hex, petname: '' },
      fieldErrors: {
        address: 'Invalid address',
        petname: 'Name required',
      },
    }),
  };

  // Helper to setup controller mock with different states
  const setupSamplePetnamesDuckMock = (namesForCurrentChain = {}) => {
    (useSamplePetnames as jest.Mock).mockReturnValue({
      namesForCurrentChain,
      assignPetname: mockFunctions.assignPetname,
    });
  };

  // Helper to get form elements
  const getFormElements = () => ({
    addressInput: screen.getByLabelText('Address'),
    nameInput: screen.getByLabelText('Name'),
    submitButton: screen.getByRole('button', { name: /add pet name/iu }),
  });

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    setupSamplePetnamesDuckMock();
  });

  describe('Rendering', () => {
    it('renders with empty state when no pet names exist', () => {
      mockUseSamplePetnamesForm.mockReturnValue(USE_FORM_RESULTS.default);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      expect(screen.getByText('Pet Names on this network')).toBeInTheDocument();
      expect(screen.getByText('No pet names added yet')).toBeInTheDocument();

      const { addressInput, nameInput, submitButton } = getFormElements();
      expect(addressInput).toBeInTheDocument();
      expect(nameInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('renders pet names when they exist', () => {
      const mockNames = {
        [TEST_DATA.validAddress]: TEST_DATA.validName,
        [TEST_DATA.secondAddress]: TEST_DATA.secondName,
      };

      setupSamplePetnamesDuckMock(mockNames);
      mockUseSamplePetnamesForm.mockReturnValue(USE_FORM_RESULTS.default);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      expect(screen.getByText('Pet Names on this network')).toBeInTheDocument();
      expect(screen.getByText(TEST_DATA.validName)).toBeInTheDocument();
      expect(screen.getByText(TEST_DATA.secondName)).toBeInTheDocument();
      expect(
        screen.queryByText('No pet names added yet'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('disables submit button with invalid form data', () => {
      mockUseSamplePetnamesForm.mockReturnValue(USE_FORM_RESULTS.default);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      const { submitButton } = getFormElements();
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when form is valid', () => {
      mockUseSamplePetnamesForm.mockReturnValue(USE_FORM_RESULTS.valid);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      const { submitButton } = getFormElements();
      expect(submitButton).not.toBeDisabled();
    });

    it('calls handleSubmit when form is submitted', async () => {
      mockUseSamplePetnamesForm.mockReturnValue(USE_FORM_RESULTS.valid);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      const { submitButton } = getFormElements();
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFunctions.handleSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Form States', () => {
    it('shows submission error when present', () => {
      mockUseSamplePetnamesForm.mockReturnValue(USE_FORM_RESULTS.error);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      expect(screen.getByText(TEST_DATA.errorMessage)).toBeInTheDocument();
    });

    it('shows success message when form submission is successful', () => {
      mockUseSamplePetnamesForm.mockReturnValue(USE_FORM_RESULTS.success);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      expect(
        screen.getByText('Pet name added successfully!'),
      ).toBeInTheDocument();
    });

    it('shows form validation errors', () => {
      mockUseSamplePetnamesForm.mockReturnValue(
        USE_FORM_RESULTS.validation_error,
      );

      renderWithProvider(<SamplePetnamesForm />, createStore());

      expect(screen.getByText('Invalid address')).toBeInTheDocument();
      expect(screen.getByText('Name required')).toBeInTheDocument();
    });

    it('displays correct button text when submitting', () => {
      mockUseSamplePetnamesForm.mockReturnValue(USE_FORM_RESULTS.submitting);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      expect(
        screen.getByRole('button', { name: 'Adding...' }),
      ).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('works with form submission flow', async () => {
      // Create a custom handleSubmit that uses the assignPetname function
      const mockHandleSubmit = jest.fn();

      // Override the handleSubmit with our custom implementation
      mockUseSamplePetnamesForm.mockImplementationOnce(() => ({
        ...USE_FORM_RESULTS.valid,
        handleSubmit: mockHandleSubmit,
      }));

      renderWithProvider(<SamplePetnamesForm />, createStore());

      // Submit the form
      const { submitButton } = getFormElements();
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Verify the submit handler was called
      await waitFor(() => {
        expect(mockHandleSubmit).toHaveBeenCalled();
      });
    });
  });
});

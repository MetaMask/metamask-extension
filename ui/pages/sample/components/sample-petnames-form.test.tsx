import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { useSamplePetnamesController } from '../../../ducks/metamask/sample-petnames-controller';
import { useSamplePetnamesMetrics } from '../hooks/useSamplePetnamesMetrics';
import { useSamplePerformanceTrace } from '../hooks/useSamplePerformanceTrace';
import { useSamplePetnamesForm } from '../hooks/useSamplePetnamesForm';
import { SamplePetnamesForm } from './sample-petnames-form';

// Mock all external dependencies
jest.mock('../../../ducks/metamask/sample-petnames-controller');
jest.mock('../hooks/useSamplePetnamesMetrics');
jest.mock('../hooks/useSamplePerformanceTrace');
jest.mock('../hooks/useSamplePetnamesForm');

describe('SamplePetnamesForm', () => {
  // Test data constants
  const TEST_DATA = {
    validAddress: '0x1234567890abcdef1234567890abcdef12345678',
    validName: 'Valid Name',
    secondAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
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
        samplePetnamesByChainIdAndAddress: {},
      },
    });
  };

  // Form state variants for different test scenarios
  type FormState = {
    isSubmitting: boolean;
    formStatus: string;
    submissionError: string | undefined;
    isFormValid: boolean;
    values: { address: string; petName: string };
    errors: Record<string, string>;
  };

  const FORM_STATES: Record<string, FormState> = {
    default: {
      isSubmitting: false,
      formStatus: 'default',
      submissionError: undefined,
      isFormValid: false,
      values: { address: '0x', petName: '' },
      errors: {} as Record<string, string>,
    },
    valid: {
      isSubmitting: false,
      formStatus: 'default',
      submissionError: undefined,
      isFormValid: true,
      values: { address: TEST_DATA.validAddress, petName: TEST_DATA.validName },
      errors: {} as Record<string, string>,
    },
    submitting: {
      isSubmitting: true,
      formStatus: 'default',
      submissionError: undefined,
      isFormValid: false,
      values: { address: '0x', petName: '' },
      errors: {} as Record<string, string>,
    },
    success: {
      isSubmitting: false,
      formStatus: 'success',
      submissionError: undefined,
      isFormValid: false,
      values: { address: '0x', petName: '' },
      errors: {} as Record<string, string>,
    },
    error: {
      isSubmitting: false,
      formStatus: 'error',
      submissionError: TEST_DATA.errorMessage,
      isFormValid: false,
      values: { address: '0x', petName: '' },
      errors: {} as Record<string, string>,
    },
    validation_error: {
      isSubmitting: false,
      formStatus: 'default',
      submissionError: undefined,
      isFormValid: false,
      values: { address: 'invalid', petName: '' },
      errors: {
        address: 'Invalid address',
        petName: 'Name required',
      } as Record<string, string>,
    },
  };

  // Helper to setup form hook mock with different states
  const setupFormMock = (formStatus = FORM_STATES.default) => {
    (useSamplePetnamesForm as jest.Mock).mockReturnValue({
      ...formStatus,
      handleSubmit: mockFunctions.handleSubmit,
      getFieldProps: jest.fn().mockImplementation((field: string) => ({
        name: field,
        value:
          field === 'address'
            ? formStatus.values.address
            : formStatus.values.petName,
        onChange: mockFunctions.onChange,
        onBlur: mockFunctions.onBlur,
        error: Boolean(formStatus.errors[field]),
        helpText: formStatus.errors[field],
      })),
    });
  };

  // Helper to setup controller mock with different states
  const setupControllerMock = (namesForCurrentChain = {}) => {
    (useSamplePetnamesController as jest.Mock).mockReturnValue({
      namesForCurrentChain,
      assignPetname: mockFunctions.assignPetname,
    });
  };

  // Helper to setup metrics mock
  const setupMetricsMock = () => {
    (useSamplePetnamesMetrics as jest.Mock).mockReturnValue({
      trackPetnamesFormViewed: mockFunctions.trackPetnamesFormViewed,
      trackPetnameAdded: mockFunctions.trackPetnameAdded,
      trackFormValidationError: mockFunctions.trackFormValidationError,
      trackFormSubmissionError: mockFunctions.trackFormSubmissionError,
    });
  };

  // Helper to setup performance trace mock
  const setupPerformanceTraceMock = () => {
    (useSamplePerformanceTrace as jest.Mock).mockReturnValue({
      traceFormSubmission: mockFunctions.traceFormSubmission,
    });
  };

  // Helper to setup all mocks with default values
  const setupAllMocks = () => {
    setupControllerMock();
    setupFormMock();
    setupMetricsMock();
    setupPerformanceTraceMock();
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
    setupAllMocks();
  });

  describe('Rendering', () => {
    it('renders with empty state when no pet names exist', () => {
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

      setupControllerMock(mockNames);

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
      renderWithProvider(<SamplePetnamesForm />, createStore());

      const { submitButton } = getFormElements();
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when form is valid', () => {
      setupFormMock(FORM_STATES.valid);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      const { submitButton } = getFormElements();
      expect(submitButton).not.toBeDisabled();
    });

    it('calls handleSubmit when form is submitted', async () => {
      setupFormMock(FORM_STATES.valid);

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
      setupFormMock(FORM_STATES.error);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      expect(screen.getByText(TEST_DATA.errorMessage)).toBeInTheDocument();
    });

    it('shows success message when form submission is successful', () => {
      setupFormMock(FORM_STATES.success);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      expect(
        screen.getByText('Pet name added successfully!'),
      ).toBeInTheDocument();
    });

    it('shows form validation errors', () => {
      setupFormMock(FORM_STATES.validation_error);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      expect(screen.getByText('Invalid address')).toBeInTheDocument();
      expect(screen.getByText('Name required')).toBeInTheDocument();
    });

    it('displays correct button text when submitting', () => {
      setupFormMock(FORM_STATES.submitting);

      renderWithProvider(<SamplePetnamesForm />, createStore());

      expect(
        screen.getByRole('button', { name: 'Adding...' }),
      ).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('works with form submission flow', async () => {
      // Create a custom handleSubmit that uses the assignPetname function
      const customHandleSubmit = jest.fn().mockImplementation(async () => {
        await mockFunctions.assignPetname(
          TEST_DATA.validAddress,
          TEST_DATA.validName,
        );
      });

      // Setup specific mocks for this test
      setupFormMock(FORM_STATES.valid);

      // Override the handleSubmit with our custom implementation
      (useSamplePetnamesForm as jest.Mock).mockImplementationOnce(() => ({
        ...FORM_STATES.valid,
        handleSubmit: customHandleSubmit,
        getFieldProps: jest.fn().mockImplementation((field: string) => ({
          name: field,
          value:
            field === 'address' ? TEST_DATA.validAddress : TEST_DATA.validName,
          onChange: mockFunctions.onChange,
          onBlur: mockFunctions.onBlur,
          error: false,
          helpText: undefined,
        })),
      }));

      renderWithProvider(<SamplePetnamesForm />, createStore());

      // Submit the form
      const { submitButton } = getFormElements();
      fireEvent.click(submitButton);

      // Verify the submit handler was called
      await waitFor(() => {
        expect(customHandleSubmit).toHaveBeenCalled();
      });

      // Verify the assignPetname was called with correct args
      await waitFor(() => {
        expect(mockFunctions.assignPetname).toHaveBeenCalledWith(
          TEST_DATA.validAddress,
          TEST_DATA.validName,
        );
      });
    });
  });
});

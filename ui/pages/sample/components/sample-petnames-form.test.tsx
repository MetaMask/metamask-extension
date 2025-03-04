import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { usePetnames } from '../../../ducks/metamask/sample-petnames-controller';
import { useSamplePetnamesMetrics } from '../hooks/useSamplePetnamesMetrics';
import { useSamplePerformanceTrace } from '../hooks/useSamplePerformanceTrace';
import { useSamplePetnamesForm } from '../hooks/useSamplePetnamesForm';
import { SamplePetnamesForm } from './sample-petnames-form';

// Mock the hooks
jest.mock('../../../ducks/metamask/sample-petnames-controller');
jest.mock('../hooks/useSamplePetnamesMetrics');
jest.mock('../hooks/useSamplePerformanceTrace');
jest.mock('../hooks/useSamplePetnamesForm');

describe('SamplePetnamesForm', () => {
  // Setup helper functions
  const setupMocks = ({
    petnamesConfig = {},
    formConfig = {},
    metricsConfig = {},
    performanceConfig = {},
  } = {}) => {
    const mockAssignPetname = jest.fn().mockResolvedValue(undefined);

    // Mock store
    const mockStore = configureStore([]);
    const store = mockStore({
      metamask: {
        samplePetnamesByChainIdAndAddress: {},
      },
    });

    // Default configurations for mocks
    const defaultPetnamesConfig = {
      namesForCurrentChain: {},
      assignPetname: mockAssignPetname,
      ...petnamesConfig,
    };

    // Default form configuration
    const defaultFormConfig = {
      values: { address: '0x', petName: '' },
      errors: {},
      isSubmitting: false,
      formState: 'default',
      submissionError: undefined,
      isFormValid: false,
      handleSubmit: jest.fn().mockResolvedValue(undefined),
      getFieldProps: (field: string) => ({
        name: field,
        value: field === 'address' ? '0x' : '',
        onChange: jest.fn(),
        onBlur: jest.fn(),
        error: false,
        helpText: undefined,
      }),
      ...formConfig,
    };

    // Mock implementations
    (usePetnames as jest.Mock).mockReturnValue(defaultPetnamesConfig);
    (useSamplePetnamesForm as jest.Mock).mockReturnValue(defaultFormConfig);

    // Mock metrics
    const trackPetnamesFormViewedMock = jest.fn();
    const trackPetnameAddedMock = jest.fn();
    const trackFormValidationErrorMock = jest.fn();
    const trackFormSubmissionErrorMock = jest.fn();

    (useSamplePetnamesMetrics as jest.Mock).mockReturnValue({
      trackPetnamesFormViewed: trackPetnamesFormViewedMock,
      trackPetnameAdded: trackPetnameAddedMock,
      trackFormValidationError: trackFormValidationErrorMock,
      trackFormSubmissionError: trackFormSubmissionErrorMock,
      ...metricsConfig,
    });

    // Mock performance tracing
    const startTraceMock = jest.fn();
    const endTraceMock = jest.fn();
    const traceFormSubmissionMock = jest.fn().mockReturnValue({
      startTrace: startTraceMock,
      endTrace: endTraceMock,
    });

    (useSamplePerformanceTrace as jest.Mock).mockReturnValue({
      traceFormSubmission: traceFormSubmissionMock,
      ...performanceConfig,
    });

    return {
      store,
      mockAssignPetname,
      trackPetnamesFormViewedMock,
      trackPetnameAddedMock,
      trackFormValidationErrorMock,
      trackFormSubmissionErrorMock,
      startTraceMock,
      endTraceMock,
      traceFormSubmissionMock,
    };
  };

  // Setup valid form values
  const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const validName = 'Valid Name';

  // Define reusable getters for form elements
  const getFormElements = () => ({
    addressInput: screen.getByLabelText('Address'),
    nameInput: screen.getByLabelText('Name'),
    submitButton: screen.getByRole('button', { name: /add pet name/iu }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with empty state when no pet names exist', () => {
    const { store } = setupMocks();
    renderWithProvider(<SamplePetnamesForm />, store);

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
      '0x1234567890abcdef1234567890abcdef12345678': 'TestName1',
      '0xabcdef1234567890abcdef1234567890abcdef12': 'TestName2',
    };

    const { store } = setupMocks({
      petnamesConfig: { namesForCurrentChain: mockNames },
    });

    renderWithProvider(<SamplePetnamesForm />, store);

    expect(screen.getByText('Pet Names on this network')).toBeInTheDocument();
    expect(screen.getByText('TestName1')).toBeInTheDocument();
    expect(screen.getByText('TestName2')).toBeInTheDocument();
    expect(
      screen.queryByText('No pet names added yet'),
    ).not.toBeInTheDocument();
  });

  it('disables submit button with invalid form data', () => {
    const { store } = setupMocks();
    renderWithProvider(<SamplePetnamesForm />, store);

    const { submitButton } = getFormElements();
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when form is valid', () => {
    const { store } = setupMocks({
      formConfig: {
        values: { address: validAddress, petName: validName },
        isFormValid: true,
        getFieldProps: (field: string) => ({
          name: field,
          value: field === 'address' ? validAddress : validName,
          onChange: jest.fn(),
          onBlur: jest.fn(),
          error: false,
          helpText: undefined,
        }),
      },
    });

    renderWithProvider(<SamplePetnamesForm />, store);

    const { submitButton } = getFormElements();
    expect(submitButton).not.toBeDisabled();
  });

  it('calls handleSubmit when form is submitted', async () => {
    const handleSubmitMock = jest.fn().mockResolvedValue(undefined);

    const { store } = setupMocks({
      formConfig: {
        values: { address: validAddress, petName: validName },
        isFormValid: true,
        handleSubmit: handleSubmitMock,
        getFieldProps: (field: string) => ({
          name: field,
          value: field === 'address' ? validAddress : validName,
          onChange: jest.fn(),
          onBlur: jest.fn(),
          error: false,
          helpText: undefined,
        }),
      },
    });

    renderWithProvider(<SamplePetnamesForm />, store);

    const { submitButton } = getFormElements();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(handleSubmitMock).toHaveBeenCalled();
    });
  });

  it('shows submission error when present', () => {
    const errorMessage = 'Something went wrong';

    const { store } = setupMocks({
      formConfig: {
        submissionError: errorMessage,
        formState: 'error',
      },
    });

    renderWithProvider(<SamplePetnamesForm />, store);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows success message when form submission is successful', () => {
    const { store } = setupMocks({
      formConfig: {
        formState: 'success',
      },
    });

    renderWithProvider(<SamplePetnamesForm />, store);

    expect(
      screen.getByText('Pet name added successfully!'),
    ).toBeInTheDocument();
  });

  it('shows form validation errors', () => {
    const addressError = 'Invalid address';
    const nameError = 'Name required';

    const { store } = setupMocks({
      formConfig: {
        errors: { address: addressError, petName: nameError },
        getFieldProps: (field: string) => ({
          name: field,
          value: field === 'address' ? 'invalid' : '',
          onChange: jest.fn(),
          onBlur: jest.fn(),
          error: true,
          helpText: field === 'address' ? addressError : nameError,
        }),
      },
    });

    renderWithProvider(<SamplePetnamesForm />, store);

    expect(screen.getByText(addressError)).toBeInTheDocument();
    expect(screen.getByText(nameError)).toBeInTheDocument();
  });

  it('displays correct button text when submitting', () => {
    const { store } = setupMocks({
      formConfig: {
        isSubmitting: true,
      },
    });

    renderWithProvider(<SamplePetnamesForm />, store);

    expect(
      screen.getByRole('button', { name: 'Adding...' }),
    ).toBeInTheDocument();
  });

  // Integration test that verifies the complete flow
  it('handles the complete form submission flow', async () => {
    const mockAssignPetname = jest.fn().mockResolvedValue(undefined);
    const handleSubmitMock = jest.fn().mockImplementation(async () => {
      await mockAssignPetname(validAddress, validName);
      return undefined;
    });

    // Step 1: Test initial state with valid form data
    const { store } = setupMocks({
      formConfig: {
        values: { address: validAddress, petName: validName },
        isFormValid: true,
        handleSubmit: handleSubmitMock,
        getFieldProps: (field: string) => ({
          name: field,
          value: field === 'address' ? validAddress : validName,
          onChange: jest.fn(),
          onBlur: jest.fn(),
          error: false,
          helpText: undefined,
        }),
      },
      petnamesConfig: {
        namesForCurrentChain: {},
        assignPetname: mockAssignPetname,
      },
    });

    const { unmount } = renderWithProvider(<SamplePetnamesForm />, store);

    // Initial state checks
    const submitButton = screen.getByRole('button', { name: 'Add Pet Name' });
    expect(submitButton).not.toBeDisabled();

    // Submit the form
    fireEvent.click(submitButton);

    // Verify handleSubmit was called
    await waitFor(() => {
      expect(handleSubmitMock).toHaveBeenCalled();
    });

    unmount();

    // Step 2: Test submitting state
    const { store: submittingStore } = setupMocks({
      formConfig: {
        values: { address: validAddress, petName: validName },
        isFormValid: true,
        isSubmitting: true,
        handleSubmit: handleSubmitMock,
        getFieldProps: (field: string) => ({
          name: field,
          value: field === 'address' ? validAddress : validName,
          onChange: jest.fn(),
          onBlur: jest.fn(),
          error: false,
          helpText: undefined,
        }),
      },
      petnamesConfig: {
        namesForCurrentChain: {},
        assignPetname: mockAssignPetname,
      },
    });

    const { unmount: unmountSubmitting } = renderWithProvider(
      <SamplePetnamesForm />,
      submittingStore,
    );

    // Check submitting state
    expect(
      screen.getByRole('button', { name: 'Adding...' }),
    ).toBeInTheDocument();

    unmountSubmitting();

    // Step 3: Test success state
    const { store: successStore } = setupMocks({
      formConfig: {
        values: { address: validAddress, petName: validName },
        isFormValid: true,
        formState: 'success',
        handleSubmit: handleSubmitMock,
        getFieldProps: (field: string) => ({
          name: field,
          value: field === 'address' ? validAddress : validName,
          onChange: jest.fn(),
          onBlur: jest.fn(),
          error: false,
          helpText: undefined,
        }),
      },
      petnamesConfig: {
        namesForCurrentChain: {
          [validAddress]: validName, // Simulate that the pet name has been added
        },
        assignPetname: mockAssignPetname,
      },
    });

    renderWithProvider(<SamplePetnamesForm />, successStore);

    // Check success state
    expect(
      screen.getByText('Pet name added successfully!'),
    ).toBeInTheDocument();

    // Verify the mock was called with correct arguments
    expect(mockAssignPetname).toHaveBeenCalledWith(validAddress, validName);
  });
});

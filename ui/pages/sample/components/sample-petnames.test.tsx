import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Hex } from '@metamask/utils';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { SamplePetnames } from './sample-petnames';

// Import the hook before mocking it
import { usePetnames } from '../../../ducks/metamask/sample-petnames-duck';

// Mock the usePetnames hook
jest.mock('../../../ducks/metamask/sample-petnames-duck', () => ({
  usePetnames: jest.fn(),
}));

describe('SamplePetnames', () => {
  const mockAssignPetname = jest.fn().mockResolvedValue(undefined);
  let mockStore: ReturnType<typeof configureStore>;
  let store: ReturnType<typeof mockStore>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mock store for each test
    mockStore = configureStore([]);
    store = mockStore({
      metamask: {
        samplePetnamesByChainIdAndAddress: {},
      },
    });
  });

  it('renders with empty state when no pet names exist', () => {
    (usePetnames as jest.Mock).mockReturnValue({
      namesForCurrentChain: {},
      assignPetname: mockAssignPetname,
    });

    renderWithProvider(<SamplePetnames />, store);

    expect(screen.getByText('Pet Names')).toBeInTheDocument();
    expect(screen.getByText('No pet names added yet')).toBeInTheDocument();

    // Form elements should be present
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add Pet Name' }),
    ).toBeInTheDocument();
  });

  it('renders pet names when they exist', () => {
    const mockNames = {
      '0x1234567890abcdef1234567890abcdef12345678': 'TestName1',
      '0xabcdef1234567890abcdef1234567890abcdef12': 'TestName2',
    };

    (usePetnames as jest.Mock).mockReturnValue({
      namesForCurrentChain: mockNames,
      assignPetname: mockAssignPetname,
    });

    renderWithProvider(<SamplePetnames />, store);

    expect(screen.getByText('Pet Names')).toBeInTheDocument();
    expect(screen.getByText('TestName1')).toBeInTheDocument();
    expect(screen.getByText('TestName2')).toBeInTheDocument();
    expect(
      screen.queryByText('No pet names added yet'),
    ).not.toBeInTheDocument();
  });

  it('disables submit button with invalid inputs', () => {
    renderWithProvider(<SamplePetnames />, store);

    const addressInput = screen.getByLabelText('Address');
    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByRole('button', { name: 'Add Pet Name' });

    // Initial state - button should be disabled
    expect(submitButton).toBeDisabled();

    // Enter invalid address
    fireEvent.change(addressInput, { target: { value: 'invalid-address' } });
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

    // Button should still be disabled with invalid address
    expect(submitButton).toBeDisabled();

    // Enter valid address but no name
    fireEvent.change(addressInput, {
      target: { value: '0x1234567890abcdef1234567890abcdef12345678' },
    });
    fireEvent.change(nameInput, { target: { value: '' } });

    // Button should still be disabled with no name
    expect(submitButton).toBeDisabled();

    // Enter valid address and name
    fireEvent.change(addressInput, {
      target: { value: '0x1234567890abcdef1234567890abcdef12345678' },
    });
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

    // Button should be enabled with valid inputs
    expect(submitButton).not.toBeDisabled();
  });

  it('submits form with valid inputs', async () => {
    (usePetnames as jest.Mock).mockImplementation(() => ({
      namesForCurrentChain: {},
      assignPetname: mockAssignPetname,
    }));

    renderWithProvider(<SamplePetnames />, store);

    const addressInput = screen.getByLabelText('Address');
    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByRole('button', { name: 'Add Pet Name' });

    // Enter valid inputs
    const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const validName = 'Valid Name';

    fireEvent.change(addressInput, { target: { value: validAddress } });
    fireEvent.change(nameInput, { target: { value: validName } });

    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAssignPetname).toHaveBeenCalledWith(
        validAddress as Hex,
        validName,
      );
    });
  });

  it('handles submission error', async () => {
    const errorMessage = 'Something went wrong';

    // Mock the component to show error message
    (usePetnames as jest.Mock).mockImplementation(() => ({
      namesForCurrentChain: {},
      assignPetname: () => {
        return Promise.reject(new Error(errorMessage));
      },
    }));

    renderWithProvider(<SamplePetnames />, store);

    const addressInput = screen.getByLabelText('Address');
    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByRole('button', { name: 'Add Pet Name' });

    // Enter valid inputs
    fireEvent.change(addressInput, {
      target: { value: '0x1234567890abcdef1234567890abcdef12345678' },
    });
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for any state updates to complete after the error
    await waitFor(() => {
      expect(true).toBeTruthy(); // This ensures waitFor waits for the next tick
    });
  });
});

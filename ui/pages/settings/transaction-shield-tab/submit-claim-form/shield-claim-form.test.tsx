import React from 'react';
import { fireEvent, renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import SubmitClaimForm from './submit-claim-form';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('Submit Claim Form', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({});
  });

  it('should render', () => {
    const { getByTestId } = renderWithProvider(<SubmitClaimForm />, store);

    const submitClaimPage = getByTestId('submit-claim-page');
    expect(submitClaimPage).toBeInTheDocument();
  });

  it('should show error when email is invalid', () => {
    const { getByTestId } = renderWithProvider(<SubmitClaimForm />, store);

    const emailInput = getByTestId('shield-claim-email-input');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    const errorMessage = getByTestId('shield-claim-help-text');
    expect(errorMessage).toHaveTextContent(
      'Please enter a valid email address',
    );
  });

  it('should show error when impacted wallet address is invalid', () => {
    const { getByTestId } = renderWithProvider(<SubmitClaimForm />, store);

    const impactedWalletAddressInput = getByTestId(
      'shield-claim-impacted-wallet-address-input',
    );
    fireEvent.change(impactedWalletAddressInput, {
      target: { value: 'incorrect-address' },
    });
    fireEvent.blur(impactedWalletAddressInput);

    const errorMessage = getByTestId(
      'shield-claim-impacted-wallet-address-help-text',
    );
    expect(errorMessage).toHaveTextContent(
      'Please enter a valid wallet address',
    );
  });

  it('should show error when reimbursement wallet address is invalid', () => {
    const { getByTestId } = renderWithProvider(<SubmitClaimForm />, store);

    const reimbursementWalletAddressInput = getByTestId(
      'shield-claim-reimbursement-wallet-address-input',
    );
    fireEvent.change(reimbursementWalletAddressInput, {
      target: { value: 'incorrect-address' },
    });
    fireEvent.blur(reimbursementWalletAddressInput);

    const errorMessage = getByTestId(
      'shield-claim-reimbursement-wallet-address-help-text',
    );
    expect(errorMessage).toHaveTextContent(
      'Please enter a valid wallet address',
    );
  });

  it('should disable submit button when there are errors', () => {
    const { getByTestId } = renderWithProvider(<SubmitClaimForm />, store);

    const submitButton = getByTestId('shield-claim-submit-button');
    expect(submitButton).toBeDisabled();
  });
});

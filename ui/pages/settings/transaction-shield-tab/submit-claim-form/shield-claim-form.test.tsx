import React from 'react';
import SubmitClaimForm from './submit-claim-form';
import { fireEvent, renderWithProvider } from '../../../../../test/jest';

describe('Submit Claim Form', () => {
  it('should render', () => {
    const { getByTestId } = renderWithProvider(<SubmitClaimForm />);

    const submitClaimPage = getByTestId('submit-claim-page');
    expect(submitClaimPage).toBeInTheDocument();
  });

  it('should show error when email is invalid', () => {
    const { getByTestId } = renderWithProvider(<SubmitClaimForm />);

    const emailInput = getByTestId('shield-claim-email-input');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const errorMessage = getByTestId('shield-claim-help-text');
    expect(errorMessage).toHaveTextContent('Invalid email');
  });

  it('should show error when impacted wallet address is invalid', () => {
    const { getByTestId } = renderWithProvider(<SubmitClaimForm />);

    const impactedWalletAddressInput = getByTestId(
      'shield-claim-impacted-wallet-address-input',
    );
    fireEvent.change(impactedWalletAddressInput, {
      target: { value: 'invalid-impacted-wallet-address' },
    });

    const errorMessage = getByTestId(
      'shield-claim-impacted-wallet-address-help-text',
    );
    expect(errorMessage).toHaveTextContent('Invalid impacted wallet address');
  });

  it('should show error when reimbursement wallet address is invalid', () => {
    const { getByTestId } = renderWithProvider(<SubmitClaimForm />);

    const reimbursementWalletAddressInput = getByTestId(
      'shield-claim-reimbursement-wallet-address-input',
    );
    fireEvent.change(reimbursementWalletAddressInput, {
      target: { value: 'invalid-reimbursement-wallet-address' },
    });

    const errorMessage = getByTestId(
      'shield-claim-reimbursement-wallet-address-help-text',
    );
    expect(errorMessage).toHaveTextContent(
      'Invalid reimbursement wallet address',
    );
  });

  it('should disable submit button when there are errors', () => {
    const { getByTestId } = renderWithProvider(<SubmitClaimForm />);

    const submitButton = getByTestId('shield-claim-submit-button');
    expect(submitButton).toBeDisabled();
  });
});

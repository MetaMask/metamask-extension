import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  SECRET_ESCROW_FACTOR_OPTIONS,
  SecretEscrowFactorKind,
} from '../../../../shared/constants/secret-escrow-factors';
import UnlockFactorPicker from './unlock-factor-picker';

jest.mock('../../../../shared/lib/passkey', () => ({
  ...jest.requireActual('../../../../shared/lib/passkey'),
  getPasskeyAuthMethodKey: jest
    .fn()
    .mockReturnValue('passkeyAuthMethodBiometrics'),
}));

describe('UnlockFactorPicker', () => {
  it('renders options and notifies on select', () => {
    const onSelect = jest.fn();
    const onBack = jest.fn();
    const store = configureMockStore()({ metamask: {} });
    const { getByTestId } = renderWithProvider(
      <UnlockFactorPicker
        options={SECRET_ESCROW_FACTOR_OPTIONS}
        onSelect={onSelect}
        onBack={onBack}
      />,
      store,
    );

    expect(getByTestId('unlock-factor-picker')).toBeInTheDocument();
    fireEvent.click(getByTestId('unlock-factor-option-passkey'));
    expect(onSelect).toHaveBeenCalledWith(SECRET_ESCROW_FACTOR_OPTIONS[0]);

    fireEvent.click(getByTestId('unlock-factor-picker-back-button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('renders manage mode with enrolled factors and continue', () => {
    const onSelect = jest.fn();
    const onContinue = jest.fn();
    const onBack = jest.fn();
    const store = configureMockStore()({ metamask: {} });
    const { getByTestId, queryByTestId } = renderWithProvider(
      <UnlockFactorPicker
        manageMode
        options={[SECRET_ESCROW_FACTOR_OPTIONS[1]]}
        enrolledFactors={[SecretEscrowFactorKind.Passkey]}
        onSelect={onSelect}
        onContinue={onContinue}
        onBack={onBack}
      />,
      store,
    );

    expect(getByTestId('unlock-factor-manager')).toBeInTheDocument();
    expect(getByTestId('unlock-factor-enrolled-passkey')).toBeInTheDocument();
    expect(queryByTestId('unlock-factor-picker-back-button')).toBeNull();
    fireEvent.click(getByTestId('unlock-factor-continue-button'));
    expect(onContinue).toHaveBeenCalled();
  });
});

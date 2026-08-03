import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import SetupTotp from './setup-totp';

jest.mock('@metamask/secret-escrow-client', () => ({
  generateTotpSecret: jest.fn(() => 'JBSWY3DPEHPK3PXP'),
  buildTotpOtpAuthUri: jest.fn(
    () =>
      'otpauth://totp/MetaMask:user%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=MetaMask',
  ),
  verifyTotpCode: jest.fn(async (_secret: string, code: string) => code === '123456'),
}));

describe('SetupTotp', () => {
  it('enrolls after a valid authenticator code', async () => {
    const onComplete = jest.fn().mockResolvedValue(undefined);
    const onBack = jest.fn();
    const store = configureMockStore()({ metamask: {} });
    const { getByTestId } = renderWithProvider(
      <SetupTotp
        accountName="user@example.com"
        onBack={onBack}
        onComplete={onComplete}
      />,
      store,
    );

    expect(getByTestId('setup-totp-secret')).toHaveTextContent(
      'JBSWY3DPEHPK3PXP',
    );

    fireEvent.change(getByTestId('setup-totp-code-input'), {
      target: { value: '123456' },
    });
    fireEvent.click(getByTestId('setup-totp-submit'));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('JBSWY3DPEHPK3PXP');
    });
  });
});

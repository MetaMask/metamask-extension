import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { withMfaUiKit } from './with-mfa-ui-kit';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => <p>{`Navigate to ${to}`}</p>,
}));

const Page = () => <p>MFA page</p>;
const GatedPage = withMfaUiKit(Page);

const renderGatedPage = (enabled: boolean) =>
  renderWithProvider(
    <GatedPage />,
    configureMockStore()({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        remoteFeatureFlags: {
          mfaUiKit: { enabled, minimumVersion: '1.0.0' },
        },
      },
    }),
  );

describe('withMfaUiKit', () => {
  it('shows the page when the flag is on', () => {
    renderGatedPage(true);

    expect(screen.getByText('MFA page')).toBeInTheDocument();
  });

  it('goes back to Security & password when the flag is off', () => {
    renderGatedPage(false);

    expect(screen.queryByText('MFA page')).not.toBeInTheDocument();
    expect(
      screen.getByText(`Navigate to ${SECURITY_AND_PASSWORD_ROUTE}`),
    ).toBeInTheDocument();
  });
});

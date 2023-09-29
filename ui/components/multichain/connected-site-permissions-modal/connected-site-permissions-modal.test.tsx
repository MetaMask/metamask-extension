import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ConnectedSitePermissionsModal } from './connected-site-permissions-modal';

describe('ConnectedSitePermissionsModal', () => {
  const onCloseMock = jest.fn();
  const siteIcon = 'https://example.com/icon.png';
  const siteName = 'https://example.com';

  it('renders correctly', () => {
    const { getByTestId, getByText } = render(
      <ConnectedSitePermissionsModal
        onClose={onCloseMock}
        siteIcon={siteIcon}
        siteName={siteName}
      />,
    );

    expect(getByTestId('connected-site-permissions-modal')).toBeInTheDocument();
    expect(getByText('https://example.com')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const { getByTestId } = render(
      <ConnectedSitePermissionsModal
        onClose={onCloseMock}
        siteIcon={siteIcon}
        siteName={siteName}
      />,
    );

    fireEvent.click(getByTestId('connected-site-permissions-modal-cta-button'));
    expect(onCloseMock).toHaveBeenCalled();
  });
});

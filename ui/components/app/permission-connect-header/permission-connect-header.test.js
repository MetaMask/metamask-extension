import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import PermissionConnectHeader from './permission-connect-header';

describe('Permission Connect Header', () => {
  const mockOriginData = {
    origin: 'https://metamask.github.io',
    iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  };
  const expectedTitle = 'github.io';
  const expectedAltImageText = 'github.io logo';

  it('renders permission connect header', () => {
    const { getByAltText } = renderWithProvider(
      <PermissionConnectHeader
        origin={mockOriginData.origin}
        iconUrl={mockOriginData.iconUrl}
      />,
    );

    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
    expect(screen.getByText(mockOriginData.origin)).toBeInTheDocument();
    expect(getByAltText(expectedAltImageText)).toBeInTheDocument();

    const imgTag = getByAltText(expectedAltImageText);
    expect(imgTag).toHaveAttribute('src', mockOriginData.iconUrl);
  });

  it('renders permission connect header with fallback icon', () => {
    renderWithProvider(
      <PermissionConnectHeader
        origin={mockOriginData.origin}
        iconUrl={undefined}
      />,
    );

    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
    expect(screen.getByText(mockOriginData.origin)).toBeInTheDocument();
    expect(screen.getByText(expectedTitle.charAt(0))).toBeInTheDocument();
  });
});

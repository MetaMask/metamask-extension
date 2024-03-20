import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import PermissionConnectHeader from './permission-connect-header';

describe('Permission Connect Header', () => {
  const mockOriginData = {
    title: 'E2E Test Dapp',
    origin: 'https://metamask.github.io',
    iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  };

  it('renders permission connect header', () => {
    const { getByAltText } = renderWithProvider(
      <PermissionConnectHeader
        title={mockOriginData.title}
        origin={mockOriginData.origin}
        iconUrl={mockOriginData.iconUrl}
      />,
    );

    expect(screen.getByText(mockOriginData.title)).toBeInTheDocument();
    expect(screen.getByText(mockOriginData.origin)).toBeInTheDocument();
    expect(getByAltText('E2E Test Dapp logo')).toBeInTheDocument();

    const imgTag = getByAltText('E2E Test Dapp logo');
    expect(imgTag).toHaveAttribute('src', mockOriginData.iconUrl);
  });

  it('renders permission connect header with fallback icon', () => {
    renderWithProvider(
      <PermissionConnectHeader
        title={mockOriginData.title}
        origin={mockOriginData.origin}
        iconUrl={undefined}
      />,
    );

    expect(screen.getByText(mockOriginData.title)).toBeInTheDocument();
    expect(screen.getByText(mockOriginData.origin)).toBeInTheDocument();
    expect(
      screen.getByText(mockOriginData.title.charAt(0)),
    ).toBeInTheDocument();
  });
});

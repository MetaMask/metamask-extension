import React from 'react';
import { render } from '@testing-library/react';

import { ProductTour } from '.';

describe('DetectedTokensBanner', () => {
  const props = {
    title: 'Permissions',
    description: 'Find your connected accounts and manage permissions here.',
    currentStep: '1',
    totalSteps: '3',
    closeMenu: jest.fn(),
  };
  it('should render correctly', () => {
    const { getByTestId } = render(
      <ProductTour anchorElement={document.body} {...props} />,
    );
    const menuContainer = getByTestId('multichain-product-tour-menu-popover');
    expect(menuContainer).toBeInTheDocument();
  });

  it('should render prev Icon', () => {
    const { getByTestId } = render(
      <ProductTour anchorElement={document.body} {...props} prevIcon />,
    );
    const prevIcon = getByTestId(
      'multichain-product-tour-menu-popover-prevIcon',
    );
    expect(prevIcon).toBeInTheDocument();
  });
  it('should render correct steps', () => {
    const { getByText } = render(
      <ProductTour
        anchorElement={document.body}
        {...props}
        prevIcon
        currentStep={2}
        totalSteps={5}
      />,
    );
    expect(getByText('2 / 5')).toBeInTheDocument();
  });
});

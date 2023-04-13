import React from 'react';
import { render } from '@testing-library/react';

import { ProductTour } from './product-tour-popover';

describe('DetectedTokensBanner', () => {
  const props = {
    prevIcon: true,
    title: 'Permissions',
    description: 'Find your connected accounts and manage permissions here.',
    currentStep: '1',
    totalSteps: '3',
  };
  it('should render correctly', () => {
    const { getByTestId, container } = render(<ProductTour {...props} />);

    expect(getByTestId('multichain-product-tour-popover')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
});

import { render } from '@testing-library/react';
import React from 'react';

import { PickerNetwork } from './picker-network';

describe('PickerNetwork', () => {
  it('should render the label inside the PickerNetwork', () => {
    const { getByTestId } = render(
      <PickerNetwork data-testid="picker-network" label="Imported" />,
    );
    expect(getByTestId('picker-network')).toBeDefined();
    expect(getByTestId('picker-network')).toHaveTextContent('Imported');
  });
});

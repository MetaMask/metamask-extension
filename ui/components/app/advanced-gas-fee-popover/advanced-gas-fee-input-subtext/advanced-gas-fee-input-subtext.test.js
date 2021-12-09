import React from 'react';
import { render, screen } from '@testing-library/react';

import AdvancedGasFeeInputSubtext from './advanced-gas-fee-input-subtext';

describe('AdvancedGasFeeInputSubtext', () => {
  it('should renders latest and historical values passed', () => {
    render(
      <AdvancedGasFeeInputSubtext
        latest="Latest Value"
        historical="Historical value"
      />,
    );

    expect(screen.queryByText('Latest Value')).toBeInTheDocument();
    expect(screen.queryByText('Historical value')).toBeInTheDocument();
  });
});

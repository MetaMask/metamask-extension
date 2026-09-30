import React from 'react';
import { render } from '@testing-library/react';

import { PerpsBalanceActionsSkeleton } from './perps-balance-actions-skeleton';

describe('PerpsBalanceActionsSkeleton', () => {
  it('renders action button placeholders with a pill radius', () => {
    const { getByTestId } = render(<PerpsBalanceActionsSkeleton />);
    const buttons = getByTestId(
      'perps-balance-actions-skeleton',
    ).querySelectorAll('.h-12');

    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => {
      expect(button).toHaveClass('rounded-full');
    });
  });
});

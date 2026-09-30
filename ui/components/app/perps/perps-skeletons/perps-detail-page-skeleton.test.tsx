import React from 'react';
import { render } from '@testing-library/react';

import { PerpsDetailPageSkeleton } from './perps-detail-page-skeleton';

describe('PerpsDetailPageSkeleton', () => {
  it('renders footer action button placeholders with a pill radius', () => {
    const { getByTestId } = render(<PerpsDetailPageSkeleton />);
    const buttons = getByTestId('perps-detail-page-skeleton').querySelectorAll(
      '.h-12',
    );

    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => {
      expect(button).toHaveClass('rounded-full');
    });
  });
});

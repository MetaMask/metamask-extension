import React from 'react';
import { render } from '@testing-library/react';
import { CustomAmountInfoSkeleton } from './custom-amount-info-skeleton';

describe('CustomAmountInfoSkeleton', () => {
  it('renders skeleton components', () => {
    const { getByTestId, queryByTestId } = render(<CustomAmountInfoSkeleton />);

    expect(getByTestId('custom-amount-info-skeleton')).toBeInTheDocument();
    expect(getByTestId('custom-amount-skeleton')).toBeInTheDocument();
    expect(getByTestId('pay-token-amount-skeleton')).toBeInTheDocument();
    expect(
      queryByTestId('percentage-buttons-skeleton'),
    ).not.toBeInTheDocument();
  });

  it('renders the percentage buttons skeleton when the flow displays them', () => {
    const { getByTestId } = render(
      <CustomAmountInfoSkeleton displayPercentageButtons />,
    );

    expect(getByTestId('percentage-buttons-skeleton')).toBeInTheDocument();
  });
});

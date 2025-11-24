import React from 'react';
import { render } from '@testing-library/react';
import { AccountTypeLabel } from './account-type-label';

describe('AccountTypeLabel', () => {
  it('should return null when label is undefined', () => {
    const { container } = render(<AccountTypeLabel label={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render Tag component when label is provided', () => {
    const { container, getByText } = render(
      <AccountTypeLabel label="Native SegWit" />,
    );

    expect(container.firstChild).not.toBeNull();
    expect(getByText('Native SegWit')).toBeInTheDocument();
  });
});

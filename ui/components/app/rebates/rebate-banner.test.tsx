import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { RebateBanner } from './rebate-banner';

describe('RebateBanner', () => {
  it('renders the rebate percentage and copy', () => {
    const { getByTestId } = renderWithProvider(
      <RebateBanner rebatePercent={10} testId="test-rebate-banner" />,
    );

    expect(getByTestId('test-rebate-banner')).toHaveTextContent(
      'You’re getting 10% back on fees',
    );
  });

  it('renders nothing when the rebate is zero', () => {
    const { queryByTestId } = renderWithProvider(
      <RebateBanner rebatePercent={0} testId="test-rebate-banner" />,
    );

    expect(queryByTestId('test-rebate-banner')).not.toBeInTheDocument();
  });
});

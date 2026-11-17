import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { RebateBanner, rebateTooltipInterestSupport } from './rebate-banner';

describe('RebateBanner', () => {
  afterEach(() => {
    rebateTooltipInterestSupport.detected = false;
  });

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

  it('associates the info button with a native hint popover when interest invokers are supported', () => {
    rebateTooltipInterestSupport.detected = true;

    const { getByTestId } = renderWithProvider(
      <RebateBanner rebatePercent={10} testId="test-rebate-banner" />,
    );

    const trigger = getByTestId('test-rebate-banner-tooltip-trigger');
    const tooltip = getByTestId('test-rebate-banner-tooltip');

    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('interestfor', tooltip.id);
    expect(trigger).toHaveAccessibleName('Trading Rewards');
    expect(tooltip).toHaveAttribute('popover', 'hint');
    expect(tooltip).toHaveTextContent('Trading Rewards');
    expect(tooltip).toHaveTextContent(
      'Get 10% of the MetaMask fee on this trade back as a reward',
    );
  });

  it('opens the fallback tooltip on hover and focus when interest invokers are unsupported', async () => {
    const { getByTestId, queryByTestId } = renderWithProvider(
      <RebateBanner rebatePercent={10} testId="test-rebate-banner" />,
    );

    const banner = getByTestId('test-rebate-banner');
    const trigger = getByTestId('test-rebate-banner-tooltip-trigger');

    expect(trigger).not.toHaveAttribute('interestfor');
    expect(queryByTestId('test-rebate-banner-tooltip')).toBeNull();

    fireEvent.mouseEnter(banner);
    const tooltip = getByTestId('test-rebate-banner-tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveTextContent(
      'Get 10% of the MetaMask fee on this trade back as a reward',
    );

    // Moving onto the tooltip keeps it open during the grace period.
    fireEvent.mouseLeave(banner);
    fireEvent.mouseEnter(tooltip);
    expect(getByTestId('test-rebate-banner-tooltip')).toBeInTheDocument();

    // Leaving the tooltip closes it after the grace period.
    fireEvent.mouseLeave(tooltip);
    await waitFor(() =>
      expect(queryByTestId('test-rebate-banner-tooltip')).toBeNull(),
    );
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('opens the fallback tooltip on trigger focus and closes it on blur', async () => {
    const { getByTestId, queryByTestId } = renderWithProvider(
      <RebateBanner rebatePercent={10} testId="test-rebate-banner" />,
    );

    const trigger = getByTestId('test-rebate-banner-tooltip-trigger');

    expect(queryByTestId('test-rebate-banner-tooltip')).toBeNull();

    fireEvent.focus(trigger);
    expect(getByTestId('test-rebate-banner-tooltip')).toBeInTheDocument();
    expect(trigger).toHaveAttribute(
      'aria-describedby',
      getByTestId('test-rebate-banner-tooltip').id,
    );

    fireEvent.blur(trigger);
    await waitFor(() =>
      expect(queryByTestId('test-rebate-banner-tooltip')).toBeNull(),
    );
  });
});

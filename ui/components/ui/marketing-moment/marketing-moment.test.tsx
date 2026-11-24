/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MarketingMoment } from './marketing-moment';
import type { MarketingMomentProps } from './marketing-moment.types';

const onPrimaryClick = jest.fn();
const onSecondaryClick = jest.fn();

const renderMoment = (props: Partial<MarketingMomentProps> = {}) =>
  render(
    <MarketingMoment
      data-testid="marketing-moment"
      title="Perps are here"
      titleProps={{ 'data-testid': 'marketing-moment-title' }}
      description="Long or short with up to 40x leverage."
      descriptionProps={{ 'data-testid': 'marketing-moment-description' }}
      primaryAction={{
        label: 'Get started',
        onClick: onPrimaryClick,
      }}
      secondaryAction={{
        label: 'Not now',
        onClick: onSecondaryClick,
      }}
      {...props}
    />,
  );

describe('MarketingMoment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a string title as a heading and a string description', () => {
    renderMoment();

    expect(screen.getByTestId('marketing-moment-title')).toHaveTextContent(
      'Perps are here',
    );
    expect(screen.getByTestId('marketing-moment-title').tagName).toBe('H1');
    expect(
      screen.getByTestId('marketing-moment-description'),
    ).toHaveTextContent('Long or short with up to 40x leverage.');
  });

  it('replaces the title and description text with custom nodes', () => {
    renderMoment({
      title: <div data-testid="custom-title-node" />,
      description: <div data-testid="custom-description-node" />,
    });

    expect(screen.getByTestId('custom-title-node')).toBeInTheDocument();
    expect(screen.getByTestId('custom-description-node')).toBeInTheDocument();
    expect(
      screen.queryByTestId('marketing-moment-title'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('marketing-moment-description'),
    ).not.toBeInTheDocument();
  });

  it('renders children under the description', () => {
    renderMoment({
      children: <div data-testid="marketing-moment-children" />,
    });

    expect(screen.getByTestId('marketing-moment-children')).toBeInTheDocument();
  });

  it('renders artwork in a box that accepts props', () => {
    renderMoment({
      artwork: <div data-testid="marketing-moment-artwork" />,
      artworkWrapperProps: { id: 'artwork-wrapper' },
    });

    expect(document.getElementById('artwork-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('marketing-moment-artwork')).toBeInTheDocument();
  });

  it('calls the primary action when clicked', () => {
    renderMoment();

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onPrimaryClick).toHaveBeenCalledTimes(1);
  });

  it('calls the dismiss action when clicked', () => {
    renderMoment();

    fireEvent.click(screen.getAllByRole('button')[1]);

    expect(onSecondaryClick).toHaveBeenCalledTimes(1);
  });

  it('keeps the actions outside the scrolling content', () => {
    renderMoment();

    const root = screen.getByTestId('marketing-moment');
    const scroller = root.querySelector('.overflow-y-auto');
    const primary = screen.getAllByRole('button')[0];

    expect(root).toHaveClass('overflow-hidden');
    expect(scroller).not.toBeNull();
    expect(scroller).not.toContainElement(primary);
  });

  it('omits every slot that is not provided', () => {
    renderMoment({
      title: undefined,
      description: undefined,
      primaryAction: undefined,
      secondaryAction: undefined,
    });

    expect(screen.getByTestId('marketing-moment')).toBeInTheDocument();
    expect(
      screen.queryByTestId('marketing-moment-title'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('marketing-moment-description'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

import { it } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrazeBannerCard } from './braze-banner-card';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

describe('BrazeBannerCard', () => {
  const props = {
    title: 'Welcome',
    body: 'Explore your wallet',
    ctaLabel: 'Learn more',
    imageUrl: null,
    onClick: jest.fn(),
    onDismiss: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders the title variant without the extra CTA label', () => {
    render(<BrazeBannerCard {...props} />);

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Explore your wallet')).toBeInTheDocument();
    expect(screen.queryByText('Learn more')).not.toBeInTheDocument();
  });

  it('renders the CTA variant when no title exists', () => {
    render(<BrazeBannerCard {...props} title={null} />);

    expect(screen.getByText('Learn more')).toBeInTheDocument();
  });

  it('dismisses without clicking the campaign', () => {
    render(<BrazeBannerCard {...props} />);

    fireEvent.click(screen.getByTestId('braze-banner-dismiss'));

    expect(props.onDismiss).toHaveBeenCalledTimes(1);
    expect(props.onClick).not.toHaveBeenCalled();
  });

  it('uses a native button for accessible campaign activation', () => {
    render(<BrazeBannerCard {...props} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Welcome Explore your wallet' }),
    );

    expect(props.onClick).toHaveBeenCalledTimes(1);
  });

  it.each(['Welcome', null])(
    'keeps the close button outside the action area for title %s',
    (title) => {
      render(<BrazeBannerCard {...props} title={title} />);

      const spacer = screen.getByTestId('braze-banner-dismiss-spacer');
      expect(spacer).toHaveAttribute('aria-hidden', 'true');
      expect(spacer).toBeEmptyDOMElement();
      expect(screen.getByTestId('braze-banner-action')).toContainElement(
        spacer,
      );
      expect(screen.getByTestId('braze-banner-action')).not.toContainElement(
        screen.getByTestId('braze-banner-dismiss'),
      );
    },
  );

  it('renders a passive card without the CTA when there is no link', () => {
    render(<BrazeBannerCard {...props} title={null} onClick={undefined} />);

    expect(screen.getByTestId('braze-banner-action').tagName).toBe('DIV');
    expect(screen.queryByText('Learn more')).not.toBeInTheDocument();
    expect(screen.getByTestId('braze-banner-dismiss')).not.toBeDisabled();
  });

  it('renders markup from campaigns as text', () => {
    const { container } = render(
      <BrazeBannerCard {...props} body="<script>alert(1)</script>" />,
    );

    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
  });

  it('loads images without a referrer', () => {
    const { container } = render(
      <BrazeBannerCard {...props} imageUrl="https://example.com/image.png" />,
    );

    expect(container.querySelector('img')).toHaveAttribute(
      'referrerpolicy',
      'no-referrer',
    );
  });
});

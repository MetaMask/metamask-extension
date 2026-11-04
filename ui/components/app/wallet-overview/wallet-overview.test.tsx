import React from 'react';
import { render, screen } from '@testing-library/react';

import WalletOverview from './wallet-overview';

const renderWalletOverview = ({
  className,
  align,
}: { className?: string; align?: 'center' | 'start' } = {}) => {
  const { container } = render(
    <WalletOverview
      balance={<span data-testid="balance" />}
      buttons={<span data-testid="buttons" />}
      className={className}
      align={align}
    />,
  );

  return {
    root: container.firstElementChild,
    buttonsContainer: screen.getByTestId('buttons').parentElement,
  };
};

describe('WalletOverview', () => {
  it('renders the balance and the buttons', () => {
    renderWalletOverview();

    expect(screen.getByTestId('balance')).toBeInTheDocument();
    expect(screen.getByTestId('buttons')).toBeInTheDocument();
  });

  it('passes className through to the root element', () => {
    const { root } = renderWalletOverview({ className: 'custom-class' });

    expect(root).toHaveClass('custom-class');
  });

  it('centres the content and caps the width of the buttons by default', () => {
    const { root, buttonsContainer } = renderWalletOverview();

    expect(root).toHaveClass('items-center');
    expect(buttonsContainer).toHaveClass('max-w-[458px]', 'self-center');
  });

  it('left-aligns the content and removes max-width on the buttons when aligned to the start', () => {
    const { root, buttonsContainer } = renderWalletOverview({ align: 'start' });

    expect(root).toHaveClass('items-start');
    expect(buttonsContainer).not.toHaveClass('max-w-[458px]', 'self-center');
  });
});

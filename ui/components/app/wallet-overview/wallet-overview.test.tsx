import React from 'react';
import { render, screen } from '@testing-library/react';

import WalletOverview from './wallet-overview';

const renderWalletOverview = ({ className }: { className?: string } = {}) => {
  const { container } = render(
    <WalletOverview
      balance={<span data-testid="balance" />}
      buttons={<span data-testid="buttons" />}
      className={className}
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

  it('centres the content, and left-aligns it in the wide layout', () => {
    const { root, buttonsContainer } = renderWalletOverview();

    expect(root).toHaveClass('items-center', 'wide-layout:items-start');
    expect(buttonsContainer).toHaveClass(
      'max-w-[458px]',
      'self-center',
      'wide-layout:max-w-none',
      'wide-layout:self-start',
    );
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';

import { useFullScreenDesign } from '../../../hooks/useFullScreenDesign';
import WalletOverview from './wallet-overview';

jest.mock('../../../hooks/useFullScreenDesign');

const mockUseFullScreenDesign = jest.mocked(useFullScreenDesign);

const renderWalletOverview = (className?: string) => {
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
  beforeEach(() => {
    mockUseFullScreenDesign.mockReturnValue(false);
  });

  it('renders the balance and the buttons', () => {
    renderWalletOverview();

    expect(screen.getByTestId('balance')).toBeInTheDocument();
    expect(screen.getByTestId('buttons')).toBeInTheDocument();
  });

  it('passes className through to the root element', () => {
    const { root } = renderWalletOverview('custom-class');

    expect(root).toHaveClass('custom-class');
  });

  it('centres the content and caps the width of the buttons by default', () => {
    const { root, buttonsContainer } = renderWalletOverview();

    expect(root).toHaveClass('items-center');
    expect(buttonsContainer).toHaveClass('max-w-[458px]', 'self-center');
  });

  it('left-aligns the content and removes max-width on the buttons in the fullscreen design', () => {
    mockUseFullScreenDesign.mockReturnValue(true);

    const { root, buttonsContainer } = renderWalletOverview();

    expect(root).toHaveClass('items-start');
    expect(buttonsContainer).not.toHaveClass('max-w-[458px]', 'self-center');
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  MAX_SELECTED_ALLOWED_TOKENS,
  MIN_SELECTED_ALLOWED_TOKENS,
} from '../../../../../constants/batch-sell';
import { Footer } from './Footer';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: unknown[]) =>
    args ? `${key}:${args.join(',')}` : key,
}));

const ids = (n: number) => Array.from({ length: n }, (_, i) => `asset-${i}`);

describe('Footer', () => {
  it('renders the container with the correct test id', () => {
    render(<Footer selectedAssetsId={[]} onSubmit={jest.fn()} />);

    expect(screen.getByTestId('batch-sell-select-footer')).toBeInTheDocument();
  });

  describe('button text', () => {
    it('shows "next" when no assets are selected', () => {
      render(<Footer selectedAssetsId={[]} onSubmit={jest.fn()} />);

      expect(screen.getByText('next')).toBeInTheDocument();
    });

    it('shows single-asset label when exactly MIN_SELECTED_ALLOWED_TOKENS - 1 assets are selected', () => {
      render(
        <Footer
          selectedAssetsId={ids(MIN_SELECTED_ALLOWED_TOKENS - 1)}
          onSubmit={jest.fn()}
        />,
      );

      expect(
        screen.getByText(
          `batchSellContinueNAssetsCTASingle:${MIN_SELECTED_ALLOWED_TOKENS - 1}`,
        ),
      ).toBeInTheDocument();
    });

    it('shows plural label when exactly MIN_SELECTED_ALLOWED_TOKENS assets are selected', () => {
      render(
        <Footer
          selectedAssetsId={ids(MIN_SELECTED_ALLOWED_TOKENS)}
          onSubmit={jest.fn()}
        />,
      );

      expect(
        screen.getByText(
          `batchSellContinueNAssetsCTAPlural:${MIN_SELECTED_ALLOWED_TOKENS}`,
        ),
      ).toBeInTheDocument();
    });

    it('shows plural label when MAX_SELECTED_ALLOWED_TOKENS assets are selected', () => {
      render(
        <Footer
          selectedAssetsId={ids(MAX_SELECTED_ALLOWED_TOKENS)}
          onSubmit={jest.fn()}
        />,
      );

      expect(
        screen.getByText(
          `batchSellContinueNAssetsCTAPlural:${MAX_SELECTED_ALLOWED_TOKENS}`,
        ),
      ).toBeInTheDocument();
    });

    it('shows max-exceeded label when more than MAX_SELECTED_ALLOWED_TOKENS assets are selected', () => {
      render(
        <Footer
          selectedAssetsId={ids(MAX_SELECTED_ALLOWED_TOKENS + 1)}
          onSubmit={jest.fn()}
        />,
      );

      expect(
        screen.getByText(
          `batchSellMaxSelectedTokens:${MAX_SELECTED_ALLOWED_TOKENS}`,
        ),
      ).toBeInTheDocument();
    });
  });

  describe('button disabled state', () => {
    it('is disabled when no assets are selected', () => {
      render(<Footer selectedAssetsId={[]} onSubmit={jest.fn()} />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is enabled when at least one and at most MAX_SELECTED_ALLOWED_TOKENS assets are selected', () => {
      render(
        <Footer
          selectedAssetsId={ids(MAX_SELECTED_ALLOWED_TOKENS)}
          onSubmit={jest.fn()}
        />,
      );

      expect(screen.getByRole('button')).toBeEnabled();
    });

    it('is disabled when more than MAX_SELECTED_ALLOWED_TOKENS assets are selected', () => {
      render(
        <Footer
          selectedAssetsId={ids(MAX_SELECTED_ALLOWED_TOKENS + 1)}
          onSubmit={jest.fn()}
        />,
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('onSubmit', () => {
    it('calls onSubmit when the button is clicked and selection is valid', () => {
      const onSubmit = jest.fn();

      render(
        <Footer
          selectedAssetsId={ids(MIN_SELECTED_ALLOWED_TOKENS)}
          onSubmit={onSubmit}
        />,
      );

      fireEvent.click(screen.getByRole('button'));

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('does not call onSubmit when the button is disabled (empty selection)', () => {
      const onSubmit = jest.fn();

      render(<Footer selectedAssetsId={[]} onSubmit={onSubmit} />);

      fireEvent.click(screen.getByRole('button'));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when the button is disabled (too many selected)', () => {
      const onSubmit = jest.fn();

      render(
        <Footer
          selectedAssetsId={ids(MAX_SELECTED_ALLOWED_TOKENS + 1)}
          onSubmit={onSubmit}
        />,
      );

      fireEvent.click(screen.getByRole('button'));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});

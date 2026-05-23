import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Footer } from './footer';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

describe('Footer', () => {
  describe('review mode (default)', () => {
    it('renders the review label', () => {
      render(
        <Footer
          areQuotesRefreshExpired={false}
          reviewIsDisabled={false}
          onReviewClick={jest.fn()}
        />,
      );

      expect(screen.getByText('review')).toBeInTheDocument();
    });

    it('renders an enabled button when reviewIsDisabled is false', () => {
      render(
        <Footer
          areQuotesRefreshExpired={false}
          reviewIsDisabled={false}
          onReviewClick={jest.fn()}
        />,
      );

      expect(screen.getByRole('button')).toBeEnabled();
    });

    it('renders a disabled button when reviewIsDisabled is true', () => {
      render(
        <Footer
          areQuotesRefreshExpired={false}
          reviewIsDisabled
          onReviewClick={jest.fn()}
        />,
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('calls onReviewClick when the button is clicked', () => {
      const onReviewClick = jest.fn();

      render(
        <Footer
          areQuotesRefreshExpired={false}
          reviewIsDisabled={false}
          onReviewClick={onReviewClick}
        />,
      );

      fireEvent.click(screen.getByRole('button'));

      expect(onReviewClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onReviewClick when the disabled button is clicked', () => {
      const onReviewClick = jest.fn();

      render(
        <Footer
          areQuotesRefreshExpired={false}
          reviewIsDisabled
          onReviewClick={onReviewClick}
        />,
      );

      fireEvent.click(screen.getByRole('button'));

      expect(onReviewClick).not.toHaveBeenCalled();
    });
  });

  describe('get new quotes mode (areQuotesRefreshExpired)', () => {
    it('renders the get new quotes label when areQuotesRefreshExpired is true', () => {
      render(
        <Footer
          reviewIsDisabled={false}
          onReviewClick={jest.fn()}
          areQuotesRefreshExpired
          onGetNewQuotesClick={jest.fn()}
        />,
      );

      expect(screen.getByText('batchSellGetNewQuotes')).toBeInTheDocument();
    });

    it('does not render the review label when areQuotesRefreshExpired is true', () => {
      render(
        <Footer
          reviewIsDisabled={false}
          onReviewClick={jest.fn()}
          areQuotesRefreshExpired
          onGetNewQuotesClick={jest.fn()}
        />,
      );

      expect(screen.queryByText('review')).not.toBeInTheDocument();
    });

    it('renders an enabled button when areQuotesRefreshExpired is true', () => {
      render(
        <Footer
          reviewIsDisabled={false}
          onReviewClick={jest.fn()}
          areQuotesRefreshExpired
          onGetNewQuotesClick={jest.fn()}
        />,
      );

      expect(screen.getByRole('button')).toBeEnabled();
    });

    it('calls onGetNewQuotesClick when the button is clicked', () => {
      const onGetNewQuotesClick = jest.fn();
      const onReviewClick = jest.fn();

      render(
        <Footer
          reviewIsDisabled={false}
          onReviewClick={onReviewClick}
          areQuotesRefreshExpired
          onGetNewQuotesClick={onGetNewQuotesClick}
        />,
      );

      fireEvent.click(screen.getByRole('button'));

      expect(onGetNewQuotesClick).toHaveBeenCalledTimes(1);
      expect(onReviewClick).not.toHaveBeenCalled();
    });
  });
});

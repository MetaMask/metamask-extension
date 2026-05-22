import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Footer } from './footer';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

describe('Footer', () => {
  it('renders the review label', () => {
    render(<Footer reviewIsDisabled={false} onReviewClick={jest.fn()} />);

    expect(screen.getByText('review')).toBeInTheDocument();
  });

  it('renders an enabled button when reviewIsDisabled is false', () => {
    render(<Footer reviewIsDisabled={false} onReviewClick={jest.fn()} />);

    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('renders a disabled button when reviewIsDisabled is true', () => {
    render(<Footer reviewIsDisabled onReviewClick={jest.fn()} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onReviewClick when the button is clicked', () => {
    const onReviewClick = jest.fn();

    render(<Footer reviewIsDisabled={false} onReviewClick={onReviewClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onReviewClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onReviewClick when the disabled button is clicked', () => {
    const onReviewClick = jest.fn();

    render(<Footer reviewIsDisabled onReviewClick={onReviewClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onReviewClick).not.toHaveBeenCalled();
  });
});

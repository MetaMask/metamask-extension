import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  PERPS_SENTIMENT_ICON_SIZE_MD,
  PerpsSentimentSatisfiedIcon,
} from './perps-sentiment-satisfied-icon';

describe('PerpsSentimentSatisfiedIcon', () => {
  it('renders the local sentiment-satisfied glyph', () => {
    render(<PerpsSentimentSatisfiedIcon />);

    expect(
      screen.getByTestId('perps-sentiment-satisfied-icon'),
    ).toBeInTheDocument();
  });

  it('uses the requested size', () => {
    render(<PerpsSentimentSatisfiedIcon size={PERPS_SENTIMENT_ICON_SIZE_MD} />);

    expect(
      screen.getByTestId('perps-sentiment-satisfied-icon'),
    ).toHaveAttribute('width', String(PERPS_SENTIMENT_ICON_SIZE_MD));
  });
});

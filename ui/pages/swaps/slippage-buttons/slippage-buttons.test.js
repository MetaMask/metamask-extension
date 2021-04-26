import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import SlippageButtons from '.';

const createProps = (customProps = {}) => {
  return {
    onSelect: jest.fn(),
    maxAllowedSlippage: 15,
    currentSlippage: 3,
    ...customProps,
  };
};

describe('SlippageButtons', () => {
  it('renders the component with initial props', () => {
    const { getByText } = renderWithProvider(
      <SlippageButtons {...createProps()} />,
    );
    expect(getByText('2%')).toBeInTheDocument();
    expect(getByText('3%')).toBeInTheDocument();
    expect(getByText('custom')).toBeInTheDocument();
    expect(getByText('Advanced Options')).toBeInTheDocument();
    expect(
      document.querySelector('.slippage-buttons__header'),
    ).toMatchSnapshot();
    expect(
      document.querySelector('.slippage-buttons__button-group'),
    ).toMatchSnapshot();
  });
});

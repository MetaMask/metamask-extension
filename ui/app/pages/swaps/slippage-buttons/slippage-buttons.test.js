import React from 'react';

import { renderWithProvider } from '../../../../../test/jest';
import SlippageButtons from '.';

describe('SlippageButtons', () => {
  const createProps = (customProps = {}) => {
    return {
      onSelect: jest.fn(),
      maxAllowedSlippage: 15,
      currentSlippage: 3,
      ...customProps,
    };
  };

  it('renders the component with initial props', () => {
    const { container, getByText } = renderWithProvider(
      <SlippageButtons {...createProps()} />,
    );
    expect(getByText('2%')).toBeInTheDocument();
    expect(getByText('3%')).toBeInTheDocument();
    expect(getByText('[swapCustom]')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});

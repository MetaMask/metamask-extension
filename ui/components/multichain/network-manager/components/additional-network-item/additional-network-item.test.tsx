import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import { AdditionalNetworkItem } from './additional-network-item';

describe('AdditionalNetworkItem', () => {
  const mockProps = {
    name: 'Test Network',
    src: './images/test-network.svg',
    onClick: jest.fn(),
  };

  const renderComponent = (props = {}) => {
    const store = configureStore({});
    return renderWithProvider(
      <AdditionalNetworkItem {...mockProps} {...props} />,
      store,
    );
  };

  it('renders correctly with required props', () => {
    const { getByText, getByTestId } = renderComponent();

    expect(getByText('Test Network')).toBeInTheDocument();
    expect(getByTestId('additional-network-item')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('additional-network-item'));
    expect(mockProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('renders with custom className', () => {
    const { getByTestId } = renderComponent({ className: 'custom-class' });

    expect(getByTestId('additional-network-item')).toHaveClass('custom-class');
  });

  it('renders with custom aria label for add button', () => {
    const { getByLabelText } = renderComponent({
      addButtonAriaLabel: 'Custom Add Label',
    });

    expect(getByLabelText('Custom Add Label')).toBeInTheDocument();
  });
});

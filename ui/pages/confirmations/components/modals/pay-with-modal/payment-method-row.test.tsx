import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { PaymentMethodRow } from './payment-method-row';

const renderRow = (
  props: Partial<React.ComponentProps<typeof PaymentMethodRow>> = {},
) =>
  renderWithProvider(
    <PaymentMethodRow
      id="row-1"
      icon={<span data-testid="row-icon" />}
      title="Money account"
      {...props}
    />,
    configureStore(mockState),
  );

describe('PaymentMethodRow', () => {
  it('renders title, subtitle, and icon slot', () => {
    renderRow({
      subtitle: '$7.05 available',
      testId: 'payment-method-row',
    });

    expect(screen.getByTestId('payment-method-row')).toBeInTheDocument();
    expect(screen.getByTestId('payment-method-row-title')).toHaveTextContent(
      'Money account',
    );
    expect(screen.getByTestId('payment-method-row-subtitle')).toHaveTextContent(
      '$7.05 available',
    );
    expect(
      screen.getByTestId('payment-method-row-icon-slot'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('row-icon')).toBeInTheDocument();
  });

  it('uses a default test id derived from the row id', () => {
    renderRow();

    expect(screen.getByTestId('payment-method-row-row-1')).toBeInTheDocument();
  });

  it('invokes onPress when clicked', () => {
    const onPress = jest.fn();
    renderRow({ onPress, testId: 'payment-method-row' });

    fireEvent.click(screen.getByTestId('payment-method-row'));

    expect(onPress).toHaveBeenCalled();
  });

  it('renders a checkmark trailing element when selected', () => {
    renderRow({
      trailingElement: 'checkmark',
      isSelected: true,
      testId: 'payment-method-row',
    });

    expect(
      screen.getByTestId('payment-method-row-checkmark'),
    ).toBeInTheDocument();
  });

  it('renders a chevron trailing element', () => {
    renderRow({
      trailingElement: 'chevron',
      testId: 'payment-method-row',
    });

    expect(
      screen.getByTestId('payment-method-row-chevron'),
    ).toBeInTheDocument();
  });

  it('renders no trailing element by default', () => {
    renderRow({ testId: 'payment-method-row' });

    expect(
      screen.queryByTestId('payment-method-row-checkmark'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('payment-method-row-chevron'),
    ).not.toBeInTheDocument();
  });

  it('omits subtitle when not provided', () => {
    renderRow({ testId: 'payment-method-row' });

    expect(
      screen.queryByTestId('payment-method-row-subtitle'),
    ).not.toBeInTheDocument();
  });
});

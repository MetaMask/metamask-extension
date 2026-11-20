import React, { type ReactNode } from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { LowValueAssetsToggle } from './low-value-assets-toggle';

describe('LowValueAssetsToggle', () => {
  const renderToggle = (props: {
    count?: number;
    isExpanded?: boolean;
    onClick?: () => void;
    trailing?: ReactNode;
  }) =>
    renderWithProvider(
      <LowValueAssetsToggle
        count={props.count ?? 3}
        isExpanded={props.isExpanded ?? false}
        onClick={props.onClick ?? jest.fn()}
        trailing={props.trailing}
      />,
      configureStore({}),
    );

  it('renders the low value assets label with the count', () => {
    const { getByTestId } = renderToggle({ count: 7 });

    expect(getByTestId('low-value-assets-toggle')).toHaveTextContent(
      'Low balance tokens (7)',
    );
  });

  it('sets aria-expanded to false when collapsed', () => {
    const { getByTestId } = renderToggle({ isExpanded: false });

    expect(getByTestId('low-value-assets-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('sets aria-expanded to true when expanded', () => {
    const { getByTestId } = renderToggle({ isExpanded: true });

    expect(getByTestId('low-value-assets-toggle')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    const { getByTestId } = renderToggle({ onClick });

    fireEvent.click(getByTestId('low-value-assets-toggle'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps a trailing control from expanding the section', () => {
    const onClick = jest.fn();
    const onTrailingClick = jest.fn();
    const { getByTestId } = renderToggle({
      onClick,
      trailing: (
        <button
          type="button"
          data-testid="trailing-control"
          onClick={onTrailingClick}
        >
          Redeem
        </button>
      ),
    });

    fireEvent.click(getByTestId('trailing-control'));

    expect(onTrailingClick).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});

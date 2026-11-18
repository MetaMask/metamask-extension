import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import {
  PercentageButtons,
  PercentageButtonsSkeleton,
} from './percentage-buttons';

const mockStore = configureStore({
  metamask: {},
});

describe('PercentageButtons', () => {
  it('renders 10%, 25%, 50%, and 90% by default', () => {
    const onPercentageClick = jest.fn();
    const { getByTestId, queryByTestId } = renderWithProvider(
      <PercentageButtons onPercentageClick={onPercentageClick} />,
      mockStore,
    );

    expect(getByTestId('percentage-buttons')).toBeInTheDocument();
    expect(getByTestId('percentage-button-10')).toHaveTextContent('10%');
    expect(getByTestId('percentage-button-25')).toHaveTextContent('25%');
    expect(getByTestId('percentage-button-50')).toHaveTextContent('50%');
    expect(getByTestId('percentage-button-90')).toHaveTextContent('90%');
    expect(queryByTestId('percentage-button-100')).not.toBeInTheDocument();
  });

  it('replaces 90% with Max when hasMax is true', () => {
    const onPercentageClick = jest.fn();
    const { getByTestId, queryByTestId } = renderWithProvider(
      <PercentageButtons hasMax onPercentageClick={onPercentageClick} />,
      mockStore,
    );

    expect(getByTestId('percentage-button-10')).toHaveTextContent('10%');
    expect(getByTestId('percentage-button-25')).toHaveTextContent('25%');
    expect(getByTestId('percentage-button-50')).toHaveTextContent('50%');
    expect(getByTestId('percentage-button-100')).toHaveTextContent('Max');
    expect(queryByTestId('percentage-button-90')).not.toBeInTheDocument();
  });

  it('calls onPercentageClick with the selected percentage', () => {
    const onPercentageClick = jest.fn();
    const { getByTestId } = renderWithProvider(
      <PercentageButtons hasMax onPercentageClick={onPercentageClick} />,
      mockStore,
    );

    fireEvent.click(getByTestId('percentage-button-10'));
    expect(onPercentageClick).toHaveBeenCalledWith(10);

    fireEvent.click(getByTestId('percentage-button-25'));
    expect(onPercentageClick).toHaveBeenCalledWith(25);

    fireEvent.click(getByTestId('percentage-button-50'));
    expect(onPercentageClick).toHaveBeenCalledWith(50);

    fireEvent.click(getByTestId('percentage-button-100'));
    expect(onPercentageClick).toHaveBeenCalledWith(100);
  });

  it('does not call onPercentageClick when disabled', () => {
    const onPercentageClick = jest.fn();
    const { getByTestId } = renderWithProvider(
      <PercentageButtons disabled onPercentageClick={onPercentageClick} />,
      mockStore,
    );

    fireEvent.click(getByTestId('percentage-button-50'));
    expect(onPercentageClick).not.toHaveBeenCalled();
  });
});

describe('PercentageButtonsSkeleton', () => {
  it('renders skeleton placeholder', () => {
    const { getByTestId } = renderWithProvider(
      <PercentageButtonsSkeleton />,
      mockStore,
    );

    expect(getByTestId('percentage-buttons-skeleton')).toBeInTheDocument();
  });
});

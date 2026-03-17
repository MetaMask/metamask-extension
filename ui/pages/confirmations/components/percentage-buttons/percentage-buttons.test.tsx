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
  it('renders all percentage buttons', () => {
    const onPercentageClick = jest.fn();
    const { getByTestId } = renderWithProvider(
      <PercentageButtons onPercentageClick={onPercentageClick} />,
      mockStore,
    );

    expect(getByTestId('percentage-buttons')).toBeInTheDocument();
    expect(getByTestId('percentage-button-25')).toBeInTheDocument();
    expect(getByTestId('percentage-button-50')).toBeInTheDocument();
    expect(getByTestId('percentage-button-75')).toBeInTheDocument();
    expect(getByTestId('percentage-button-100')).toBeInTheDocument();
  });

  it('displays correct labels for percentage buttons', () => {
    const onPercentageClick = jest.fn();
    const { getByTestId } = renderWithProvider(
      <PercentageButtons onPercentageClick={onPercentageClick} />,
      mockStore,
    );

    expect(getByTestId('percentage-button-25')).toHaveTextContent('25%');
    expect(getByTestId('percentage-button-50')).toHaveTextContent('50%');
    expect(getByTestId('percentage-button-75')).toHaveTextContent('75%');
    expect(getByTestId('percentage-button-100')).toHaveTextContent('Max');
  });

  it('calls onPercentageClick with correct percentage when clicked', () => {
    const onPercentageClick = jest.fn();
    const { getByTestId } = renderWithProvider(
      <PercentageButtons onPercentageClick={onPercentageClick} />,
      mockStore,
    );

    fireEvent.click(getByTestId('percentage-button-25'));
    expect(onPercentageClick).toHaveBeenCalledWith(25);

    fireEvent.click(getByTestId('percentage-button-50'));
    expect(onPercentageClick).toHaveBeenCalledWith(50);

    fireEvent.click(getByTestId('percentage-button-75'));
    expect(onPercentageClick).toHaveBeenCalledWith(75);

    fireEvent.click(getByTestId('percentage-button-100'));
    expect(onPercentageClick).toHaveBeenCalledWith(100);
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

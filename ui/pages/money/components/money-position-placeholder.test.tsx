import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { MoneyPositionPlaceholder } from './money-position-placeholder';

describe('MoneyPositionPlaceholder', () => {
  it('renders the monthly and lifetime earnings', () => {
    renderWithLocalization(
      <MoneyPositionPlaceholder
        monthlyEarnings="+$1.23"
        lifetimeEarnings="+$4.56"
        isMonthlyLoading={false}
        isLifetimeLoading={false}
      />,
    );

    expect(
      screen.getByTestId('money-position-monthly-value'),
    ).toHaveTextContent('+$1.23');
    expect(screen.getByTestId('money-position-monthly-value')).toHaveClass(
      'text-success-default',
    );
    expect(
      screen.getByTestId('money-position-lifetime-value'),
    ).toHaveTextContent('+$4.56');
    expect(screen.getByTestId('money-position-lifetime-value')).toHaveClass(
      'text-success-default',
    );
  });

  it('renders skeletons during the initial load', () => {
    renderWithLocalization(
      <MoneyPositionPlaceholder
        monthlyEarnings="$0.00"
        lifetimeEarnings="$0.00"
        isMonthlyLoading
        isLifetimeLoading
      />,
    );

    expect(
      screen.getByTestId('money-position-monthly-skeleton'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-position-lifetime-skeleton'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('money-position-monthly-value'),
    ).not.toBeInTheDocument();
  });

  it('keeps a loaded row visible while the other row is loading', () => {
    renderWithLocalization(
      <MoneyPositionPlaceholder
        monthlyEarnings="+$1.23"
        lifetimeEarnings="$0.00"
        isMonthlyLoading={false}
        isLifetimeLoading
      />,
    );

    expect(
      screen.getByTestId('money-position-monthly-value'),
    ).toHaveTextContent('+$1.23');
    expect(
      screen.getByTestId('money-position-lifetime-skeleton'),
    ).toBeInTheDocument();
  });

  it('does not use the success color for non-positive earnings', () => {
    renderWithLocalization(
      <MoneyPositionPlaceholder
        monthlyEarnings="$0.00"
        lifetimeEarnings="-$1.23"
        isMonthlyLoading={false}
        isLifetimeLoading={false}
      />,
    );

    expect(screen.getByTestId('money-position-monthly-value')).not.toHaveClass(
      'text-success-default',
    );
    expect(screen.getByTestId('money-position-lifetime-value')).not.toHaveClass(
      'text-success-default',
    );
  });
});

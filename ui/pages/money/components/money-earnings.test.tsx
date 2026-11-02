import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { MoneyEarnings } from './money-earnings';

describe('MoneyEarnings', () => {
  it('renders the monthly and lifetime earnings', () => {
    renderWithLocalization(
      <MoneyEarnings
        monthlyEarnings="+$1.23"
        lifetimeEarnings="+$4.56"
        isMonthlyLoading={false}
        isLifetimeLoading={false}
      />,
    );

    expect(
      screen.getByTestId('money-earnings-monthly-value'),
    ).toHaveTextContent('+$1.23');
    expect(screen.getByTestId('money-earnings-monthly-value')).toHaveClass(
      'text-success-default',
    );
    expect(
      screen.getByTestId('money-earnings-lifetime-value'),
    ).toHaveTextContent('+$4.56');
    expect(screen.getByTestId('money-earnings-lifetime-value')).toHaveClass(
      'text-success-default',
    );
  });

  it('hides the earnings and their sign colour when privacy mode is on', () => {
    renderWithLocalization(
      <MoneyEarnings
        monthlyEarnings="+$1.23"
        lifetimeEarnings="+$4.56"
        isMonthlyLoading={false}
        isLifetimeLoading={false}
        privacyMode
      />,
    );

    expect(
      screen.getByTestId('money-earnings-monthly-value'),
    ).not.toHaveTextContent('+$1.23');
    expect(screen.getByTestId('money-earnings-monthly-value')).not.toHaveClass(
      'text-success-default',
    );
    expect(
      screen.getByTestId('money-earnings-lifetime-value'),
    ).not.toHaveTextContent('+$4.56');
    expect(screen.getByTestId('money-earnings-lifetime-value')).not.toHaveClass(
      'text-success-default',
    );
  });

  it('renders skeletons during the initial load', () => {
    renderWithLocalization(
      <MoneyEarnings
        monthlyEarnings="$0.00"
        lifetimeEarnings="$0.00"
        isMonthlyLoading
        isLifetimeLoading
      />,
    );

    expect(
      screen.getByTestId('money-earnings-monthly-skeleton'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-earnings-lifetime-skeleton'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('money-earnings-monthly-value'),
    ).not.toBeInTheDocument();
  });

  it('keeps a loaded row visible while the other row is loading', () => {
    renderWithLocalization(
      <MoneyEarnings
        monthlyEarnings="+$1.23"
        lifetimeEarnings="$0.00"
        isMonthlyLoading={false}
        isLifetimeLoading
      />,
    );

    expect(
      screen.getByTestId('money-earnings-monthly-value'),
    ).toHaveTextContent('+$1.23');
    expect(
      screen.getByTestId('money-earnings-lifetime-skeleton'),
    ).toBeInTheDocument();
  });

  it('omits the lifetime row when lifetime earnings are unavailable', () => {
    renderWithLocalization(
      <MoneyEarnings
        monthlyEarnings="+$1.23"
        isMonthlyLoading={false}
        isLifetimeLoading={false}
      />,
    );

    expect(
      screen.getByTestId('money-earnings-monthly-value'),
    ).toHaveTextContent('+$1.23');
    expect(
      screen.queryByTestId('money-earnings-lifetime'),
    ).not.toBeInTheDocument();
  });

  it('shows the lifetime skeleton while unavailable lifetime earnings load', () => {
    renderWithLocalization(
      <MoneyEarnings
        monthlyEarnings="+$1.23"
        isMonthlyLoading={false}
        isLifetimeLoading
      />,
    );

    expect(
      screen.getByTestId('money-earnings-monthly-value'),
    ).toHaveTextContent('+$1.23');
    expect(
      screen.getByTestId('money-earnings-lifetime-skeleton'),
    ).toBeInTheDocument();
  });

  it('keeps a zero lifetime earnings row visible', () => {
    renderWithLocalization(
      <MoneyEarnings
        monthlyEarnings="+$1.23"
        lifetimeEarnings="$0.00"
        isMonthlyLoading={false}
        isLifetimeLoading={false}
      />,
    );

    expect(
      screen.getByTestId('money-earnings-lifetime-value'),
    ).toHaveTextContent('$0.00');
  });

  it('does not use the success color for non-positive earnings', () => {
    renderWithLocalization(
      <MoneyEarnings
        monthlyEarnings="$0.00"
        lifetimeEarnings="-$1.23"
        isMonthlyLoading={false}
        isLifetimeLoading={false}
      />,
    );

    expect(screen.getByTestId('money-earnings-monthly-value')).not.toHaveClass(
      'text-success-default',
    );
    expect(screen.getByTestId('money-earnings-lifetime-value')).not.toHaveClass(
      'text-success-default',
    );
  });
});

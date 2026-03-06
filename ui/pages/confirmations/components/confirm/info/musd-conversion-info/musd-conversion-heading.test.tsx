/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { MusdConversionHeading } from './musd-conversion-heading';

jest.mock('../../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, values?: string[]) => {
    const translations: Record<string, string> = {
      musdConvertAndGetBonus: 'Convert and get 3%',
      musdBonusExplanation: `You will receive a ${values?.[0] ?? ''}% bonus`,
      info: 'Info',
    };
    return translations[key] ?? key;
  },
}));

jest.mock('../../../../../../components/app/musd/constants', () => ({
  MUSD_CONVERSION_APY: 3,
}));

describe('MusdConversionHeading', () => {
  it('renders the heading text', () => {
    render(<MusdConversionHeading />);

    expect(
      screen.getByTestId('musd-conversion-heading-title'),
    ).toHaveTextContent('Convert and get 3%');
  });

  it('renders the container box', () => {
    render(<MusdConversionHeading />);

    expect(screen.getByTestId('musd-conversion-heading')).toBeInTheDocument();
  });

  it('renders the info button', () => {
    render(<MusdConversionHeading />);

    expect(
      screen.getByTestId('musd-conversion-heading-info-button'),
    ).toBeInTheDocument();
  });

  it('opens tooltip when info button is clicked', () => {
    render(<MusdConversionHeading />);

    const infoButton = screen.getByTestId(
      'musd-conversion-heading-info-button',
    );
    fireEvent.click(infoButton);

    expect(screen.getByText('You will receive a 3% bonus')).toBeInTheDocument();
  });

  it('closes tooltip on second click (toggle)', () => {
    render(<MusdConversionHeading />);

    const infoButton = screen.getByTestId(
      'musd-conversion-heading-info-button',
    );

    fireEvent.click(infoButton);
    expect(screen.getByText('You will receive a 3% bonus')).toBeInTheDocument();

    fireEvent.click(infoButton);
    expect(
      screen.queryByText('You will receive a 3% bonus'),
    ).not.toBeInTheDocument();
  });

  it('info button has accessible aria-label', () => {
    render(<MusdConversionHeading />);

    const infoButton = screen.getByTestId(
      'musd-conversion-heading-info-button',
    );
    expect(infoButton).toHaveAttribute('aria-label', 'Info');
  });
});

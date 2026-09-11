import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { MoneyActivityRetryButton } from './money-activity-retry-button';

describe('MoneyActivityRetryButton', () => {
  it('invokes onClick', () => {
    const onClick = jest.fn();
    renderWithLocalization(
      <MoneyActivityRetryButton className="mt-4" onClick={onClick} />,
    );

    fireEvent.click(screen.getByTestId('money-activity-retry'));
    expect(screen.getByTestId('money-activity-retry')).toHaveTextContent(
      messages.moneyActivityRetry.message,
    );
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

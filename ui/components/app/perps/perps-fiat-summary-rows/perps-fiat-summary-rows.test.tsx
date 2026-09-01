import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { ConfirmInfoRowSize } from '../../confirm/info/row/row';
import { PerpsFiatSummaryRows } from './perps-fiat-summary-rows';

describe('PerpsFiatSummaryRows', () => {
  it('renders labels and values', () => {
    const store = configureStore({ metamask: mockState.metamask });
    renderWithProvider(
      <PerpsFiatSummaryRows
        rowVariant={ConfirmInfoRowSize.Small}
        rows={[
          { label: 'Fee', value: '$1.00', 'data-testid': 'row-fee' },
          {
            label: messages.time.message,
            value: '~5 min',
            'data-testid': 'row-time',
          },
        ]}
      />,
      store,
    );

    expect(screen.getByTestId('perps-fiat-summary-rows')).toBeInTheDocument();
    expect(screen.getByText('Fee')).toBeInTheDocument();
    expect(screen.getByText('$1.00')).toBeInTheDocument();
    expect(screen.getByText(messages.time.message)).toBeInTheDocument();
    expect(screen.getByText('~5 min')).toBeInTheDocument();
  });
});

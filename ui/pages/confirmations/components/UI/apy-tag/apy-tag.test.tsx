import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { ApyTag } from './apy-tag';

describe('ApyTag', () => {
  it('renders the formatted vault rate as a success tag', () => {
    const store = configureStore(mockState);
    const { getByTestId } = renderWithProvider(
      <ApyTag apyPercentFormatted="4.2%" />,
      store,
    );

    const tag = getByTestId('apy-tag');
    expect(tag).toHaveTextContent(tEn('moneyApy', ['4.2%']));
    expect(tag).toHaveClass(
      'shrink-0',
      'whitespace-nowrap',
      'bg-success-muted',
    );
  });

  it('uses the provided test id', () => {
    const store = configureStore(mockState);
    const { getByTestId } = renderWithProvider(
      <ApyTag apyPercentFormatted="6%" testId="custom-apy-tag" />,
      store,
    );

    expect(getByTestId('custom-apy-tag')).toHaveTextContent(
      tEn('moneyApy', ['6%']),
    );
  });
});

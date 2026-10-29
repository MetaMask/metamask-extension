import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { PerpsWithdrawPercentageButtons } from './perps-withdraw-percentage-buttons';

describe('PerpsWithdrawPercentageButtons', () => {
  it('invokes callback with percentage including max', async () => {
    const user = userEvent.setup();
    const onPercentageClick = jest.fn();
    const store = configureStore({ metamask: mockState.metamask });

    renderWithProvider(
      <PerpsWithdrawPercentageButtons onPercentageClick={onPercentageClick} />,
      store,
    );

    await user.click(screen.getByTestId('perps-withdraw-percentage-10'));
    expect(onPercentageClick).toHaveBeenCalledWith(10);

    await user.click(screen.getByTestId('perps-withdraw-percentage-max'));
    expect(onPercentageClick).toHaveBeenCalledWith(100);
  });
});

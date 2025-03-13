import React from 'react';
import { getMockTokenTransferConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../store/store';
import { AdvancedDetailsButton } from './advanced-details-button';

const mockStore = getMockTokenTransferConfirmState({});

const render = () => {
  const store = configureStore(mockStore);
  return renderWithConfirmContextProvider(<AdvancedDetailsButton />, store);
};

describe('<AdvancedDetailsButton />', () => {
  it('should match snapshot', async () => {
    const { container } = render();

    expect(container).toMatchSnapshot();
  });
});

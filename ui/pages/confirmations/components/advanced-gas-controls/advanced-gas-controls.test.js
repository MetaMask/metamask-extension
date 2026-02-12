import React from 'react';

import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';

import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import AdvancedGasControls from './advanced-gas-controls.component';

const renderComponent = (props) => {
  const store = configureMockStore([])({
    metamask: {},
  });
  return renderWithProvider(<AdvancedGasControls {...props} />, store);
};

describe('AdvancedGasControls Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });

  it('should render gasLimit and gasPrice inputs', () => {
    const { queryByText } = renderComponent();
    expect(queryByText(messages.gasLimit.message)).toBeInTheDocument();
    expect(
      queryByText(messages.advancedGasPriceTitle.message),
    ).toBeInTheDocument();
  });
});

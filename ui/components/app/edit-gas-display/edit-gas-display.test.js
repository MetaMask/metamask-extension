import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import EditGasDisplay from '.';

jest.mock('../../../selectors');
jest.mock('../../../helpers/utils/confirm-tx.util');
jest.mock('../../../helpers/utils/transactions.util');

function render({ componentProps = {} } = {}) {
  const store = configureStore({});
  return renderWithProvider(<EditGasDisplay {...componentProps} />, store);
}

describe('EditGasDisplay', () => {
  describe('if getIsNetworkBusy returns a truthy value', () => {
    it('informs the user', () => {
      render({ componentProps: { isNetworkBusy: true } });
      expect(
        screen.getByText(
          'Network is busy. Gas prices are high and estimates are less accurate.',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('if getIsNetworkBusy does not return a truthy value', () => {
    it('does not inform the user', () => {
      render({ componentProps: { isNetworkBusy: false } });
      expect(
        screen.queryByText(
          'Network is busy. Gas prices are high and estimates are less accurate.',
        ),
      ).not.toBeInTheDocument();
    });
  });
});

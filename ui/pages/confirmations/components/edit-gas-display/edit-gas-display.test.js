import React from 'react';

import EditGasDisplay from '.';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';

jest.mock('../../../../selectors');
jest.mock('../../../../helpers/utils/confirm-tx.util');
jest.mock('../../../../helpers/utils/transactions.util');

function render({ componentProps = {} } = {}) {
  const store = configureStore({});
  return renderWithProvider(<EditGasDisplay {...componentProps} />, store);
}

describe('EditGasDisplay', () => {
  it('if render correctly', () => {
    expect(render).not.toThrow();
  });
});

import React from 'react';
import { screen } from '@testing-library/react';

import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';

import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import TransactionDetail from './transaction-detail.component';

const render = ({ componentProps } = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  return renderWithProvider(
    <TransactionDetail
      onEdit={() => {
        console.log('on edit');
      }}
      rows={[]}
      userAcknowledgedGasMissing
      {...componentProps}
    />,
    store,
  );
};

describe('TransactionDetail', () => {
  it('should render edit link when onEdit is provided', () => {
    render();
    expect(screen.queryByText(messages.edit.message)).toBeInTheDocument();
  });

  it('should not render edit link when onEdit is not provided', () => {
    render({ componentProps: { onEdit: undefined } });
    expect(screen.queryByText(messages.edit.message)).not.toBeInTheDocument();
  });
});

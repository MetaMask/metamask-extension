import * as React from 'react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

import DataDeletionErrorModal from './data-deletion-error-modal';

describe('DataDeletionErrorModal', () => {
  it('should render data deletion error modal', async () => {
    const store = configureStore({});
    const { getByText } = renderWithProvider(<DataDeletionErrorModal />, store);

    expect(
      getByText('We are unable to delete this data right now'),
    ).toBeInTheDocument();
    expect(
      getByText(
        "This request can't be completed right now due to an analytics system server issue, please try again later",
      ),
    ).toBeInTheDocument();
  });
});

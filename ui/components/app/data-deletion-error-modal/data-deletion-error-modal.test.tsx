import * as React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { DATA_DELETION_ERROR_MODAL_CLOSE } from '../../../store/actionConstants';

import DataDeletionErrorModal from './data-deletion-error-modal';

const mockCloseDeleteMetaMetricsErrorModal = jest
  .fn()
  .mockImplementation(() => {
    return {
      type: DATA_DELETION_ERROR_MODAL_CLOSE,
    };
  });

jest.mock('../../../ducks/app/app.ts', () => {
  return {
    hideDataDeletionErrorModal: () => {
      return mockCloseDeleteMetaMetricsErrorModal();
    },
  };
});

describe('DataDeletionErrorModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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

  it('should call hideDeleteMetaMetricsDataModal when Ok button is clicked', () => {
    const store = configureStore({});
    const { getByText } = renderWithProvider(<DataDeletionErrorModal />, store);
    expect(getByText('Ok')).toBeEnabled();
    fireEvent.click(getByText('Ok'));
    expect(mockCloseDeleteMetaMetricsErrorModal).toHaveBeenCalledTimes(1);
  });
});

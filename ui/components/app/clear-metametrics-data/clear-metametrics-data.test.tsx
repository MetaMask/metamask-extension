import * as React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as Actions from '../../../store/actions';
import { DELETE_METAMETRICS_DATA_MODAL_CLOSE } from '../../../store/actionConstants';
import ClearMetaMetricsData from './clear-metametrics-data';

const mockCloseDeleteMetaMetricsDataModal = jest.fn().mockImplementation(() => {
  return {
    type: DELETE_METAMETRICS_DATA_MODAL_CLOSE,
  };
});

jest.mock('../../../store/actions', () => ({
  createMetaMetricsDataDeletionTask: jest.fn(),
}));

jest.mock('../../../ducks/app/app.ts', () => {
  return {
    hideDeleteMetaMetricsDataModal: () => {
      return mockCloseDeleteMetaMetricsDataModal();
    },
  };
});

describe('ClearMetaMetricsData', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the data deletion error modal', async () => {
    const store = configureStore({});
    const { getByText } = renderWithProvider(<ClearMetaMetricsData />, store);

    expect(getByText('Delete MetaMetrics data?')).toBeInTheDocument();
    expect(
      getByText(
        'We are about to remove all your MetaMetrics data. Are you sure?',
      ),
    ).toBeInTheDocument();
  });

  it('should call createMetaMetricsDataDeletionTask when Clear button is clicked', () => {
    const store = configureStore({});
    const { getByText } = renderWithProvider(<ClearMetaMetricsData />, store);
    expect(getByText('Delete')).toBeEnabled();
    fireEvent.click(getByText('Delete'));
    expect(Actions.createMetaMetricsDataDeletionTask).toHaveBeenCalledTimes(1);
  });

  it('should call hideDeleteMetaMetricsDataModal when Cancel button is clicked', () => {
    const store = configureStore({});
    const { getByText } = renderWithProvider(<ClearMetaMetricsData />, store);
    expect(getByText('Cancel')).toBeEnabled();
    fireEvent.click(getByText('Cancel'));
    expect(mockCloseDeleteMetaMetricsDataModal).toHaveBeenCalledTimes(1);
  });
});

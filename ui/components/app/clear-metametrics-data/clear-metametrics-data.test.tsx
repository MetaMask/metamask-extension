import * as React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import * as Actions from '../../../store/actions';
import { DELETE_METAMETRICS_DATA_MODAL_CLOSE } from '../../../store/actionConstants';
import ClearMetaMetricsData from './clear-metametrics-data';

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const mockCloseDeleteMetaMetricsDataModal = jest.fn().mockImplementation(() => {
  return {
    type: DELETE_METAMETRICS_DATA_MODAL_CLOSE,
  };
});

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  createMetaMetricsDataDeletionTask: jest.fn(),
}));

jest.mock('../../../ducks/app/app.ts', () => {
  return {
    hideDeleteMetaMetricsDataModal: () => {
      return mockCloseDeleteMetaMetricsDataModal();
    },
    openDataDeletionErrorModal: () => ({ type: 'OPEN_DATA_DELETION_ERROR' }),
  };
});

describe('ClearMetaMetricsData', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the data deletion error modal', async () => {
    const store = configureStore({});
    const { getByText } = renderWithProvider(<ClearMetaMetricsData />, store);

    expect(
      getByText(messages.deleteMetaMetricsDataModalTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.deleteMetaMetricsDataModalDesc.message),
    ).toBeInTheDocument();
  });

  it('tracks the deletion request when Clear is clicked', async () => {
    const store = configureStore({});
    const { getByText } = renderWithProvider(<ClearMetaMetricsData />, store);
    expect(getByText(messages.delete.message)).toBeEnabled();
    fireEvent.click(getByText(messages.delete.message));
    expect(Actions.createMetaMetricsDataDeletionTask).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MetricsDataDeletionRequest,
        properties: {
          category: MetaMetricsEventCategory.Settings,
        },
        sensitiveProperties: {},
        options: {
          excludeMetaMetricsId: true,
        },
      });
    });
  });

  it('tracks the error when creating the deletion task fails', async () => {
    jest
      .mocked(Actions.createMetaMetricsDataDeletionTask)
      .mockRejectedValueOnce(new Error('Deletion failed'));
    const store = configureStore({});
    const { getByText } = renderWithProvider(<ClearMetaMetricsData />, store);

    fireEvent.click(getByText(messages.delete.message));

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.ErrorOccured,
        properties: {
          category: MetaMetricsEventCategory.Settings,
        },
        sensitiveProperties: {},
        options: {
          excludeMetaMetricsId: true,
        },
      });
    });
  });

  it('should call hideDeleteMetaMetricsDataModal when Cancel button is clicked', () => {
    const store = configureStore({});
    const { getByText } = renderWithProvider(<ClearMetaMetricsData />, store);
    expect(getByText(messages.cancel.message)).toBeEnabled();
    fireEvent.click(getByText(messages.cancel.message));
    expect(mockCloseDeleteMetaMetricsDataModal).toHaveBeenCalledTimes(1);
  });
});

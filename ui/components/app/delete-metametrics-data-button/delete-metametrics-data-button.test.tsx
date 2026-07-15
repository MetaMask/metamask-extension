import * as React from 'react';
import { useSelector } from 'react-redux';
import { fireEvent, waitFor } from '@testing-library/react';
import configureStore from '../../../store/store';
import { useAppDispatch } from '../../../store/hooks';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';

import {
  getMetaMetricsDataDeletionTimestamp,
  getMetaMetricsDataDeletionStatus,
  getAnalyticsId,
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
  getShowDeleteMetaMetricsDataModal,
} from '../../../selectors';
import { openDeleteMetaMetricsDataModal } from '../../../ducks/app/app';
import { createMetaMetricsDataDeletionTask } from '../../../store/actions';
import DeleteMetaMetricsDataButton from './delete-metametrics-data-button';

jest.mock('../../../store/hooks', () => ({
  useAppDispatch: jest.fn().mockReturnValue((action: unknown) => {
    if (typeof action === 'function') {
      return action(jest.fn(), jest.fn());
    }
    return action;
  }),
}));

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

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  createMetaMetricsDataDeletionTask: jest.fn(),
}));

describe('DeleteMetaMetricsDataButton', () => {
  const useSelectorMock = useSelector as jest.Mock;
  const useAppDispatchMock = useAppDispatch as jest.Mock;
  const mockDispatch = jest.fn();

  beforeEach(() => {
    mockTrackEvent.mockClear();
    useAppDispatchMock.mockReturnValue(mockDispatch);
    (createMetaMetricsDataDeletionTask as jest.Mock).mockResolvedValue(
      undefined,
    );
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCompletedMetaMetricsOnboarding) {
        return true;
      }
      if (selector === getOptedIn) {
        return true;
      }
      if (selector === getAnalyticsId) {
        return 'fake-metrics-id';
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return undefined;
      }
      if (selector === getMetaMetricsDataDeletionTimestamp) {
        return '';
      }

      return undefined;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const store = configureStore({});
    const { getByTestId, getAllByText, container } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(getByTestId('delete-metametrics-data-button')).toBeInTheDocument();
    expect(getAllByText(messages.deleteMetaMetricsData.message)).toHaveLength(
      2,
    );
    expect(
      container.querySelector('.settings-page__content-description')
        ?.textContent,
    ).toMatchInlineSnapshot(
      `" This will delete historical MetaMetrics data associated with your use on this device. Your wallet and accounts will remain exactly as they are now after this data has been deleted. This process may take up to 30 days. View our Privacy Policy. "`,
    );
  });
  it('should enable the data deletion button when metrics is opted in and metametrics id is available ', async () => {
    const store = configureStore({});
    const { getByRole, container } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(
      getByRole('button', { name: messages.deleteMetaMetricsData.message }),
    ).toBeEnabled();
    expect(
      container.querySelector('.settings-page__content-description')
        ?.textContent,
    ).toMatchInlineSnapshot(
      `" This will delete historical MetaMetrics data associated with your use on this device. Your wallet and accounts will remain exactly as they are now after this data has been deleted. This process may take up to 30 days. View our Privacy Policy. "`,
    );
  });
  it('should enable the data deletion button when page mounts after a deletion task is performed', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getMetaMetricsDataDeletionStatus) {
        return 'INITIALIZED';
      }
      if (selector === getCompletedMetaMetricsOnboarding) {
        return true;
      }
      if (selector === getOptedIn) {
        return true;
      }
      if (selector === getAnalyticsId) {
        return 'fake-metrics-id';
      }
      return undefined;
    });
    const store = configureStore({});
    const { getByRole, container } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(
      getByRole('button', { name: messages.deleteMetaMetricsData.message }),
    ).toBeEnabled();
    expect(
      container.querySelector('.settings-page__content-description')
        ?.textContent,
    ).toMatchInlineSnapshot(
      `" This will delete historical MetaMetrics data associated with your use on this device. Your wallet and accounts will remain exactly as they are now after this data has been deleted. This process may take up to 30 days. View our Privacy Policy. "`,
    );
  });

  // If the user does not opt in to metrics or backup and sync, analyticsId will not be created.
  it('should disable the data deletion button when there is no analytics id available', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCompletedMetaMetricsOnboarding) {
        return true;
      }
      if (selector === getOptedIn) {
        return false;
      }
      return undefined;
    });
    const store = configureStore({});
    const { getByRole, container } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(
      getByRole('button', { name: messages.deleteMetaMetricsData.message }),
    ).toBeDisabled();
    expect(
      container.querySelector('.settings-page__content-description')
        ?.textContent,
    ).toMatchInlineSnapshot(
      `" This will delete historical MetaMetrics data associated with your use on this device. Your wallet and accounts will remain exactly as they are now after this data has been deleted. This process may take up to 30 days. View our Privacy Policy. "`,
    );
    expect(
      container.querySelector('.settings-page__content-item-col')?.textContent,
    ).toMatchInlineSnapshot(
      `"Since you've never opted into MetaMetrics, there's no data to delete here.Delete MetaMetrics data"`,
    );
  });

  it('should disable the data deletion button after a deletion task is performed this session', async () => {
    let showDeleteModal = true;
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getShowDeleteMetaMetricsDataModal) {
        return showDeleteModal;
      }
      if (selector === getAnalyticsId) {
        return 'fake-metrics-id';
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return 'INITIALIZED';
      }
      if (selector === getMetaMetricsDataDeletionTimestamp) {
        return 1717779342113;
      }
      if (selector === getCompletedMetaMetricsOnboarding) {
        return true;
      }
      if (selector === getOptedIn) {
        return true;
      }
      return undefined;
    });
    const store = configureStore({});
    const { getByRole, getByTestId, rerender, container } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );

    fireEvent.click(getByTestId('clear-metametrics-data'));

    showDeleteModal = false;
    rerender(<DeleteMetaMetricsDataButton />);

    await waitFor(() => {
      expect(
        getByRole('button', { name: messages.deleteMetaMetricsData.message }),
      ).toBeDisabled();
    });
    expect(
      container.querySelector('.settings-page__content-description')
        ?.textContent,
    ).toMatchInlineSnapshot(
      `" You initiated deletion on 7/06/2024. This process can take up to 30 days. View the Privacy Policy. "`,
    );
  });

  it('should open the modal on the button click', () => {
    const store = configureStore({});
    const { getByRole } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    const deleteButton = getByRole('button', {
      name: messages.deleteMetaMetricsData.message,
    });
    fireEvent.click(deleteButton);
    expect(mockDispatch).toHaveBeenCalledWith(openDeleteMetaMetricsDataModal());
  });
});

import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';

import {
  getMetaMetricsDataDeletionTimestamp,
  getMetaMetricsDataDeletionStatus,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getLatestMetricsEventTimestamp,
} from '../../../../selectors';
import { openDeleteMetaMetricsDataModal } from '../../../../ducks/app/app';
import DeleteMetaMetricsDataButton from './delete-metametrics-data-button';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

describe('DeleteMetaMetricsDataButton', () => {
  const useSelectorMock = useSelector as jest.Mock;
  const useDispatchMock = useDispatch as jest.Mock;
  const mockDispatch = jest.fn();

  beforeEach(() => {
    useDispatchMock.mockReturnValue(mockDispatch);
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getParticipateInMetaMetrics) {
        return true;
      }
      if (selector === getMetaMetricsId) {
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
    expect(getAllByText('Delete MetaMetrics data')).toHaveLength(2);
    expect(
      container.querySelector('.settings-page__content-description')
        ?.textContent,
    ).toMatchInlineSnapshot(
      `" This will delete historical MetaMetrics data associated with your use on this device. Your wallet and accounts will remain exactly as they are now after this data has been deleted. This process may take up to 30 days. View our Privacy policy. "`,
    );
  });
  it('should enable the data deletion button when metrics is opted in and metametrics id is available ', async () => {
    const store = configureStore({});
    const { getByRole, container } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(
      getByRole('button', { name: 'Delete MetaMetrics data' }),
    ).toBeEnabled();
    expect(
      container.querySelector('.settings-page__content-description')
        ?.textContent,
    ).toMatchInlineSnapshot(
      `" This will delete historical MetaMetrics data associated with your use on this device. Your wallet and accounts will remain exactly as they are now after this data has been deleted. This process may take up to 30 days. View our Privacy policy. "`,
    );
  });
  it('should enable the data deletion button when page mounts after a deletion task is performed and more data is recoded after the deletion', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getMetaMetricsDataDeletionStatus) {
        return 'INITIALIZED';
      }
      if (selector === getParticipateInMetaMetrics) {
        return true;
      }
      if (selector === getMetaMetricsId) {
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
      getByRole('button', { name: 'Delete MetaMetrics data' }),
    ).toBeEnabled();
    expect(
      container.querySelector('.settings-page__content-description')
        ?.textContent,
    ).toMatchInlineSnapshot(
      `" This will delete historical MetaMetrics data associated with your use on this device. Your wallet and accounts will remain exactly as they are now after this data has been deleted. This process may take up to 30 days. View our Privacy policy. "`,
    );
  });

  // if user does not opt in to participate in metrics or for profile sync, metametricsId will not be created.
  it('should disable the data deletion button when there is metametrics id not available', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getParticipateInMetaMetrics) {
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
      getByRole('button', { name: 'Delete MetaMetrics data' }),
    ).toBeDisabled();
    expect(
      container.querySelector('.settings-page__content-description')
        ?.textContent,
    ).toMatchInlineSnapshot(
      `" This will delete historical MetaMetrics data associated with your use on this device. Your wallet and accounts will remain exactly as they are now after this data has been deleted. This process may take up to 30 days. View our Privacy policy. "`,
    );
    expect(
      container.querySelector('.settings-page__content-item-col')?.textContent,
    ).toMatchInlineSnapshot(
      `"Since you've never opted into MetaMetrics, there's no data to delete here.Delete MetaMetrics data"`,
    );
  });

  // particilapteInMetrics will be false before the deletion is performed, this way no further data will be recorded after deletion.
  it('should disable the data deletion button after a deletion task is performed and no data is recoded after the deletion', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getMetaMetricsId) {
        return 'fake-metrics-id';
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return 'INITIALIZED';
      }
      if (selector === getMetaMetricsDataDeletionTimestamp) {
        return 1717779342113;
      }
      if (selector === getLatestMetricsEventTimestamp) {
        return 1717779342110;
      }
      return undefined;
    });
    const store = configureStore({});
    const { getByRole, container } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(
      getByRole('button', { name: 'Delete MetaMetrics data' }),
    ).toBeDisabled();
    expect(
      container.querySelector('.settings-page__content-description')
        ?.textContent,
    ).toMatchInlineSnapshot(
      `" You initiated this action on 7/06/2024. This process can take up to 30 days. View the Privacy policy "`,
    );
  });

  // particilapteInMetrics will be false before the deletion is performed, this way no further data will be recorded after deletion.
  it('should disable the data deletion button after a deletion task is performed and no data is recoded after the deletion', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getMetaMetricsId) {
        return 'fake-metrics-id';
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return 'INITIALIZED';
      }
      if (selector === getMetaMetricsDataDeletionTimestamp) {
        return 1717779342113;
      }
      if (selector === getLatestMetricsEventTimestamp) {
        return 1717779342110;
      }
      return undefined;
    });
    const store = configureStore({});
    const { getByRole, container } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(
      getByRole('button', { name: 'Delete MetaMetrics data' }),
    ).toBeDisabled();
    expect(
      container.querySelector('.settings-page__content-description')
        ?.textContent,
    ).toMatchInlineSnapshot(
      `" You initiated this action on 7/06/2024. This process can take up to 30 days. View the Privacy policy "`,
    );
  });

  it('should open the modal on the button click', () => {
    const store = configureStore({});
    const { getByRole } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    const deleteButton = getByRole('button', {
      name: 'Delete MetaMetrics data',
    });
    fireEvent.click(deleteButton);
    expect(mockDispatch).toHaveBeenCalledWith(openDeleteMetaMetricsDataModal());
  });
});

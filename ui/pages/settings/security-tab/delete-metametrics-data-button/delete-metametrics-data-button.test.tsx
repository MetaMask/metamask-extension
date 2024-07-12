import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
// import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';

import {
  getMetaMetricsDataDeletionDate,
  getMetaMetricsDataDeletionStatus,
  getMetaMetricsId,
  getParticipateInDuringDeletion,
  isMetaMetricsDataDeletionMarked,
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
      if (selector === isMetaMetricsDataDeletionMarked) {
        return false;
      }
      if (selector === getMetaMetricsId) {
        return 'fake-metrics-id';
      }
      if (selector === getParticipateInDuringDeletion) {
        return null;
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return undefined;
      }
      if (selector === getMetaMetricsDataDeletionDate) {
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
    const { getByText, getByTestId, getAllByText } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(getByTestId('delete-metametrics-data-button')).toBeInTheDocument();
    expect(getAllByText('Delete MetaMetrics data')).toHaveLength(2);
    expect(
      getByText(
        /This will delete historical MetaMetrics data associated with your use on this device. Your wallet and accounts will remain exactly as they are now after this data has been deleted. This process may take up to 30 days. View our/u,
      ),
    ).toBeInTheDocument();
  });

  it('should enable the data deletion button when metrics is opted in and metametrics id is available ', async () => {
    const store = configureStore({});
    const { getByRole, getByText } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(
      getByRole('button', { name: 'Delete MetaMetrics data' }),
    ).toBeEnabled();
    expect(
      getByText(
        /This will delete historical MetaMetrics data associated with your use on this device. Your wallet and accounts will remain exactly as they are now after this data has been deleted. This process may take up to 30 days. View our/u,
      ),
    ).toBeInTheDocument();
  });
  it('should enable the data deletion button when page mounts after a deletion task is performed and more data is recoded after the deletion', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getParticipateInDuringDeletion) {
        return true;
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return 'INITIALIZED';
      }
      if (selector === getMetaMetricsId) {
        return 'fake-metrics-id';
      }
      return undefined;
    });
    const store = configureStore({});
    const { getByRole, getByText } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(
      getByRole('button', { name: 'Delete MetaMetrics data' }),
    ).toBeEnabled();
    expect(
      getByText(
        /This will delete historical MetaMetrics data associated with your use on this device. Your wallet and accounts will remain exactly as they are now after this data has been deleted. This process may take up to 30 days. View our/u,
      ),
    ).toBeInTheDocument();
  });

  // if user does not opt in to participate in metrics or for profile sync, metametricsId will not be created.
  it('should disable the data deletion button when there is metametrics id not available', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getMetaMetricsId) {
        return null;
      }
      return undefined;
    });
    const store = configureStore({});
    const { getByRole, getByText } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(
      getByRole('button', { name: 'Delete MetaMetrics data' }),
    ).toBeDisabled();
    expect(
      getByText(
        /This will delete historical MetaMetrics data associated with your use on this device. Your wallet and accounts will remain exactly as they are now after this data has been deleted. This process may take up to 30 days. View our/u,
      ),
    ).toBeInTheDocument();
    expect(
      getByText(
        /Since you've never opted into MetaMetrics, there's no data to delete here./u,
      ),
    ).toBeInTheDocument();
  });

  // metaMetricsDataDeletionMarked is set to true right after the deletion is performed, it will rest to false when the page unmounts.
  it('should disable the data deletion button when metaMetricsDataDeletionMarked is true', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === isMetaMetricsDataDeletionMarked) {
        return true;
      }
      if (selector === getMetaMetricsId) {
        return 'fake-metrics-id';
      }
      if (selector === getParticipateInDuringDeletion) {
        return true;
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return 'INITIALIZED';
      }
      if (selector === getMetaMetricsDataDeletionDate) {
        return 1717779342113;
      }
      return undefined;
    });
    const store = configureStore({});
    const { getByRole, getByText } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(
      getByRole('button', { name: 'Delete MetaMetrics data' }),
    ).toBeDisabled();
    expect(
      getByText(
        /You initiated this action on 7\/06\/2024. This process can take up to 30 days. View the/u,
      ),
    ).toBeInTheDocument();
  });

  // particilapteInMetrics will be false before the deletion is performed, this way no further data will be recorded after deletion.
  it('should disable the data deletion button after a deletion task is performed and no data is recoded after the deletion', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getParticipateInDuringDeletion) {
        return false;
      }
      if (selector === getMetaMetricsId) {
        return 'fake-metrics-id';
      }
      if (selector === getParticipateInDuringDeletion) {
        return true;
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return 'INITIALIZED';
      }
      if (selector === getMetaMetricsDataDeletionDate) {
        return 1717779342113;
      }
      return undefined;
    });
    const store = configureStore({});
    const { getByRole, getByText } = renderWithProvider(
      <DeleteMetaMetricsDataButton />,
      store,
    );
    expect(
      getByRole('button', { name: 'Delete MetaMetrics data' }),
    ).toBeDisabled();
    expect(
      getByText(
        /You initiated this action on 7\/06\/2024. This process can take up to 30 days. View the/u,
      ),
    ).toBeInTheDocument();
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

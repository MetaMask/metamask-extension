import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useSelector } from 'react-redux';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { DeleteRegulationStatus } from '../../../../shared/constants/metametrics';
import {
  getMetaMetricsDataDeletionTimestamp,
  getMetaMetricsDataDeletionStatus,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getLatestMetricsEventTimestamp,
} from '../../../selectors';
import { DeleteMetametricsDataItem } from './delete-metametrics-data-item';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

describe('DeleteMetametricsDataItem', () => {
  const useSelectorMock = useSelector as jest.Mock;

  const mockSelectorsDefault = () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getParticipateInMetaMetrics) {
        return true;
      }
      if (selector === getMetaMetricsId) {
        return 'mock-metametrics-id';
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return undefined;
      }
      if (selector === getMetaMetricsDataDeletionTimestamp) {
        return 0;
      }
      if (selector === getLatestMetricsEventTimestamp) {
        return 0;
      }
      return undefined;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectorsDefault();
  });

  it('renders delete button', () => {
    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    expect(
      screen.getByTestId('delete-metametrics-button'),
    ).toBeInTheDocument();
  });

  it('button is disabled when metametrics is not enabled', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getParticipateInMetaMetrics) {
        return false;
      }
      if (selector === getMetaMetricsId) {
        return null;
      }
      return undefined;
    });

    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    expect(screen.getByTestId('delete-metametrics-button')).toBeDisabled();
  });

  it('button is disabled when metaMetricsId is null', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getParticipateInMetaMetrics) {
        return true;
      }
      if (selector === getMetaMetricsId) {
        return null;
      }
      return undefined;
    });

    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    expect(screen.getByTestId('delete-metametrics-button')).toBeDisabled();
  });

  it('button is enabled when metametrics is enabled and has ID', () => {
    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    expect(screen.getByTestId('delete-metametrics-button')).toBeEnabled();
  });

  it('opens delete modal when button is clicked', async () => {
    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    fireEvent.click(screen.getByTestId('delete-metametrics-button'));

    await waitFor(() => {
      expect(
        screen.getByText(messages.deleteMetaMetricsDataModalTitle.message),
      ).toBeInTheDocument();
    });
  });

  it('opens deletion in progress modal when deletion is already in progress', async () => {
    const now = Date.now();
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getParticipateInMetaMetrics) {
        return true;
      }
      if (selector === getMetaMetricsId) {
        return 'mock-metametrics-id';
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return DeleteRegulationStatus.Running;
      }
      if (selector === getMetaMetricsDataDeletionTimestamp) {
        return now;
      }
      if (selector === getLatestMetricsEventTimestamp) {
        return now - 10000;
      }
      return undefined;
    });

    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    fireEvent.click(screen.getByTestId('delete-metametrics-button'));

    await waitFor(() => {
      const messageStart =
        messages.deleteMetaMetricsDataRequestedDescription.message.split(
          '$1',
        )[0];
      expect(
        screen.getByText(new RegExp(messageStart)),
      ).toBeInTheDocument();
    });
  });

  it('shows deletion in progress modal for Initialized status', async () => {
    const now = Date.now();
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getParticipateInMetaMetrics) {
        return true;
      }
      if (selector === getMetaMetricsId) {
        return 'mock-metametrics-id';
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return DeleteRegulationStatus.Initialized;
      }
      if (selector === getMetaMetricsDataDeletionTimestamp) {
        return now;
      }
      if (selector === getLatestMetricsEventTimestamp) {
        return now - 10000;
      }
      return undefined;
    });

    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    fireEvent.click(screen.getByTestId('delete-metametrics-button'));

    await waitFor(() => {
      const messageStart =
        messages.deleteMetaMetricsDataRequestedDescription.message.split(
          '$1',
        )[0];
      expect(
        screen.getByText(new RegExp(messageStart)),
      ).toBeInTheDocument();
    });
  });

  it('opens delete modal when there are new events after deletion finished', async () => {
    const now = Date.now();
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getParticipateInMetaMetrics) {
        return true;
      }
      if (selector === getMetaMetricsId) {
        return 'mock-metametrics-id';
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return DeleteRegulationStatus.Finished;
      }
      if (selector === getMetaMetricsDataDeletionTimestamp) {
        return now - 10000;
      }
      if (selector === getLatestMetricsEventTimestamp) {
        return now;
      }
      return undefined;
    });

    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    fireEvent.click(screen.getByTestId('delete-metametrics-button'));

    await waitFor(() => {
      expect(
        screen.getByText(messages.deleteMetaMetricsDataModalTitle.message),
      ).toBeInTheDocument();
    });
  });
});

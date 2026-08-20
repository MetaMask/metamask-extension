import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useSelector } from 'react-redux';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DeleteRegulationStatus } from '../../../../shared/constants/metametrics';
import {
  getMetaMetricsDataDeletionStatus,
  getAnalyticsId,
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
} from '../../../selectors';
import { createMetaMetricsDataDeletionTask } from '../../../store/actions';
import { DeleteMetametricsDataItem } from './delete-metametrics-data-item';

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      trackEvent: jest.fn(),
      createEventBuilder,
    }),
  };
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  createMetaMetricsDataDeletionTask: jest.fn(),
}));

describe('DeleteMetametricsDataItem', () => {
  const useSelectorMock = useSelector as jest.Mock;

  const mockSelectorsDefault = () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCompletedMetaMetricsOnboarding) {
        return true;
      }
      if (selector === getOptedIn) {
        return true;
      }
      if (selector === getAnalyticsId) {
        return 'mock-metametrics-id';
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return undefined;
      }
      return undefined;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectorsDefault();
    (createMetaMetricsDataDeletionTask as jest.Mock).mockResolvedValue(
      undefined,
    );
  });

  it('renders delete button', () => {
    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    expect(
      screen.getByTestId('delete-metametrics-data-button'),
    ).toBeInTheDocument();
  });

  it('button is disabled when metametrics is not enabled', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCompletedMetaMetricsOnboarding) {
        return true;
      }
      if (selector === getOptedIn) {
        return false;
      }
      if (selector === getAnalyticsId) {
        return null;
      }
      return undefined;
    });

    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    expect(screen.getByTestId('delete-metametrics-data-button')).toBeDisabled();
  });

  it('button is disabled when analyticsId is null', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCompletedMetaMetricsOnboarding) {
        return true;
      }
      if (selector === getOptedIn) {
        return true;
      }
      if (selector === getAnalyticsId) {
        return null;
      }
      return undefined;
    });

    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    expect(screen.getByTestId('delete-metametrics-data-button')).toBeDisabled();
  });

  it('button is enabled when metametrics is enabled and has ID', () => {
    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    expect(screen.getByTestId('delete-metametrics-data-button')).toBeEnabled();
  });

  it('opens delete modal when button is clicked', async () => {
    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    fireEvent.click(screen.getByTestId('delete-metametrics-data-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('delete-metametrics-modal'),
      ).toBeInTheDocument();
    });
  });

  it('opens deletion in progress modal when deletion was requested this session', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCompletedMetaMetricsOnboarding) {
        return true;
      }
      if (selector === getOptedIn) {
        return true;
      }
      if (selector === getAnalyticsId) {
        return 'mock-metametrics-id';
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return DeleteRegulationStatus.Running;
      }
      return undefined;
    });

    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    fireEvent.click(screen.getByTestId('delete-metametrics-data-button'));
    await waitFor(() => {
      expect(
        screen.getByTestId('delete-metametrics-modal'),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('clear-metametrics-data'));
    await waitFor(() => {
      expect(
        screen.queryByTestId('delete-metametrics-modal'),
      ).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-metametrics-data-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('deletion-in-progress-modal'),
      ).toBeInTheDocument();
    });
  });

  it('opens delete modal when revisiting after a previous deletion request', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCompletedMetaMetricsOnboarding) {
        return true;
      }
      if (selector === getOptedIn) {
        return true;
      }
      if (selector === getAnalyticsId) {
        return 'mock-metametrics-id';
      }
      if (selector === getMetaMetricsDataDeletionStatus) {
        return DeleteRegulationStatus.Finished;
      }
      return undefined;
    });

    const store = configureStore({});
    renderWithProvider(<DeleteMetametricsDataItem />, store);

    fireEvent.click(screen.getByTestId('delete-metametrics-data-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('delete-metametrics-modal'),
      ).toBeInTheDocument();
    });
  });
});

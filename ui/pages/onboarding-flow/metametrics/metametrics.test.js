import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { ONBOARDING_CREATE_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import {
  onboardingMetametricsAgree,
  noThanks,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../app/_locales/en/messages.json';
import {
  setParticipateInMetaMetrics,
  setDataCollectionForMarketing,
} from '../../../store/actions';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import OnboardingMetametrics from './metametrics';

const mockPushHistory = jest.fn();

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useLocation: jest.fn(() => ({ search: '' })),
    useHistory: () => ({
      push: mockPushHistory,
    }),
  };
});

jest.mock('../../../store/actions.ts', () => ({
  setParticipateInMetaMetrics: jest
    .fn()
    .mockReturnValue(jest.fn((val) => Promise.resolve([val]))),
  setDataCollectionForMarketing: jest
    .fn()
    .mockReturnValue(jest.fn((val) => Promise.resolve([val]))),
}));

describe('Onboarding Metametrics Component', () => {
  let mockStore;

  const mockState = {
    metamask: {
      firstTimeFlowType: FirstTimeFlowType.create,
      participateInMetaMetrics: '',
    },
  };

  beforeEach(() => {
    mockStore = configureMockStore([thunk])(mockState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <OnboardingMetametrics />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot after new policy date', () => {
    // TODO: merge this with the previous test once this date is reached
    jest.useFakeTimers().setSystemTime(new Date('2024-06-05'));

    const { container } = renderWithProvider(
      <OnboardingMetametrics />,
      mockStore,
    );

    expect(container).toMatchSnapshot();

    jest.useRealTimers();
  });

  it('should set setParticipateInMetaMetrics to true when clicking agree', async () => {
    const { queryByText } = renderWithProvider(
      <OnboardingMetametrics />,
      mockStore,
    );

    const confirmAgree = queryByText(onboardingMetametricsAgree.message);

    fireEvent.click(confirmAgree);

    await waitFor(() => {
      expect(setParticipateInMetaMetrics).toHaveBeenCalledWith(true);
      expect(mockPushHistory).toHaveBeenCalledWith(
        ONBOARDING_CREATE_PASSWORD_ROUTE,
      );
    });
  });

  it('should set setParticipateInMetaMetrics to false when clicking cancel', async () => {
    const { queryByText } = renderWithProvider(
      <OnboardingMetametrics />,
      mockStore,
    );

    const confirmCancel = queryByText(noThanks.message);

    fireEvent.click(confirmCancel);

    await waitFor(() => {
      expect(setParticipateInMetaMetrics).toHaveBeenCalledWith(false);
      expect(mockPushHistory).toHaveBeenCalledWith(
        ONBOARDING_CREATE_PASSWORD_ROUTE,
      );
    });
  });

  it('should set setDataCollectionForMarketing to false when clicking cancel', async () => {
    const { queryByText } = renderWithProvider(
      <OnboardingMetametrics />,
      mockStore,
    );

    const confirmCancel = queryByText(noThanks.message);

    fireEvent.click(confirmCancel);

    await waitFor(() => {
      expect(setDataCollectionForMarketing).toHaveBeenCalledWith(false);
      expect(mockPushHistory).toHaveBeenCalledWith(
        ONBOARDING_CREATE_PASSWORD_ROUTE,
      );
    });
  });

  it('should render the Onboarding component when the current date is after the new privacy policy date', () => {
    jest.useFakeTimers().setSystemTime(new Date('2099-11-11'));
    const { queryByTestId } = renderWithProvider(
      <OnboardingMetametrics />,
      mockStore,
    );
    expect(queryByTestId('onboarding-metametrics')).toBeInTheDocument();
  });
});

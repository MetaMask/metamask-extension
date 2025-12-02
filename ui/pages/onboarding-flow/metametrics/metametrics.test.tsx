import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react';
import type { Dispatch, Store } from 'redux';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import {
  onboardingMetametricCheckboxTitleOne,
  onboardingMetametricCheckboxDescriptionOne,
  onboardingMetametricCheckboxTitleTwo,
  onboardingMetametricCheckboxDescriptionTwo,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../app/_locales/en/messages.json';
import {
  setParticipateInMetaMetrics,
  setDataCollectionForMarketing,
} from '../../../store/actions';
import configureStore from '../../../store/store';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import OnboardingMetametrics from './metametrics';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
    useLocation: jest.fn(() => ({ search: '' })),
  };
});

jest.mock('../../../store/actions.ts', () => {
  const actionConstants = jest.requireActual('../../../store/actionConstants');
  return {
    setParticipateInMetaMetrics: jest.fn((value) => (dispatch: Dispatch) => {
      dispatch({ type: actionConstants.SET_PARTICIPATE_IN_METAMETRICS, value });
      return Promise.resolve([value]);
    }),
    setDataCollectionForMarketing: jest.fn((value) => (dispatch: Dispatch) => {
      dispatch({
        type: actionConstants.SET_DATA_COLLECTION_FOR_MARKETING,
        value,
      });
      return Promise.resolve([value]);
    }),
  };
});

describe('Onboarding Metametrics Component', () => {
  let store: Store;

  const mockState = {
    metamask: {
      firstTimeFlowType: FirstTimeFlowType.create,
      participateInMetaMetrics: null,
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
    },
  };

  beforeEach(() => {
    store = configureStore(mockState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders match snapshot', () => {
    const { container } = renderWithProvider(<OnboardingMetametrics />, store);
    expect(container).toMatchSnapshot();
  });

  it('renders match snapshot after new policy date', () => {
    // TODO: merge this with the previous test once this date is reached
    jest.useFakeTimers().setSystemTime(new Date('2024-06-05'));
    const { container } = renderWithProvider(<OnboardingMetametrics />, store);
    expect(container).toMatchSnapshot();
    jest.useRealTimers();
  });

  it('default value is checked for ParticiapteMetatmric so on continue setParticipateInMetaMetrics should be called with true', async () => {
    const { queryByText, getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const title = queryByText(onboardingMetametricCheckboxTitleOne.message);
    const description = queryByText(
      onboardingMetametricCheckboxDescriptionOne.message,
    );

    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();

    const checkbox = getAllByRole('checkbox')[0];

    await waitFor(() => {
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeInTheDocument();
    });

    const continueButton = getByTestId('metametrics-i-agree');

    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE);
    });
  });

  it('when the participate in MetaMetrics checkbox is unchecked, setParticipateInMetaMetrics should be called with false', async () => {
    const { queryByText, getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const title = queryByText(onboardingMetametricCheckboxTitleOne.message);
    const description = queryByText(
      onboardingMetametricCheckboxDescriptionOne.message,
    );

    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();

    const checkboxLabel = queryByText('Gather basic usage data');
    expect(checkboxLabel).toBeInTheDocument();

    const checkbox = getAllByRole('checkbox')[0];

    expect(checkbox).toBeChecked();
    expect(checkbox).toBeInTheDocument();

    await act(() => {
      fireEvent.click(checkbox);
    });

    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });

    const continueButton = getByTestId('metametrics-i-agree');

    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(setParticipateInMetaMetrics).toHaveBeenCalledWith(false);
      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE);
    });
  });

  it('when the participate in MetaMetrics checkbox is unchecked, setDataCollectionForMarketing should be called with false', async () => {
    const { queryByText, getAllByRole, getByTestId } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const title = queryByText(onboardingMetametricCheckboxTitleTwo.message);
    const description = queryByText(
      onboardingMetametricCheckboxDescriptionTwo.message,
    );

    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();

    const participateCheckbox = getAllByRole('checkbox')[0];
    const marketingCheckbox = getAllByRole('checkbox')[1];

    expect(participateCheckbox).toBeChecked();
    expect(marketingCheckbox).not.toBeChecked();

    // Opt out of MetaMetrics; this should clear marketing consent
    await act(() => {
      fireEvent.click(participateCheckbox);
    });

    const continueButton = getByTestId('metametrics-i-agree');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(setDataCollectionForMarketing).toHaveBeenCalledWith(false);
      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE);
    });
  });

  it('should render the Onboarding component when the current date is after the new privacy policy date', () => {
    jest.useFakeTimers().setSystemTime(new Date('2099-11-11'));
    const { queryByTestId } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );
    expect(queryByTestId('onboarding-metametrics')).toBeInTheDocument();
  });

  it('on uncheking the participate meatametric, checked datacollection marketing checkbox should be unchecked', async () => {
    const { getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const participateCheckbox = getAllByRole('checkbox')[0];
    const marketingCheckbox = getAllByRole('checkbox')[1];

    expect(participateCheckbox).toBeChecked();
    expect(marketingCheckbox).not.toBeChecked();

    await act(() => {
      fireEvent.click(marketingCheckbox);
    });

    await waitFor(() => {
      expect(marketingCheckbox).toBeChecked();
    });

    await act(() => {
      fireEvent.click(participateCheckbox);
    });

    await waitFor(() => {
      expect(marketingCheckbox).not.toBeChecked();
    });
  });
});

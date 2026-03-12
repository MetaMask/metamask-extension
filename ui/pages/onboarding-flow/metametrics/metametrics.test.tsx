import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react';
import type { Dispatch, Store } from 'redux';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  setParticipateInMetaMetrics,
  setDataCollectionForMarketing,
} from '../../../store/actions';
import configureStore from '../../../store/store';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import OnboardingMetametrics from './metametrics';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
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

    const title = queryByText(
      messages.onboardingMetametricCheckboxTitleOne.message,
    );
    const description = queryByText(
      messages.onboardingMetametricCheckboxDescriptionOne.message,
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
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        { replace: true },
      );
    });
  });

  it('when the participate in MetaMetrics checkbox is unchecked, setParticipateInMetaMetrics should be called with false', async () => {
    const { queryByText, getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const title = queryByText(
      messages.onboardingMetametricCheckboxTitleOne.message,
    );
    const description = queryByText(
      messages.onboardingMetametricCheckboxDescriptionOne.message,
    );

    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();

    const checkboxLabel = queryByText(
      messages.onboardingMetametricCheckboxTitleOne.message,
    );
    expect(checkboxLabel).toBeInTheDocument();

    const checkbox = getAllByRole('checkbox')[0];
    const participateContainer = getByTestId(/^metametrics-checkbox-/u).closest(
      '[role="button"]',
    ) as HTMLElement;

    expect(checkbox).toBeChecked();
    expect(checkbox).toBeInTheDocument();

    await act(() => {
      fireEvent.click(participateContainer);
    });

    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });

    const continueButton = getByTestId('metametrics-i-agree');

    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(setParticipateInMetaMetrics).toHaveBeenCalledWith(false);
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        { replace: true },
      );
    });
  });

  it('when the participate in MetaMetrics checkbox is unchecked, setDataCollectionForMarketing should be called with false', async () => {
    const { queryByText, getByTestId } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const title = queryByText(
      messages.onboardingMetametricCheckboxTitleTwo.message,
    );
    const description = queryByText(
      messages.onboardingMetametricCheckboxDescriptionTwo.message,
    );

    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();

    const participateContainer = getByTestId(/^metametrics-checkbox-/u).closest(
      '[role="button"]',
    ) as HTMLElement;

    // Opt out of MetaMetrics; this should clear marketing consent
    await act(() => {
      fireEvent.click(participateContainer);
    });

    const continueButton = getByTestId('metametrics-i-agree');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(setDataCollectionForMarketing).toHaveBeenCalledWith(false);
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        { replace: true },
      );
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
    const { getAllByRole, getByTestId } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const marketingCheckbox = getAllByRole('checkbox')[1];

    const participateContainer = getByTestId(/^metametrics-checkbox-/u).closest(
      '[role="button"]',
    ) as HTMLElement;
    const marketingContainer = getByTestId(
      /^metametrics-data-collection-checkbox-/u,
    ).closest('[role="button"]') as HTMLElement;

    expect(marketingCheckbox).not.toBeChecked();

    await act(() => {
      fireEvent.click(marketingContainer);
    });

    await waitFor(() => {
      expect(marketingCheckbox).toBeChecked();
    });

    await act(() => {
      fireEvent.click(participateContainer);
    });

    await waitFor(() => {
      expect(marketingCheckbox).not.toBeChecked();
    });
  });

  it('clicking the participate checkbox container toggles the participate checkbox', async () => {
    const { getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const participateCheckboxContainer = getByTestId(
      /^metametrics-checkbox-/u,
    ).closest('[role="button"]') as HTMLElement;
    const checkbox = getAllByRole('checkbox')[0];

    expect(checkbox).toBeChecked();

    fireEvent.click(participateCheckboxContainer);
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });

    fireEvent.click(participateCheckboxContainer);
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });

  it('pressing Space on the participate checkbox container toggles the participate checkbox', async () => {
    const { getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const participateCheckboxContainer = getByTestId(
      /^metametrics-checkbox-/u,
    ).closest('[role="button"]') as HTMLElement;
    const checkbox = getAllByRole('checkbox')[0];

    expect(checkbox).toBeChecked();

    fireEvent.keyDown(participateCheckboxContainer, { key: ' ' });
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });

    fireEvent.keyDown(participateCheckboxContainer, { key: ' ' });
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });

  it('pressing Enter on the participate checkbox container toggles the participate checkbox', async () => {
    const { getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const participateCheckboxContainer = getByTestId(
      /^metametrics-checkbox-/u,
    ).closest('[role="button"]') as HTMLElement;
    const checkbox = getAllByRole('checkbox')[0];

    expect(checkbox).toBeChecked();

    fireEvent.keyDown(participateCheckboxContainer, { key: 'Enter' });
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('calls stopPropagation on the participate checkbox label click', () => {
    const { getByTestId } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const label = getByTestId(/^metametrics-checkbox-/u);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(event, 'stopPropagation');

    label.dispatchEvent(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('calls stopPropagation on the participate checkbox input click', () => {
    const { getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const checkbox = getAllByRole('checkbox')[0];
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(event, 'stopPropagation');

    checkbox.dispatchEvent(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('calls stopPropagation on the marketing checkbox label click', () => {
    const { getByTestId } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const label = getByTestId(/^metametrics-data-collection-checkbox-/u);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(event, 'stopPropagation');

    label.dispatchEvent(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('calls stopPropagation on the marketing checkbox input click', () => {
    const { getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const marketingCheckbox = getAllByRole('checkbox')[1];
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(event, 'stopPropagation');

    marketingCheckbox.dispatchEvent(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('clicking the marketing checkbox container toggles the marketing checkbox when participate is checked', async () => {
    const { getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const marketingCheckboxContainer = getByTestId(
      /^metametrics-data-collection-checkbox-/u,
    ).closest('[role="button"]') as HTMLElement;
    const marketingCheckbox = getAllByRole('checkbox')[1];

    expect(marketingCheckbox).not.toBeChecked();

    fireEvent.click(marketingCheckboxContainer);
    await waitFor(() => {
      expect(marketingCheckbox).toBeChecked();
    });

    fireEvent.click(marketingCheckboxContainer);
    await waitFor(() => {
      expect(marketingCheckbox).not.toBeChecked();
    });
  });

  it('pressing Space on the marketing checkbox container toggles the marketing checkbox when participate is checked', async () => {
    const { getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const marketingCheckboxContainer = getByTestId(
      /^metametrics-data-collection-checkbox-/u,
    ).closest('[role="button"]') as HTMLElement;
    const marketingCheckbox = getAllByRole('checkbox')[1];

    expect(marketingCheckbox).not.toBeChecked();

    fireEvent.keyDown(marketingCheckboxContainer, { key: ' ' });
    await waitFor(() => {
      expect(marketingCheckbox).toBeChecked();
    });
  });

  it('pressing Enter on the marketing checkbox container toggles the marketing checkbox when participate is checked', async () => {
    const { getByTestId, getAllByRole } = renderWithProvider(
      <OnboardingMetametrics />,
      store,
    );

    const marketingCheckboxContainer = getByTestId(
      /^metametrics-data-collection-checkbox-/u,
    ).closest('[role="button"]') as HTMLElement;
    const marketingCheckbox = getAllByRole('checkbox')[1];

    expect(marketingCheckbox).not.toBeChecked();

    fireEvent.keyDown(marketingCheckboxContainer, { key: 'Enter' });
    await waitFor(() => {
      expect(marketingCheckbox).toBeChecked();
    });
  });
});

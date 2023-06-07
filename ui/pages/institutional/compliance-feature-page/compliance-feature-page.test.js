import React from 'react';
import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import ComplianceFeaturePage from '.';

const mockedDeleteComplianceAuthData = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });
jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    deleteComplianceAuthData: mockedDeleteComplianceAuthData,
  }),
}));

describe('Compliance Feature, connect', function () {
  const mockStore = {
    metamask: {
      providerConfig: {
        type: 'test',
      },
      institutionalFeatures: {
        complianceProjectId: '',
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
    },
  };

  it('shows compliance feature button as activated', () => {
    const customMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        institutionalFeatures: {
          complianceProjectId: '123',
          complianceClientId: '123',
          reportsInProgress: {},
        },
      },
    };

    const store = configureMockStore()(customMockStore);

    const { getByText, getByTestId } = renderWithProvider(
      <ComplianceFeaturePage />,
      store,
    );

    expect(getByTestId('activated-label')).toBeVisible();
    expect(getByText('Active')).toBeInTheDocument();
  });

  it('shows ComplianceSettings when feature is not activated', () => {
    const store = configureMockStore()(mockStore);

    const { getByTestId } = renderWithProvider(
      <ComplianceFeaturePage />,
      store,
    );

    expect(getByTestId('institutional-content')).toBeVisible();
  });

  it('opens new tab on Open Codefi Compliance click', async () => {
    global.platform = { openTab: sinon.spy() };
    const store = configureMockStore()(mockStore);

    const { queryByTestId } = renderWithProvider(
      <ComplianceFeaturePage />,
      store,
    );

    const startBtn = queryByTestId('start-compliance');
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(global.platform.openTab.calledOnce).toStrictEqual(true);
    });
  });

  it('calls deleteComplianceAuthData on disconnect click', async () => {
    const customMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        institutionalFeatures: {
          complianceProjectId: '123',
          complianceClientId: '123',
          reportsInProgress: {},
        },
      },
    };

    const store = configureMockStore()(customMockStore);
    const { getByTestId } = renderWithProvider(
      <ComplianceFeaturePage />,
      store,
    );

    const disconnectBtn = getByTestId('disconnect-compliance');
    fireEvent.click(disconnectBtn);
    expect(mockedDeleteComplianceAuthData).toHaveBeenCalled();
  });
});

import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import ComplianceSettings from '.';

const mockedDeleteComplianceAuthData = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });
jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    deleteComplianceAuthData: mockedDeleteComplianceAuthData,
  }),
}));

const mockStore = {
  metamask: {
    provider: {
      type: 'test',
    },
    institutionalFeatures: {
      complianceProjectId: '',
      complianceClientId: '',
      reportsInProgress: {},
    },
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: true,
    },
  },
};

describe('Compliance Settings', () => {
  it('shows start btn when Compliance its not activated', () => {
    const store = configureMockStore()(mockStore);

    const { container, getByTestId } = renderWithProvider(
      <ComplianceSettings />,
      store,
    );

    expect(getByTestId('start-compliance')).toBeVisible();
    expect(container).toMatchSnapshot();
  });

  it('shows disconnect when Compliance is activated', () => {
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

    const { container, getByTestId } = renderWithProvider(
      <ComplianceSettings />,
      store,
    );

    expect(getByTestId('disconnect-compliance')).toBeVisible();
    expect(container).toMatchSnapshot();
  });
});

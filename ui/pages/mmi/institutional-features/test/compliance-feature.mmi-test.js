import React from 'react';
import sinon from 'sinon';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { mountWithRouter } from '../../../../../test/lib/render-helpers';
import ComplianceFeaturePage from '../compliance-feature-page.component';

const mockedDeleteComplianceAuthData = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });
jest.mock('../../../store/actions', () => ({
  getMMIActions: () => ({
    deleteComplianceAuthData: mockedDeleteComplianceAuthData,
  }),
}));

describe('Compliance Feature', function () {
  let wrapper;

  const mockStore = {
    metamask: {
      provider: {
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

  const store = configureMockStore()(mockStore);

  const props = {
    complianceActivated: true,
    deleteComplianceAuthData: sinon.stub().callsFake(() => true),
  };

  beforeEach(() => {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <ComplianceFeaturePage.WrappedComponent {...props} />
      </Provider>,
      store,
    );
  });

  describe('Connect Compliance', () => {
    it('shows compliance feature button as activated', () => {
      const featureButtonText = wrapper.find('[data-testid="activated-label"]');
      expect(featureButtonText.first().html()).toContain('activated');
    });

    it('shows ComplianceSettings when feature is not activated', () => {
      const complianceContent = wrapper.find(
        '[data-testid="institutional-content"]',
      );
      expect(complianceContent).toHaveLength(1);
    });

    it('opens new tab on Open Codefi Compliance click', () => {
      global.platform = { openTab: sinon.spy() };

      const openButton = wrapper
        .find('[data-testid="start-compliance"]')
        .first();
      openButton.simulate('click');

      expect(global.platform.openTab.called).toBeTruthy();
    });

    it('calls deleteComplianceAuthData on disconnect click', async () => {
      const middleware = [thunk];
      const mockStore2 = {
        metamask: {
          provider: {
            type: 'test',
          },
          institutionalFeatures: {
            complianceProjectId: '2',
          },
          preferences: {
            useNativeCurrencyAsPrimaryCurrency: true,
          },
        },
      };
      const store2 = configureMockStore(middleware)(mockStore2);
      wrapper = mountWithRouter(
        <Provider store={store2}>
          <ComplianceFeaturePage.WrappedComponent {...props} />
        </Provider>,
        store2,
      );

      wrapper.find('ComplianceSettings').props().complianceActivated = true;
      wrapper.update();
      const disconnectButton = wrapper
        .find('[data-testid="disconnect-compliance"]')
        .first();
      await disconnectButton.simulate('click');
      expect(mockedDeleteComplianceAuthData).toHaveBeenCalled();
    });
  });
});

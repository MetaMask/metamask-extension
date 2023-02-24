import React from 'react';
import PropTypes from 'prop-types';
import sinon from 'sinon';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import ConfirmAddInstitutionalFeature from './confirm-add-institutional-feature.container';

describe('Confirm Add Institutional Feature', function () {
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
    history: {
      push: sinon.spy(),
    },
    mostRecentOverviewPage: sinon.spy(),
    removeConnectInstitutionalFeature: sinon.stub().throws(new Error('')),
    setComplianceAuthData: sinon.spy(),
    connectRequests: [
      {
        labels: [
          {
            key: 'service',
            value: 'test',
          },
        ],
        origin: 'origin',
        token: {
          projectName: 'projectName',
          projectId: 'projectId',
          clientId: 'clientId',
        },
      },
    ],
  };

  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <ConfirmAddInstitutionalFeature.WrappedComponent {...props} />
      </Provider>,
      {
        context: {
          t: (str) => str,
          store,
          trackEvent: () => undefined,
        },
        childContextTypes: {
          t: PropTypes.func,
          store: PropTypes.object,
          trackEvent: () => undefined,
        },
      },
    );
  });

  afterEach(() => {
    props.history.push.resetHistory();
  });

  it('opens confirm institutional features with correct projectId', () => {
    const projectIdContainer = wrapper.find(
      '.institutional_feature_confirm__token',
    );
    expect(projectIdContainer.html()).toContain('projectName');
  });

  it('runs removeConnectInstitutionalFeature on cancel click', () => {
    const cancelButton = wrapper.find(
      '.btn-default.page-container__footer-button',
    );
    try {
      cancelButton.simulate('click');
    } catch (e) {
      console.log('handle error', e);
    }
    expect(props.removeConnectInstitutionalFeature.called).toBe(true);
  });

  it('runs setComplianceAuthData on confirm click', () => {
    const confirmButton = wrapper.find(
      '.btn-primary.page-container__footer-button',
    );
    confirmButton.simulate('click');
    expect(props.setComplianceAuthData.called).toBe(true);
  });

  it('handles error', () => {
    const confirmButton = wrapper.find(
      '.btn-primary.page-container__footer-button',
    );
    try {
      confirmButton.simulate('click');
    } catch (e) {
      const errorMessage = wrapper.find('.error');
      // TODO: write test without disabling eslint rule
      // eslint-disable-next-line jest/no-conditional-expect
      expect(errorMessage.html()).toContain('testError');
    }
  });
  it('does not render without connectRequest', () => {
    const newProps = {
      ...props,
      connectRequests: [],
    };
    wrapper = mount(
      <Provider store={store}>
        <ConfirmAddInstitutionalFeature.WrappedComponent {...newProps} />
      </Provider>,
      {
        context: {
          t: (str) => str,
          store,
          trackEvent: () => undefined,
        },
        childContextTypes: {
          t: PropTypes.func,
          store: PropTypes.object,
          trackEvent: () => undefined,
        },
      },
    );
    expect(wrapper.html()).toBeFalsy();
  });
});

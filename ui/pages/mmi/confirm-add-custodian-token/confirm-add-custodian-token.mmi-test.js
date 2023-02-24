import React from 'react';
import PropTypes from 'prop-types';
import sinon from 'sinon';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import ConfirmAddCustodianToken from './confirm-add-custodian-token.container';

describe('Confirm Add Custodian Token', function () {
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
    removeAddTokenConnectRequest: sinon.stub().throws(new Error('')),
    setCustodianConnectRequest: sinon.spy(),
    setProviderType: sinon.spy(),
    connectRequests: [
      {
        labels: [
          {
            key: 'service',
            value: 'test',
          },
        ],
        origin: 'origin',
        token: 'testToken',
        feature: 'custodian',
        service: 'Jupiter',
        apiUrl: 'https://',
        chainId: 1,
      },
    ],
  };

  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <ConfirmAddCustodianToken.WrappedComponent {...props} />
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

  it('opens confirm add custodian token with correct token', () => {
    const projectIdContainer = wrapper.find(
      '.add_custodian_token_confirm__token',
    );
    expect(projectIdContainer.html()).toContain('testToken');
  });

  it('runs removeAddTokenConnectRequest on cancel click', () => {
    const cancelButton = wrapper.find(
      '.btn-default.page-container__footer-button',
    );
    try {
      cancelButton.simulate('click');
    } catch (e) {
      console.log('handle error', e);
    }
    expect(props.removeAddTokenConnectRequest.called).toBe(true);
  });

  it('runs setCustodianConnectRequest on confirm click', async () => {
    const confirmButton = wrapper.find(
      '.btn-primary.page-container__footer-button',
    );
    await confirmButton.simulate('click');
    expect(props.setCustodianConnectRequest.called).toBe(true);
  });

  it('tries to connect to custodian with empty token', async () => {
    const newProps = {
      ...props,
      connectRequests: [
        {
          labels: [
            {
              key: 'service',
              value: 'test',
            },
          ],
          origin: 'origin',
          token: '',
          feature: 'custodian',
          service: 'Jupiter',
          apiUrl: 'https://',
          chainId: 1,
        },
      ],
    };

    const addCustodianWrapper = mount(
      <Provider store={store}>
        <ConfirmAddCustodianToken.WrappedComponent {...newProps} />
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

    const confirmButton = addCustodianWrapper.find(
      '.btn-primary.page-container__footer-button',
    );

    await confirmButton.simulate('click');

    const errorMessage = addCustodianWrapper.find(
      '[data-testid="connect-custodian-token-error"]',
    );

    expect(errorMessage.html()).toContain('error');
  });

  it('runs setProviderType with mainnet as parameter on confirm click', () => {
    const confirmButton = wrapper.find(
      '.btn-primary.page-container__footer-button',
    );
    confirmButton.simulate('click');
    expect(props.setProviderType.calledWith('mainnet')).toBe(true);
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
});

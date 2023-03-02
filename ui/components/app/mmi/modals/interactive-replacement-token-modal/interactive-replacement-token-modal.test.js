import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import Modal from '../../../modal';
import InteractiveReplacementTokenModal from './interactive-replacement-token-modal.container';

describe('Interactive Replacement Token Modal', function () {
  let wrapper;

  const state = {
    metamask: {},
  };

  const props = {
    hideModal: sinon.spy(),
    custodianName: 'Jupiter',
    custodian: {
      production: true,
      name: 'Jupiter',
      type: 'Jupiter',
      iconUrl: 'iconUrl',
      displayName: 'displayName',
    },

    url: 'https://saturn-custody-ui.codefi.network/',
  };

  const mockStore = configureStore();
  const store = mockStore(state);

  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <InteractiveReplacementTokenModal.WrappedComponent {...props} />
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
    props.hideModal.resetHistory();
  });

  it('should render correctly', () => {
    expect(wrapper.find(Modal)).toHaveLength(1);
  });

  it('tries to open new tab with deeplink URL', () => {
    global.platform = { openTab: sinon.spy() };
    const button = wrapper.find({ children: props.custodian.displayName });
    button.simulate('click');
    expect(global.platform.openTab.calledOnce).toBe(true);
    expect(global.platform.openTab.calledWith({ url: props.url })).toBe(true);
  });
});

import React from 'react';
import PropTypes from 'prop-types';
import sinon from 'sinon';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import InstitutionalEntityDonePage from '.';

describe('InstitutionalEntityDonePage', function () {
  let wrapper;

  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
    },
    history: {
      mostRecentOverviewPage: 'test',
    },
  };

  const store = configureMockStore()(mockStore);

  const props = {
    history: {
      push: sinon.spy(),
    },
    mostRecentOverviewPage: 'test',
    location: {
      state: { imgSrc: 'test', title: 'title', description: 'description' },
    },
  };

  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <InstitutionalEntityDonePage {...props} />
      </Provider>,
      {
        context: {
          t: (str) => str,
          store,
          metricsEvent: () => undefined,
        },
        childContextTypes: {
          t: PropTypes.func,
          store: PropTypes.object,
          metricsEvent: () => undefined,
        },
      },
    );
  });

  it('calls history push on button click', () => {
    const btn = wrapper.find('.page-container__footer-button');
    btn.first().simulate('click');
    expect(props.history.push.called).toBeTruthy();
  });
});

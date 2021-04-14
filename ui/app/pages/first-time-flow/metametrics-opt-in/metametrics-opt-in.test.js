import React from 'react';
import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import { mountWithRouter } from '../../../../../test/lib/render-helpers';
import MetaMetricsOptIn from './metametrics-opt-in.container';

describe('MetaMetricsOptIn', () => {
  it('opt out of MetaMetrics', () => {
    const props = {
      history: {
        push: sinon.spy(),
      },
      setParticipateInMetaMetrics: sinon.stub().resolves(),
      participateInMetaMetrics: false,
    };
    const store = configureMockStore()({
      metamask: {},
    });
    const wrapper = mountWithRouter(
      <MetaMetricsOptIn.WrappedComponent {...props} />,
      store,
    );
    const noThanksButton = wrapper.find(
      '.btn-default.page-container__footer-button',
    );
    noThanksButton.simulate('click');

    expect(
      props.setParticipateInMetaMetrics.calledOnceWithExactly(false),
    ).toStrictEqual(true);
    props.setParticipateInMetaMetrics.resetHistory();
  });
});

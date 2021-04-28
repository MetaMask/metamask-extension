import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import messages from '../../../../../app/_locales/en/messages.json';
import MetaMetricsOptIn from './metametrics-opt-in-modal.container';

describe('MetaMetrics Opt In', () => {
  let wrapper;

  const props = {
    setParticipateInMetaMetrics: sinon.stub().resolves(),
    hideModal: sinon.spy(),
    participateInMetaMetrics: null,
  };

  beforeEach(() => {
    wrapper = mount(<MetaMetricsOptIn.WrappedComponent {...props} />, {
      context: {
        metricsEvent: () => undefined,
        t: (key) => messages[key].message,
      },
    });
  });

  afterEach(() => {
    props.setParticipateInMetaMetrics.resetHistory();
    props.hideModal.resetHistory();
  });

  it('passes false to setParticipateInMetaMetrics and hides modal', async () => {
    const noThanks = wrapper.find('.btn-default.page-container__footer-button');
    noThanks.simulate('click');

    expect(await props.setParticipateInMetaMetrics.calledOnce).toStrictEqual(
      true,
    );
    expect(props.setParticipateInMetaMetrics.getCall(0).args[0]).toStrictEqual(
      false,
    );
    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });

  it('passes true to setParticipateInMetaMetrics and hides modal', async () => {
    const affirmAgree = wrapper.find(
      '.btn-primary.page-container__footer-button',
    );
    affirmAgree.simulate('click');

    expect(await props.setParticipateInMetaMetrics.calledOnce).toStrictEqual(
      true,
    );
    expect(props.setParticipateInMetaMetrics.getCall(0).args[0]).toStrictEqual(
      true,
    );
    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });
});

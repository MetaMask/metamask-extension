import assert from 'assert';
import React from 'react';
import sinon from 'sinon';
import { mountWithRouter } from '../../../../../test/lib/render-helpers';
import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_METAMETRICS_OPT_IN_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
} from '../../../helpers/constants/routes';
import SelectAction from './select-action.container';

describe('Selection Action', function () {
  const props = {
    isInitialized: false,
    setFirstTimeFlowType: sinon.spy(),
    history: {
      push: sinon.spy(),
    },
    metaMetricsParticipationSet: false,
  };

  afterEach(function () {
    props.setFirstTimeFlowType.resetHistory();
    props.history.push.resetHistory();
  });

  it('clicks import wallet to route to import FTF (metaMetricsParticipationSet false)', function () {
    const wrapper = mountWithRouter(
      <SelectAction.WrappedComponent {...props} />,
    );
    const importWalletButton = wrapper
      .find('.btn-primary.first-time-flow__button')
      .at(0);
    importWalletButton.simulate('click');

    assert(props.setFirstTimeFlowType.calledOnce);
    assert.strictEqual(props.setFirstTimeFlowType.getCall(0).args[0], 'import');
    assert(props.history.push.calledOnce);
    assert.strictEqual(
      props.history.push.getCall(0).args[0],
      INITIALIZE_METAMETRICS_OPT_IN_ROUTE,
    );
  });

  it('clicks create wallet to route to create FTF (metaMetricsParticipationSet false)', function () {
    const wrapper = mountWithRouter(
      <SelectAction.WrappedComponent {...props} />,
    );
    const createWalletButton = wrapper
      .find('.btn-primary.first-time-flow__button')
      .at(1);
    createWalletButton.simulate('click');

    assert(props.setFirstTimeFlowType.calledOnce);
    assert.strictEqual(props.setFirstTimeFlowType.getCall(0).args[0], 'create');
    assert(props.history.push.calledOnce);
    assert.strictEqual(
      props.history.push.getCall(0).args[0],
      INITIALIZE_METAMETRICS_OPT_IN_ROUTE,
    );
  });

  it('clicks import wallet to route to import FTF (metaMetricsParticipationSet true)', function () {
    const newProps = {
      ...props,
      metaMetricsParticipationSet: true,
    };
    const wrapper = mountWithRouter(
      <SelectAction.WrappedComponent {...newProps} />,
    );
    const importWalletButton = wrapper
      .find('.btn-primary.first-time-flow__button')
      .at(0);
    importWalletButton.simulate('click');

    assert(props.setFirstTimeFlowType.calledOnce);
    assert.strictEqual(props.setFirstTimeFlowType.getCall(0).args[0], 'import');
    assert(props.history.push.calledOnce);
    assert.strictEqual(
      props.history.push.getCall(0).args[0],
      INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
    );
  });

  it('clicks create wallet to route to create FTF (metaMetricsParticipationSet true)', function () {
    const newProps = {
      ...props,
      metaMetricsParticipationSet: true,
    };
    const wrapper = mountWithRouter(
      <SelectAction.WrappedComponent {...newProps} />,
    );
    const createWalletButton = wrapper
      .find('.btn-primary.first-time-flow__button')
      .at(1);
    createWalletButton.simulate('click');

    assert(props.setFirstTimeFlowType.calledOnce);
    assert.strictEqual(props.setFirstTimeFlowType.getCall(0).args[0], 'create');
    assert(props.history.push.calledOnce);
    assert.strictEqual(
      props.history.push.getCall(0).args[0],
      INITIALIZE_CREATE_PASSWORD_ROUTE,
    );
  });
});

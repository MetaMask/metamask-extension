import React from 'react';
import sinon from 'sinon';
import { mountWithRouter } from '../../../../../test/lib/render-helpers';
import SelectAction from './select-action.container';

describe('Selection Action', () => {
  let wrapper;

  const props = {
    isInitialized: false,
    setFirstTimeFlowType: sinon.spy(),
    history: {
      push: sinon.spy(),
    },
  };

  beforeEach(() => {
    wrapper = mountWithRouter(<SelectAction.WrappedComponent {...props} />);
  });

  afterEach(() => {
    props.setFirstTimeFlowType.resetHistory();
    props.history.push.resetHistory();
  });

  it('clicks import wallet to route to import FTF', () => {
    const importWalletButton = wrapper
      .find('.btn-primary.first-time-flow__button')
      .at(0);
    importWalletButton.simulate('click');

    expect(props.setFirstTimeFlowType.calledOnce).toStrictEqual(true);
    expect(props.setFirstTimeFlowType.getCall(0).args[0]).toStrictEqual(
      'import',
    );
    expect(props.history.push.calledOnce).toStrictEqual(true);
  });

  it('clicks create wallet to route to create FTF', () => {
    const createWalletButton = wrapper
      .find('.btn-primary.first-time-flow__button')
      .at(1);
    createWalletButton.simulate('click');

    expect(props.setFirstTimeFlowType.calledOnce).toStrictEqual(true);
    expect(props.setFirstTimeFlowType.getCall(0).args[0]).toStrictEqual(
      'create',
    );
    expect(props.history.push.calledOnce).toStrictEqual(true);
  });
});

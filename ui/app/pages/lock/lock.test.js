import React from 'react';
import sinon from 'sinon';
import { mountWithRouter } from '../../../../test/lib/render-helpers';
import Lock from './lock.container';

describe('Lock', () => {
  it('replaces history with default route when isUnlocked false', () => {
    const props = {
      isUnlocked: false,
      history: {
        replace: sinon.spy(),
      },
    };

    mountWithRouter(<Lock.WrappedComponent {...props} />);

    expect(props.history.replace.getCall(0).args[0]).toStrictEqual('/');
  });

  it('locks and pushes history with default route when isUnlocked true', async () => {
    const props = {
      isUnlocked: true,
      lockMetamask: sinon.stub(),
      history: {
        push: sinon.spy(),
      },
    };

    props.lockMetamask.resolves();

    mountWithRouter(<Lock.WrappedComponent {...props} />);

    expect(await props.lockMetamask.calledOnce).toStrictEqual(true);
    expect(props.history.push.getCall(0).args[0]).toStrictEqual('/');
  });
});

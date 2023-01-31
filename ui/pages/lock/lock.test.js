import React from 'react';
import sinon from 'sinon';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import Lock from './lock.component';

describe('Lock', () => {
  it('replaces history with default route when isUnlocked false', () => {
    const props = {
      isUnlocked: false,
      history: {
        replace: sinon.spy(),
      },
    };

    renderWithProvider(<Lock {...props} />);

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

    renderWithProvider(<Lock {...props} />);

    expect(await props.lockMetamask.calledOnce).toStrictEqual(true);
    expect(props.history.push.getCall(0).args[0]).toStrictEqual('/');
  });
});

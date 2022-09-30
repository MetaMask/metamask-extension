import React from 'react';
import sinon from 'sinon';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SelectAction from './select-action.container';

describe('Selection Action', () => {
  const props = {
    isInitialized: false,
    setFirstTimeFlowType: sinon.spy(),
    history: {
      push: sinon.spy(),
    },
  };

  beforeEach(() => {
    renderWithProvider(<SelectAction.WrappedComponent {...props} />);
  });

  afterEach(() => {
    props.setFirstTimeFlowType.resetHistory();
    props.history.push.resetHistory();
  });

  it('clicks import wallet to route to import FTF', () => {
    const importButton = screen.getByTestId('import-wallet-button');
    fireEvent.click(importButton);

    expect(props.setFirstTimeFlowType.calledOnce).toStrictEqual(true);
    expect(props.setFirstTimeFlowType.getCall(0).args[0]).toStrictEqual(
      'import',
    );
    expect(props.history.push.calledOnce).toStrictEqual(true);
  });

  it('clicks create wallet to route to create FTF', () => {
    const importButton = screen.getByTestId('create-wallet-button');
    fireEvent.click(importButton);

    expect(props.setFirstTimeFlowType.calledOnce).toStrictEqual(true);
    expect(props.setFirstTimeFlowType.getCall(0).args[0]).toStrictEqual(
      'create',
    );
    expect(props.history.push.calledOnce).toStrictEqual(true);
  });
});

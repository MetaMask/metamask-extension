import React from 'react';
import configureMockStore from 'redux-mock-store';
import sinon from 'sinon';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import EditGasToolTip from './edit-gas-tooltip';

const LOW_GAS_OPTION = {
  gasLimit: 21000,
  maxFeePerGas: '2.010203381',
  maxPriorityFeePerGas: '1.20004164',
  maxFeePerGasValue: '2.383812808',
  maxPriorityFeePerGasValue: '1.5',
  origin: 'metamask',
};

const MEDIUM_GAS_OPTION = {
  gasLimit: 21000,
  maxFeePerGas: '2.383812808',
  maxPriorityFeePerGas: '1.5',
  maxFeePerGasValue: '2.383812808',
  maxPriorityFeePerGasValue: '1.5',
  origin: 'metamask',
};

const HIGH_GAS_OPTION = {
  gasLimit: 21000,
  maxFeePerGas: '2.920638342',
  maxPriorityFeePerGas: '2',
  maxFeePerGasValue: '2.383812808',
  maxPriorityFeePerGasValue: '1.5',
  origin: 'metamask',
};

const renderComponent = (props) => {
  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
    },
  };

  const store = configureMockStore()(mockStore);

  return renderWithProvider(
    <EditGasToolTip {...props} t={sinon.stub()} />,
    store,
  );
};

describe('EditGasToolTip', () => {
  it('should render correct values for priorityLevel low', () => {
    const { queryByText } = renderComponent({
      priorityLevel: 'low',
      gasContext: LOW_GAS_OPTION,
    });

    expect(queryByText('2.010203381')).toBeInTheDocument();
    expect(queryByText('1.20004164')).toBeInTheDocument();
    expect(queryByText('21000')).toBeInTheDocument();
  });

  it('should render correct values for priorityLevel medium', () => {
    const { queryByText } = renderComponent({
      priorityLevel: 'medium',
      gasContext: MEDIUM_GAS_OPTION,
    });
    expect(queryByText('2.383812808')).toBeInTheDocument();
    expect(queryByText('1.5')).toBeInTheDocument();
    expect(queryByText('21000')).toBeInTheDocument();
  });

  it('should render correct values for priorityLevel high', () => {
    const { queryByText } = renderComponent({
      priorityLevel: 'high',
      gasContext: HIGH_GAS_OPTION,
    });
    expect(queryByText('2.920638342')).toBeInTheDocument();
    expect(queryByText('2')).toBeInTheDocument();
    expect(queryByText('21000')).toBeInTheDocument();
  });
});

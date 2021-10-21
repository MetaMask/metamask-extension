import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { defaultNetworksData } from '../networks-tab.constants';
import NetworkForm from '.';

function shallowRender(props = {}, context = {}) {
  return shallow(<NetworkForm {...props} />, {
    context: {
      t: (str) => `${str}_t`,
      metricsEvent: () => undefined,
      ...context,
    },
  });
}

const defaultNetworks = defaultNetworksData.map((network) => ({
  ...network,
  viewOnly: true,
}));

const propNewNetwork = {
  onClear: sinon.spy(),
  setRpcTarget: sinon.spy(),
  networksToRender: defaultNetworks,
  onAddNetwork: sinon.spy(),
  setNewNetworkAdded: sinon.spy(),
  addNewNetwork: true,
};

const propNetworkDisplay = {
  editRpc: sinon.spy(),
  showConfirmDeleteNetworkModal: sinon.spy(),
  rpcUrl: 'http://localhost:8545',
  chainId: '1337',
  ticker: 'ETH',
  viewOnly: false,
  networkName: 'LocalHost',
  onClear: sinon.spy(),
  setRpcTarget: sinon.spy(),
  isCurrentRpcTarget: false,
  blockExplorerUrl: '',
  rpcPrefs: {},
  networksToRender: defaultNetworks,
  onAddNetwork: sinon.spy(),
  setNewNetworkAdded: sinon.spy(),
  addNewNetwork: false,
};

describe('NetworkForm Component', () => {
  it('should render Add new network form correctly', () => {
    const root = shallowRender({ ...propNewNetwork });
    expect(root.find('.add-network-form__network-form-row')).toHaveLength(5);
    expect(
      root
        .find(
          '.add-network-form__footer .add-network-form__footer-submit-button',
        )
        .props().disabled,
    ).toStrictEqual(true);
  });
  it('should render network form correctly', () => {
    const root = shallowRender({ ...propNetworkDisplay });
    expect(root.find('.networks-tab__network-form-row')).toHaveLength(5);
    const networkName = root.find('.networks-tab__network-form-row').get(0)
      .props;
    const rpcUrl = root.find('.networks-tab__network-form-row').get(1).props;
    const chainId = root.find('.networks-tab__network-form-row').get(2).props;
    const ticker = root.find('.networks-tab__network-form-row').get(3).props;
    expect(networkName.children[1].props.value).toStrictEqual(
      propNetworkDisplay.networkName,
    );
    expect(rpcUrl.children[1].props.value).toStrictEqual(
      propNetworkDisplay.rpcUrl,
    );
    expect(chainId.children[1].props.value).toStrictEqual(
      propNetworkDisplay.chainId,
    );
    expect(ticker.children[1].props.value).toStrictEqual(
      propNetworkDisplay.ticker,
    );
    expect(root.find('Button')).toHaveLength(3);
  });
});

import React from 'react';
import { shallow } from 'enzyme';
import PageContainerContent from '../../../components/ui/page-container/page-container-content.component';
import Dialog from '../../../components/ui/dialog';
import SendContent from './send-content.component';

<<<<<<< HEAD
import SendAmountRow from './send-amount-row/send-amount-row.container';
import SendAssetRow from './send-asset-row/send-asset-row.container';
import SendHexDataRow from './send-hex-data-row/send-hex-data-row';
=======
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockSendState from '../../../../test/data/mock-send-state.json';
import {
  NETWORK_TYPES,
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import SendContent from '.';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn().mockResolvedValue(),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  createTransactionEventFragment: jest.fn(),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue('unknown'),
}));
>>>>>>> upstream/multichain-swaps-controller

describe('SendContent Component', () => {
  let wrapper;

  const defaultProps = {
    showHexData: true,
    gasIsExcessive: false,
    networkAndAccountSupports1559: true,
  };

  beforeEach(() => {
    wrapper = shallow(<SendContent {...defaultProps} />, {
      context: { t: (str) => `${str}_t` },
    });
  });

  describe('render', () => {
<<<<<<< HEAD
    it('should render a PageContainerContent component', () => {
      expect(wrapper.find(PageContainerContent)).toHaveLength(1);
=======
    const mockStore = configureMockStore()({
      ...mockSendState,
      metamask: {
        ...mockSendState.metamask,
        providerConfig: {
          chainId: CHAIN_IDS.GOERLI,
          nickname: GOERLI_DISPLAY_NAME,
          type: NETWORK_TYPES.GOERLI,
        },
      },
>>>>>>> upstream/multichain-swaps-controller
    });

    it('should render a div with a .send-v2__form class as a child of PageContainerContent', () => {
      const PageContainerContentChild = wrapper
        .find(PageContainerContent)
        .children();
      expect(PageContainerContentChild.is('div')).toStrictEqual(true);
      expect(PageContainerContentChild.is('.send-v2__form')).toStrictEqual(
        true,
      );
    });

    it('should render the correct row components as grandchildren of the PageContainerContent component', () => {
      const PageContainerContentChild = wrapper
        .find(PageContainerContent)
        .children();
      expect(PageContainerContentChild.childAt(0).is(Dialog)).toStrictEqual(
        true,
      );
      expect(
        PageContainerContentChild.childAt(1).is(SendAssetRow),
      ).toStrictEqual(true);
      expect(
        PageContainerContentChild.childAt(2).is(SendAmountRow),
      ).toStrictEqual(true);
      expect(
        PageContainerContentChild.childAt(3).is(SendHexDataRow),
      ).toStrictEqual(true);
    });

    it('should not render the SendHexDataRow if props.showHexData is false', () => {
      wrapper.setProps({ showHexData: false });
      const PageContainerContentChild = wrapper
        .find(PageContainerContent)
        .children();
      expect(PageContainerContentChild.childAt(0).is(Dialog)).toStrictEqual(
        true,
      );
      expect(
        PageContainerContentChild.childAt(1).is(SendAssetRow),
      ).toStrictEqual(true);
      expect(
        PageContainerContentChild.childAt(2).is(SendAmountRow),
      ).toStrictEqual(true);
      expect(wrapper.find(SendHexDataRow)).toHaveLength(0);
    });

    it('should not render the Dialog if contact has a name', () => {
      wrapper.setProps({
        showHexData: false,
        contact: { name: 'testName' },
      });
      const PageContainerContentChild = wrapper
        .find(PageContainerContent)
        .children();
      expect(
        PageContainerContentChild.childAt(0).is(SendAssetRow),
      ).toStrictEqual(true);
      expect(
        PageContainerContentChild.childAt(1).is(SendAmountRow),
      ).toStrictEqual(true);
      expect(wrapper.find(Dialog)).toHaveLength(0);
    });

    it('should not render the Dialog if it is an ownedAccount', () => {
      wrapper.setProps({
        showHexData: false,
        isOwnedAccount: true,
      });
      const PageContainerContentChild = wrapper
        .find(PageContainerContent)
        .children();
      expect(
        PageContainerContentChild.childAt(0).is(SendAssetRow),
      ).toStrictEqual(true);
      expect(
        PageContainerContentChild.childAt(1).is(SendAmountRow),
      ).toStrictEqual(true);
      expect(wrapper.find(Dialog)).toHaveLength(0);
    });
  });

<<<<<<< HEAD
  it('should not render the asset dropdown if token length is 0', () => {
    wrapper.setProps({ tokens: [] });
    const PageContainerContentChild = wrapper
      .find(PageContainerContent)
      .children();
    expect(PageContainerContentChild.childAt(1).is(SendAssetRow)).toStrictEqual(
      true,
    );
    expect(
      PageContainerContentChild.childAt(1).find(
        'send-v2__asset-dropdown__single-asset',
      ),
    ).toHaveLength(0);
  });

  it('should render warning', () => {
    wrapper.setProps({
      warning: 'watchout',
=======
  describe('SendHexDataRow', () => {
    const tokenAssetState = {
      ...mockSendState,
      send: {
        ...mockSendState.send,
        draftTransactions: {
          '1-tx': {
            ...mockSendState.send.draftTransactions['1-tx'],
            asset: {
              balance: '0x3635c9adc5dea00000',
              details: {
                address: '0xAddress',
                decimals: 18,
                symbol: 'TST',
                balance: '1',
                standard: 'ERC20',
              },
              error: null,
              type: 'TOKEN',
            },
          },
        },
      },
      metamask: {
        ...mockSendState.metamask,
        providerConfig: {
          chainId: CHAIN_IDS.GOERLI,
          nickname: GOERLI_DISPLAY_NAME,
          type: NETWORK_TYPES.GOERLI,
        },
      },
    };

    it('should not render the SendHexDataRow if props.showHexData is false', async () => {
      const props = {
        gasIsExcessive: false,
        showHexData: false,
      };

      const mockStore = configureMockStore()({
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      });

      const { queryByText } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      await waitFor(() => {
        expect(queryByText('Hex data:')).not.toBeInTheDocument();
      });
    });

    it('should not render the SendHexDataRow if the asset type is TOKEN (ERC-20)', async () => {
      const props = {
        gasIsExcessive: false,
        showHexData: true,
      };

      // Use token draft transaction asset
      const mockState = configureMockStore()(tokenAssetState);

      const { queryByText } = renderWithProvider(
        <SendContent {...props} />,
        mockState,
      );

      await waitFor(() => {
        expect(queryByText('Hex data:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Gas Error', () => {
    it('should show gas warning when gasIsExcessive prop is true.', async () => {
      const props = {
        gasIsExcessive: true,
        showHexData: false,
      };

      const mockStore = configureMockStore()({
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      });

      const { queryByTestId } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      const gasWarning = queryByTestId('gas-warning-message');

      await waitFor(() => {
        expect(gasWarning).toBeInTheDocument();
      });
>>>>>>> upstream/multichain-swaps-controller
    });

    const dialog = wrapper.find(Dialog).at(0);

<<<<<<< HEAD
    expect(dialog.props().type).toStrictEqual('warning');
    expect(dialog.props().children).toStrictEqual('watchout_t');
    expect(dialog).toHaveLength(1);
=======
      const noGasPriceState = {
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          gasEstimateType: 'none',
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      };

      const mockStore = configureMockStore()(noGasPriceState);

      const { queryByTestId } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      const gasWarning = queryByTestId('gas-warning-message');

      await waitFor(() => {
        expect(gasWarning).toBeInTheDocument();
      });
    });
  });

  describe('Recipient Warning', () => {
    it('should show recipient warning with knownAddressRecipient state in draft transaction state', async () => {
      const props = {
        gasIsExcessive: false,
        showHexData: false,
      };

      const knownRecipientWarningState = {
        ...mockSendState,
        send: {
          ...mockSendState.send,
          draftTransactions: {
            '1-tx': {
              ...mockSendState.send.draftTransactions['1-tx'],
              recipient: {
                ...mockSendState.send.draftTransactions['1-tx'].recipient,
                warning: 'knownAddressRecipient',
              },
            },
          },
        },
        metamask: {
          ...mockSendState.metamask,
          gasEstimateType: 'none',
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      };

      const mockStore = configureMockStore()(knownRecipientWarningState);

      const { queryByTestId } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      const sendWarning = queryByTestId('send-warning');

      await waitFor(() => {
        expect(sendWarning).toBeInTheDocument();
      });
    });
  });

  describe('Assert Error', () => {
    it('should render dialog error with asset error in draft transaction state', async () => {
      const props = {
        gasIsExcessive: false,
        showHexData: false,
      };

      const assertErrorState = {
        ...mockSendState,
        send: {
          ...mockSendState.send,
          draftTransactions: {
            '1-tx': {
              ...mockSendState.send.draftTransactions['1-tx'],
              asset: {
                ...mockSendState.send.draftTransactions['1-tx'].asset,
                error: 'transactionError',
              },
            },
          },
        },
        metamask: {
          ...mockSendState.metamask,
          gasEstimateType: 'none',
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      };

      const mockStore = configureMockStore()(assertErrorState);

      const { queryByTestId } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      const dialogMessage = queryByTestId('dialog-message');

      await waitFor(() => {
        expect(dialogMessage).toBeInTheDocument();
      });
    });
  });

  describe('Warning', () => {
    it('should display warning dialog message from warning prop', async () => {
      const props = {
        gasIsExcessive: false,
        showHexData: false,
        warning: 'warning',
      };

      const mockStore = configureMockStore()({
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      });

      const { queryByTestId } = renderWithProvider(
        <SendContent {...props} />,
        mockStore,
      );

      const dialogMessage = queryByTestId('dialog-message');

      await waitFor(() => {
        expect(dialogMessage).toBeInTheDocument();
      });
    });
>>>>>>> upstream/multichain-swaps-controller
  });
});

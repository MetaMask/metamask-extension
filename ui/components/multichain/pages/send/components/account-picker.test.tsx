import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import mockState from '../../../../../../test/data/mock-state.json';
import { fireEvent, renderWithProvider } from '../../../../../../test/jest';
import { SEND_STAGES } from '../../../../../ducks/send';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../../../../test/jest/mocks';
import { SendPageAccountPicker } from '.';

const render = (props = {}, sendStage = SEND_STAGES.ADD_RECIPIENT) => {
  const middleware = [thunk];
  const store = configureMockStore(middleware)({
    ...mockState,
    send: {
      ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
      stage: sendStage,
    },
    gas: { basicEstimateStatus: 'LOADING' },
    history: { mostRecentOverviewPage: 'activity' },
    metamask: {
      ...mockState.metamask,
      permissionHistory: {
        'https://test.dapp': {
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1596681857076,
            },
          },
        },
      },
      subjects: {
        'https://test.dapp': {
          permissions: {
            eth_accounts: {
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
                },
              ],
              invoker: 'https://test.dapp',
              parentCapability: 'eth_accounts',
            },
          },
        },
      },
    },
    activeTab: {
      origin: 'https://test.dapp',
    },
  });
  return renderWithProvider(<SendPageAccountPicker {...props} />, store);
};

describe('SendPageAccountPicker', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = render();
      expect(container).toMatchSnapshot();

      expect(getByTestId('send-page-account-picker')).toBeInTheDocument();
    });

    it('renders as disabled when editing a send', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { getByTestId } = render({}, SEND_STAGES.EDIT);

      expect(getByTestId('send-page-account-picker')).toBeDisabled();
    });
  });

  describe('actions', () => {
    it('opens account picker when clicked', () => {
      const { getByTestId } = render();
      fireEvent.click(getByTestId('send-page-account-picker'));
      expect(
        document.querySelector('.multichain-account-menu-popover'),
      ).toBeInTheDocument();
    });
  });
});

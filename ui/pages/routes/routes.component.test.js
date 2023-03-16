import React from 'react';
import configureMockStore from 'redux-mock-store';
// import { fireEvent } from '@testing-library/react';

// import { SEND_STAGES } from '../../ducks/send';
// import { getInitialSendStateWithExistingTxState } from '../../../test/jest/mocks';
import { renderWithProvider } from '../../../test/jest';
import mockSendState from '../../../test/data/mock-send-state.json';
import Routes from '.';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getManifest: () => ({ manifest_version: 2 }),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useDispatch: jest.fn(),
  };
});

describe('Routes Component', () => {
  describe('render', () => {
    it('should render draft send page', () => {
      const store = configureMockStore()({
        ...mockSendState,
        // send: getInitialSendStateWithExistingTxState(),
      });
      const { container, findByTestId } = renderWithProvider(
        <Routes />,
        store,
        ['/send'],
      );

      expect(container).toMatchSnapshot();
      expect(findByTestId('account-menu-icon')).toBeDisabled();
    });
  });
});

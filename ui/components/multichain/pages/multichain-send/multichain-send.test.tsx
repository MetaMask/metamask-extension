import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { act } from '@testing-library/react';
import {
  renderWithProvider,
  waitFor,
  fireEvent,
} from '../../../../../test/jest';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import { MultichainSendPage } from './multichain-send';

const mockResetSendState = jest.fn();

const baseStore = {};

const render = async (state) => {
  const middleware = [thunk];

  const store = configureMockStore(middleware)(state);

  let result;

  await act(
    async () => (result = renderWithProvider(<MultichainSendPage />, store)),
  );

  return { store, result };
};

describe('MultichainSendPage', () => {
  it('renders correctly', () => {});
});

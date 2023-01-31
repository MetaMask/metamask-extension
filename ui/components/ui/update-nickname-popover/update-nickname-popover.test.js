import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import UpdateNicknamePopover from './update-nickname-popover';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  return renderWithProvider(
    <UpdateNicknamePopover
      nickname="user_nickname"
      memo="This is a memo"
      address="0xdeDbcA0156308960E3bBa2f5a273E72179940788"
    />,
    store,
  );
};

describe('UpdateNicknamePopover', () => {
  it('renders UpdateNicknamePopover component and shows This is a memo text', () => {
    render();
    expect(screen.getByText('This is a memo')).toBeInTheDocument();
  });
});

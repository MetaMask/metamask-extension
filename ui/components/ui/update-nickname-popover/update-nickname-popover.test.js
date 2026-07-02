import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import UpdateNicknamePopover from './update-nickname-popover';

const render = (props = {}) => {
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
      {...props}
    />,
    store,
  );
};

describe('UpdateNicknamePopover', () => {
  it('renders UpdateNicknamePopover component and shows This is a memo text', () => {
    render();
    expect(screen.getByText('This is a memo')).toBeInTheDocument();
  });

  it('disables the save button when the nickname is empty', () => {
    const { baseElement } = render({ nickname: '' });
    expect(baseElement.querySelector('.update-nickname__save')).toBeDisabled();
  });

  it('enables the save button when a nickname is present', () => {
    const { baseElement } = render({ nickname: 'user_nickname' });
    expect(baseElement.querySelector('.update-nickname__save')).toBeEnabled();
  });
});

import { screen } from '@testing-library/react';
import React from 'react';

import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import NicknamePopover from './nickname-popover.component';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('NicknamePopover', () => {
  it('renders NicknamePopover component and shows Add a nickname text', () => {
    renderWithProvider(
      <NicknamePopover address="0x5e6DaAD1BE117e26590F9eEcD509336ABFBe5966" />,
      store,
    );

    expect(screen.getByText('Add a nickname')).toBeInTheDocument();
  });

  it('renders NicknamePopover component and shows Edit nickname text', () => {
    renderWithProvider(
      <NicknamePopover
        address="0x5e6DaAD1BE117e26590F9eEcD509336ABFBe5966"
        nickname="John Doe"
      />,
      store,
    );

    expect(screen.getByText('Edit nickname')).toBeInTheDocument();
  });
});

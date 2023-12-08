import React from 'react';
import { Meta } from '@storybook/react';
import SnapCard from './snap-card';

export default {
  title: 'Components/UI/SnapCard',
} as Meta<typeof SnapCard>;

export const DefaultStory = () => (
  <SnapCard
    id="a51ea3a8-f1b0-4613-9440-b80e2236713b"
    iconUrl=""
    snapTitle="Metamask Simple Keyring"
    snapSlug="Secure your account with MetaMask Mobile"
    isInstalled={false}
    website="https://www.consensys.net/"
    onClickFunc={() => null}
    updateAvailable={false}
  />
);

DefaultStory.storyName = 'Default';

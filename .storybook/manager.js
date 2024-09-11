import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';

addons.setConfig({
  theme: create({
    base: 'both',
    brandTitle: 'MetaMask Storybook',
    brandUrl: 'https://metamask.io/',
    // brandImage: 'https://placehold.it/350x150',
  }),
});

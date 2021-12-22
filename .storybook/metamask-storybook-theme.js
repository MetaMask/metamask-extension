// .storybook/YourTheme.js

import { create } from '@storybook/theming';
import logo from '../app/images/logo/metamask-logo-horizontal.svg';

export default create({
  base: 'light',
  brandTitle: 'MetaMask Storybook',
  brandImage: logo,

  // Typography
  fontBase: 'Euclid, Roboto, Helvetica, Arial, sans-serif',
  fontCode: 'Inconsolata, monospace',
});

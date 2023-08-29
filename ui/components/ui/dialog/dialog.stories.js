import React from 'react';
import { BannerAlert } from '../../component-library';
import { Severity } from '../../../helpers/constants/design-system';
import README from './README.mdx';
import Dialog from '.';

export default {
  title: 'Components/UI/Dialog',

  component: Dialog,
  parameters: {
    docs: {
      page: README,
    },
  },
  argsTypes: {
    children: {
      control: 'text',
    },
    type: { control: 'text' },
  },
};

export const DefaultDialog = (args) => (
  <>
    <BannerAlert
      severity={Severity.Warning}
      title="Deprecated"
      description="The <Dialog> component has been deprecated in favor of the new <BannerAlert> component from the component-library.
      If you would like to help with the replacement of the old Dialog component, please submit a pull request to metamask-extension"
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/20463',
      }}
      marginBottom={4}
    />
    <Dialog {...args} />
  </>
);

DefaultDialog.storyName = 'Default';
DefaultDialog.args = {
  type: 'error',
  children: 'Dialog Box',
};

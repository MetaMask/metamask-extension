import React from 'react';
import { BannerAlert } from '../../../../../../components/component-library';
import { Severity } from '../../../../../../helpers/constants/design-system';
import ConfirmPageContainerWarning from '.';

export default {
  title: 'Components/UI/ConfirmPageContainerWarning(Deprecated)', // title should follow the folder structure location of the component. Don't use spaces.

  argTypes: {
    warning: {
      control: 'text',
    },
  },
  args: {
    warning: 'This is a warning',
  },
};

export const DefaultStory = (args) => (
  <>
    <BannerAlert
      severity={Severity.Warning}
      title="Deprecated"
      description="The <ConfirmPageContainerWarning> component has been deprecated in favor of the new <BannerAlert> component from the component-library.
      If you would like to help with the replacement of the old ConfirmPageContainerWarning component, please submit a pull request to metamask-extension"
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/20466',
      }}
      marginBottom={4}
    />
    <ConfirmPageContainerWarning {...args} />
  </>
);

DefaultStory.storyName = 'Default';

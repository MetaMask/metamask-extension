import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';
import { ButtonPrimary } from '../../component-library';
import { ConnectedSitePermissionsModal } from '.';

export default {
  title: 'Components/Multichain/ConnectedSitePermissionsModal',
  component: ConnectedSitePermissionsModal,
  argTypes: {
    onClose: {
      control: 'function',
    },
  },
} as Meta<typeof ConnectedSitePermissionsModal>;

export const DefaultStory: StoryFn<
  typeof ConnectedSitePermissionsModal
> = () => {
  const [{ showModal }, updateArgs] = useArgs();

  return (
    <>
      <ButtonPrimary onClick={() => updateArgs({ showModal: true })}>
        Open modal
      </ButtonPrimary>
      {showModal && (
        <ConnectedSitePermissionsModal
          onClose={() => updateArgs({ showModal: false })}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';

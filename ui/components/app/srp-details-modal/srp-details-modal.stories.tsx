import React from 'react';
import { useArgs } from '@storybook/client-api';
import { Button } from '../../component-library';
import SRPDetailsModal from './srp-details-modal';

export default {
  title: 'Components/App/SrpDetailsModal',
  component: SRPDetailsModal,
  argTypes: {
    isShowingModal: {
      control: 'boolean',
      defaultValue: true,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: true },
      },
    },
  },
};

export const DefaultStory = () => {
  const [{ isShowingModal }, updateArgs] = useArgs();

  return (
    <>
      <Button onClick={() => updateArgs({ isShowingModal: true })}>
        Open modal
      </Button>
      {isShowingModal && (
        <SRPDetailsModal
          onClose={() => updateArgs({ isShowingModal: false })}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';

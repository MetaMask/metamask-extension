import React from 'react';
import { useArgs } from '@storybook/client-api';
import { Button } from '../../component-library';
import DownloadMobileModal from './download-mobile-modal';

export default {
  title: 'Components/App/DownloadMobileModal',
  component: DownloadMobileModal,
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
        <DownloadMobileModal
          onClose={() => updateArgs({ isShowingModal: false })}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';

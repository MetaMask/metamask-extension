import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';
import { ButtonVariant, Button } from '../../../components/component-library';
import SmartTransactionPopover from './smart-transactions-popover';

export default {
  title: 'Pages/Swaps/SmartTransactionsPopover',
  component: SmartTransactionPopover,
  argTypes: {
    isShowingModal: {
      control: 'boolean',
    },
  },
} as Meta<typeof SmartTransactionPopover>;

export const DefaultStory: StoryFn<typeof SmartTransactionPopover> = () => {
  const [{ isShowingModal }, updateArgs] = useArgs();
  const toggleModal = () => updateArgs({ isShowingModal: !isShowingModal });

  return (
    <>
      <Button variant={ButtonVariant.Primary} onClick={toggleModal}>
        Open modal
      </Button>
      {isShowingModal && (
        <SmartTransactionPopover
          isOpen={isShowingModal}
          onStartSwapping={() => {
            console.log('onStartSwapping');
          }}
          onManageStxInSettings={toggleModal}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';

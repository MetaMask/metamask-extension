import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';

import { BUTTON_VARIANT, Button } from '../../../components/component-library';
import { SLIPPAGE_HIGH_ERROR } from '../../../../shared/constants/swaps';
import SlippageNotificationModal from './slippage-notification-modal';

export default {
  title: 'Pages/Swaps/SlippageNotificationModal',
  component: SlippageNotificationModal,
  argTypes: {
    isShowingModal: {
      control: 'boolean',
    },
  },
} as Meta<typeof SlippageNotificationModal>;

export const DefaultStory: StoryFn<typeof SlippageNotificationModal> = () => {
  const [{ isShowingModal }, updateArgs] = useArgs();
  const toggleModal = () => updateArgs({ isShowingModal: !isShowingModal });

  return (
    <>
      <Button variant={BUTTON_VARIANT.PRIMARY} onClick={toggleModal}>
        Open modal
      </Button>
      {isShowingModal && (
        <SlippageNotificationModal
          isOpen={isShowingModal}
          slippageErrorKey={SLIPPAGE_HIGH_ERROR}
          onSwapSubmit={() => {
            console.log('onSwapSubmit');
          }}
          currentSlippage={10}
          setSlippageNotificationModalOpened={toggleModal}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';

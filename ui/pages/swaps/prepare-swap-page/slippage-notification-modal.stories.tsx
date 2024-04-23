import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';

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
  const [isShowingModal, setIsShowingModal] = useState(false);
  const toggleModal = () => setIsShowingModal(!isShowingModal);

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

import { useArgs } from '@storybook/client-api';
import { StoryFn } from '@storybook/react';
import React from 'react';
import { BUTTON_VARIANT, Button } from '../../../components/component-library';
import AddSnapAccountModal from '.';

const AddSnapAccountModalStory = {
  title: 'Components/App/AddSnapAccountModal',
  component: AddSnapAccountModal,
  argTypes: {},
};

export const DefaultStory: StoryFn<typeof AddSnapAccountModal> = () => {
  const [{ isShowingModal }, updateArgs] = useArgs();

  return (
    <>
      <Button
        variant={BUTTON_VARIANT.PRIMARY}
        onClick={() => updateArgs({ isShowingModal: true })}
      >
        Open modal
      </Button>
      {isShowingModal && (
        <AddSnapAccountModal
          isOpen={isShowingModal}
          onClose={() => updateArgs({ isShowingModal: false })}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';

export default AddSnapAccountModalStory;

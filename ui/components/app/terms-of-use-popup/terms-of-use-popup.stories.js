import React from 'react';
import { useArgs } from '@storybook/client-api';
import { Button } from '../../component-library';
import TermsOfUsePopup from '.';

export default {
  title: 'Components/App/TermsOfUsePopup',
  component: TermsOfUsePopup,
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
        <TermsOfUsePopup
          isOpen={isShowingModal}
          onClose={() => updateArgs({ isShowingModal: false })}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';

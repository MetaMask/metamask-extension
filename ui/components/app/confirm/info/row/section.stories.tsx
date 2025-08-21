import React from 'react';
import { ConfirmInfoSection } from './section';
import { ConfirmInfoRow } from './row';
import { ConfirmInfoRowText } from './text';

const ConfirmInfoSectionStory = {
  title: 'Components/App/Confirm/Info/Row/Section',
  component: ConfirmInfoSection,

  decorators: [
    (story) => (
      <div
        style={{
          backgroundColor: 'var(--color-background-alternative)',
          padding: 30,
        }}
      >
        {story()}
      </div>
    ),
  ],

  argTypes: {
    noPadding: {
      control: 'boolean',
    },
  },
};

export const DefaultStory = (args) => (
  <>
    <ConfirmInfoSection {...args}>
      <ConfirmInfoRow label="Test Label 1">
        <ConfirmInfoRowText text="Test Value 1"></ConfirmInfoRowText>
      </ConfirmInfoRow>
      <ConfirmInfoRow label="Test Label 2">
        <ConfirmInfoRowText text="Test Value 2"></ConfirmInfoRowText>
      </ConfirmInfoRow>
    </ConfirmInfoSection>
    <ConfirmInfoSection {...args}>
      <ConfirmInfoRow label="Test Label 3">
        <ConfirmInfoRowText text="Test Value 3"></ConfirmInfoRowText>
      </ConfirmInfoRow>
      <ConfirmInfoRow label="Test Label 4">
        <ConfirmInfoRowText text="Test Value 4"></ConfirmInfoRowText>
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  </>
);

DefaultStory.args = {
  noPadding: false,
};

export default ConfirmInfoSectionStory;

import React from 'react';
import { ConfirmInfoExpandableRow } from './expandable-row';
import { ConfirmInfoRowText } from './text';
import { ConfirmInfoRow } from './row';
import { ConfirmInfoSection } from './section';

export default {
  title: 'Components/App/Confirm/Info/Row/ExpandableRow',
  component: ConfirmInfoExpandableRow,
  decorators: [
    (story) => (
      <div
        style={{
          backgroundColor: 'var(--color-background-alternative)',
          padding: 30,
        }}
      >
        <ConfirmInfoSection>{story()}</ConfirmInfoSection>
      </div>
    ),
  ],
};

export const DefaultStory = () => (
  <ConfirmInfoExpandableRow
    label="Expandable Row"
    content={
      <>
        <ConfirmInfoRow label="Hidden Row 1">
          <ConfirmInfoRowText text="Hidden Value 1" />
        </ConfirmInfoRow>
        <ConfirmInfoRow label="Hidden Row 2">
          <ConfirmInfoRowText text="Hidden Value 2" />
        </ConfirmInfoRow>
      </>
    }
  >
    <ConfirmInfoRowText text="Expandable Value" />
  </ConfirmInfoExpandableRow>
);

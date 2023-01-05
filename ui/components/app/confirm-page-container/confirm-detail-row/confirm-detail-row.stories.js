import React from 'react';
import ConfirmDetailRow from '.';

export default {
  title: 'Components/App/ConfirmPageContainer/ConfirmDetailRow',

  argTypes: {
    headerText: {
      control: 'text',
    },
    headerTextClassName: {
      control: 'text',
    },
    label: {
      control: 'text',
    },
    onHeaderClick: {
      control: 'text',
    },
    primaryValueTextColor: {
      control: 'text',
    },
    primaryText: {
      control: 'text',
    },
    secondaryText: {
      control: 'text',
    },
    value: {
      control: 'text',
    },
  },
  args: {
    headerText: 'headerText',
    headerTextClassName: 'headerTextClassName',
    label: 'label',
    onHeaderClick: 'onHeaderClick',
    primaryValueTextColor: 'primaryValueTextColor',
    primaryText: 'primaryText',
    secondaryText: 'secondaryText',
    value: 'value',
  },
};

export const DefaultStory = (args) => <ConfirmDetailRow {...args} />;

DefaultStory.storyName = 'Default';

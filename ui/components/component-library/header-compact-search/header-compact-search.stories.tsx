import React, { useState, useEffect } from 'react';
import type { StoryFn, Meta } from '@storybook/react';
import { HeaderCompactSearch } from './header-compact-search';
import { HeaderCompactSearchVariant } from './header-compact-search.types';

export default {
  title: 'Components/ComponentLibrary/HeaderCompactSearch',
  component: HeaderCompactSearch,
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(HeaderCompactSearchVariant),
    },
    onClickBackButton: { action: 'onClickBackButton' },
    onClickCancelButton: { action: 'onClickCancelButton' },
  },
  args: {
    variant: HeaderCompactSearchVariant.Screen,
    onClickBackButton: () => {},
    textFieldSearchProps: {
      value: '',
      placeholder: 'Search',
    },
  },
} as Meta<typeof HeaderCompactSearch>;

const Template: StoryFn<typeof HeaderCompactSearch> = (args) => {
  const initialValue = (args.textFieldSearchProps?.value as string) ?? '';
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChangeText = (text: string) => {
    setValue(text);
  };
  const handleClickClearButton = () => {
    setValue('');
  };

  const searchProps = {
    ...args.textFieldSearchProps,
    value,
    onChangeText: handleChangeText,
    onClickClearButton: handleClickClearButton,
  };

  return <HeaderCompactSearch {...args} textFieldSearchProps={searchProps} />;
};

export const Screen: StoryFn<typeof HeaderCompactSearch> = Template.bind({});
Screen.args = {
  variant: HeaderCompactSearchVariant.Screen,
  onClickBackButton: () => {},
  textFieldSearchProps: {
    value: '',
    placeholder: 'Search',
  },
};

export const Inline: StoryFn<typeof HeaderCompactSearch> = Template.bind({});
Inline.args = {
  variant: HeaderCompactSearchVariant.Inline,
  onClickCancelButton: () => {},
  textFieldSearchProps: {
    value: '',
    placeholder: 'Search',
  },
};

export const ScreenWithValue: StoryFn<typeof HeaderCompactSearch> =
  Template.bind({});
ScreenWithValue.args = {
  variant: HeaderCompactSearchVariant.Screen,
  onClickBackButton: () => {},
  textFieldSearchProps: {
    value: 'Search query',
    placeholder: 'Search',
  },
};

export const InlineWithValue: StoryFn<typeof HeaderCompactSearch> =
  Template.bind({});
InlineWithValue.args = {
  variant: HeaderCompactSearchVariant.Inline,
  onClickCancelButton: () => {},
  textFieldSearchProps: {
    value: 'Search query',
    placeholder: 'Search',
  },
};

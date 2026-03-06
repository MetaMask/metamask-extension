import React, { useState, useEffect } from 'react';
import type { StoryFn, Meta } from '@storybook/react';
import { HeaderSearch } from './header-search';
import { HeaderSearchVariant } from './header-search.types';

export default {
  title: 'Components/ComponentLibrary/HeaderSearch',
  component: HeaderSearch,
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(HeaderSearchVariant),
    },
    onClickBackButton: { action: 'onClickBackButton' },
    onClickCancelButton: { action: 'onClickCancelButton' },
  },
  args: {
    variant: HeaderSearchVariant.Screen,
    onClickBackButton: () => {},
    textFieldSearchProps: {
      value: '',
      placeholder: 'Search',
    },
  },
} as Meta<typeof HeaderSearch>;

const Template: StoryFn<typeof HeaderSearch> = (args) => {
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

  return <HeaderSearch {...args} textFieldSearchProps={searchProps} />;
};

export const Screen: StoryFn<typeof HeaderSearch> = Template.bind({});
Screen.args = {
  variant: HeaderSearchVariant.Screen,
  onClickBackButton: () => {},
  textFieldSearchProps: {
    value: '',
    placeholder: 'Search',
  },
};

export const Inline: StoryFn<typeof HeaderSearch> = Template.bind({});
Inline.args = {
  variant: HeaderSearchVariant.Inline,
  onClickCancelButton: () => {},
  textFieldSearchProps: {
    value: '',
    placeholder: 'Search',
  },
};

export const ScreenWithValue: StoryFn<typeof HeaderSearch> = Template.bind({});
ScreenWithValue.args = {
  variant: HeaderSearchVariant.Screen,
  onClickBackButton: () => {},
  textFieldSearchProps: {
    value: 'Search query',
    placeholder: 'Search',
  },
};

export const InlineWithValue: StoryFn<typeof HeaderSearch> = Template.bind({});
InlineWithValue.args = {
  variant: HeaderSearchVariant.Inline,
  onClickCancelButton: () => {},
  textFieldSearchProps: {
    value: 'Search query',
    placeholder: 'Search',
  },
};

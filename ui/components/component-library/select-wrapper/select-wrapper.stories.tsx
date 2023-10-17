import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { SelectButton } from '../select-button';
import { SelectOption } from '../select-option';
import { Button } from '../button';
import { Text } from '../text';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import README from './README.mdx';

import { SelectWrapper, useSelectContext } from '.';

export default {
  title: 'Components/ComponentLibrary/SelectWrapper',
  component: SelectWrapper,
  parameters: {
    docs: {
      page: README,
      story: {
        inline: false,
      },
    },
  },
  argTypes: {},
} as Meta<typeof SelectWrapper>;

const Template: StoryFn<typeof SelectWrapper> = (args) => {
  return (
    <SelectWrapper {...args}>
      <SelectOption value="Option 1">Option 1</SelectOption>
      <SelectOption value="Option 2">Option 2</SelectOption>
      <SelectOption value="Option 3">Option 3</SelectOption>
    </SelectWrapper>
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  placeholder: 'Select an option',
  triggerComponent: <SelectButton />,
};

export const TriggerComponent: StoryFn<typeof SelectWrapper> = (args) => {
  return (
    <>
      <SelectWrapper
        {...args}
        triggerComponent={<SelectButton>Trigger Component</SelectButton>}
      >
        <SelectOption value="Value">Value</SelectOption>
      </SelectWrapper>
    </>
  );
};

TriggerComponent.storyName = 'triggerComponent';

export const Children: StoryFn<typeof SelectWrapper> = (args) => {
  return (
    <>
      <SelectWrapper
        {...args}
        triggerComponent={<SelectButton>Trigger Component</SelectButton>}
      >
        <Text paddingLeft={2} paddingRight={2}>
          All elements contained in SelectWrapper will be rendered within the
          popover
        </Text>
        <SelectOption value="Child 1">Child 1</SelectOption>
        <SelectOption value="Child 2">Child 2</SelectOption>
        <SelectOption value="Child 3">Child 3</SelectOption>
      </SelectWrapper>
    </>
  );
};

export const ControlledOpen: StoryFn<typeof SelectWrapper> = (args) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Text>
        This demo is using props <strong>isOpen</strong> and{' '}
        <strong>onOpenChange</strong>
      </Text>
      <SelectWrapper
        placeholder="Controlled Open Demo"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        {...args}
        triggerComponent={
          <SelectButton onClick={() => setIsOpen(!isOpen)}>
            Controlled Open Demo
          </SelectButton>
        }
      >
        <SelectOption value="Option 1">Option 1</SelectOption>
        <SelectOption value="Option 2">Option 2</SelectOption>
        <SelectOption value="Option 3">Option 3</SelectOption>
      </SelectWrapper>
    </>
  );
};

export const UncontrolledOpen: StoryFn<typeof SelectWrapper> = (args) => {
  return (
    <>
      <SelectWrapper
        {...args}
        placeholder="Uncontrolled Open Demo"
        triggerComponent={<SelectButton>Uncontrolled Open Demo</SelectButton>}
      >
        <SelectOption value="Option 1">Option 1</SelectOption>
        <SelectOption value="Option 2">Option 2</SelectOption>
        <SelectOption value="Option 3">Option 3</SelectOption>
      </SelectWrapper>
    </>
  );
};

export const ControlledValue: StoryFn<typeof SelectWrapper> = (args) => {
  const [controlledValue, setControlledValue] = React.useState<string>();

  return (
    <>
      <Text>
        This demo is using props <strong>defaultValue</strong>,{' '}
        <strong>value</strong>, and <strong>onValueChange</strong>
      </Text>
      <SelectWrapper
        {...args}
        defaultValue={'DefaultValue'}
        value={controlledValue}
        onValueChange={(value) => setControlledValue(value)}
        triggerComponent={<SelectButton>Controlled </SelectButton>}
      >
        <SelectOption value="Option 1">Option 1</SelectOption>
        <SelectOption value="Option 2">Option 2</SelectOption>
        <SelectOption value="Option 3">Option 3</SelectOption>
      </SelectWrapper>
    </>
  );
};

export const UncontrolledValue: StoryFn<typeof SelectWrapper> = (args) => {
  return (
    <>
      <SelectWrapper
        {...args}
        triggerComponent={<SelectButton>Uncontrolled Example</SelectButton>}
      >
        <SelectOption value="Option 1">Option 1</SelectOption>
        <SelectOption value="Option 2">Option 2</SelectOption>
        <SelectOption value="Option 3">Option 3</SelectOption>
      </SelectWrapper>
    </>
  );
};

export const UseSelectContext: StoryFn<typeof SelectWrapper> = (args) => {
  // Note thaty the SelectContext is being used inside a component, because the SelectContext needs to be called within the SelectWrapper component and not before
  const CustomClose = () => {
    const { toggleUncontrolledOpen } = useSelectContext();

    return (
      <>
        <Text>Custom close button using SelectContext</Text>
        <Button block onClick={toggleUncontrolledOpen}>
          Close
        </Button>
      </>
    );
  };

  return (
    <>
      <SelectWrapper
        {...args}
        triggerComponent={<SelectButton>Uncontrolled Example</SelectButton>}
      >
        <CustomClose />
        <SelectOption value="Option 1">Option 1</SelectOption>
        <SelectOption value="Option 2">Option 2</SelectOption>
        <SelectOption value="Option 3">Option 3</SelectOption>
      </SelectWrapper>
    </>
  );
};

UseSelectContext.storyName = 'useSelectContext';

export const IsMultiSelect: StoryFn<typeof SelectWrapper> = (args) => {
  return (
    <>
      <Text>
        When <strong>isMultiSelect</strong> prop is <i>true</i> the popover will
        remain open after a selection is made
      </Text>
      <SelectWrapper
        {...args}
        triggerComponent={<SelectButton>Demo</SelectButton>}
      >
        <SelectOption value="Option 1">Option 1</SelectOption>
        <SelectOption value="Option 2">Option 2</SelectOption>
        <SelectOption value="Option 3">Option 3</SelectOption>
      </SelectWrapper>
    </>
  );
};

IsMultiSelect.args = {
  placeholder: 'Select Option',
  isMultiSelect: true,
};

IsMultiSelect.storyName = 'isMultiSelect';

export const Placeholder: StoryFn<typeof SelectWrapper> = (args) => {
  return (
    <SelectWrapper
      placeholder={'This is a placeholder'}
      {...args}
      triggerComponent={<SelectButton>Demo</SelectButton>}
    >
      <SelectOption value="Option 1">Option 1</SelectOption>
      <SelectOption value="Option 2">Option 2</SelectOption>
      <SelectOption value="Option 3">Option 3</SelectOption>
    </SelectWrapper>
  );
};

export const IsDisabled: StoryFn<typeof SelectWrapper> = (args) => {
  return (
    <SelectWrapper
      {...args}
      triggerComponent={<SelectButton>Demo</SelectButton>}
    >
      <SelectOption value="Option 1">Option 1</SelectOption>
      <SelectOption value="Option 2">Option 2</SelectOption>
      <SelectOption value="Option 3">Option 3</SelectOption>
    </SelectWrapper>
  );
};

IsDisabled.args = {
  placeholder: 'Select Option',
  isDisabled: true,
};

IsDisabled.storyName = 'isDisabled';

export const IsDanger: StoryFn<typeof SelectWrapper> = (args) => {
  return (
    <SelectWrapper
      {...args}
      triggerComponent={<SelectButton>Demo</SelectButton>}
    >
      <SelectOption value="Option 1">Option 1</SelectOption>
      <SelectOption value="Option 2">Option 2</SelectOption>
      <SelectOption value="Option 3">Option 3</SelectOption>
    </SelectWrapper>
  );
};

IsDanger.args = {
  placeholder: 'Select Option',
  isDanger: true,
};

IsDanger.storyName = 'isDanger';

export const PopoverProps: StoryFn<typeof SelectWrapper> = (args) => {
  return (
    <SelectWrapper
      {...args}
      triggerComponent={<SelectButton>Demo</SelectButton>}
    >
      <SelectOption value="Option 1">Option 1</SelectOption>
      <SelectOption value="Option 2">Option 2</SelectOption>
      <SelectOption value="Option 3">Option 3</SelectOption>
    </SelectWrapper>
  );
};

PopoverProps.args = {
  placeholder: 'Select Option',
  popoverProps: {
    backgroundColor: BackgroundColor.goerli,
    padding: 4,
    isPortal: false,
  },
};

PopoverProps.storyName = 'popoverProps';

export const OnBlur: StoryFn<typeof SelectWrapper> = (args) => {
  const [onBlur, setOnBlur] = React.useState(0);
  return (
    <>
      <SelectWrapper
        {...args}
        onBlur={() => setOnBlur(onBlur + 1)}
        triggerComponent={<SelectButton>onBlur Count: {onBlur}</SelectButton>}
      >
        <Text>This is a demo of controlled onBlur.</Text>
      </SelectWrapper>
    </>
  );
};

OnBlur.storyName = 'onBlur';

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
  argTypes: {
    className: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    placeholder: {
      control: 'text',
    },
    value: {
      control: 'text',
    },
    defaultValue: {
      control: 'text',
    },
    onValueChange: {
      action: 'onValueChange',
    },
    isOpen: {
      control: 'boolean',
    },
    isDisabled: {
      control: 'boolean',
    },
    isDanger: {
      control: 'boolean',
    },
    onOpenChange: {
      action: 'onOpenChange',
    },
    onBlur: {
      action: 'onBlur',
    },
    triggerComponent: {
      control: 'node',
    },
    popoverProps: {
      control: 'object',
    },
  },
  args: {
    placeholder: 'Select an option',
    triggerComponent: <SelectButton>Select an option</SelectButton>,
  },
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

export const TriggerComponent = Template.bind({});
TriggerComponent.args = {
  placeholder: '',
  triggerComponent: <SelectButton>Trigger component</SelectButton>,
};

export const Children: StoryFn<typeof SelectWrapper> = (args) => {
  return (
    <>
      <SelectWrapper {...args}>
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
Children.args = {
  placeholder: 'Children demo',
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
        {...args}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        triggerComponent={
          <SelectButton onClick={() => setIsOpen(!isOpen)}>
            Select an option
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
ControlledOpen.args = {
  placeholder: 'Controlled open demo',
};

export const UncontrolledOpen = Template.bind({});
UncontrolledOpen.args = {
  placeholder: 'Uncontrolled open demo',
};

export const ControlledValue: StoryFn<typeof SelectWrapper> = (args) => {
  const [controlledValue, setControlledValue] = React.useState<string>('');

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
      >
        <SelectOption value="Option 1">Option 1</SelectOption>
        <SelectOption value="Option 2">Option 2</SelectOption>
        <SelectOption value="Option 3">Option 3</SelectOption>
      </SelectWrapper>
    </>
  );
};

export const UncontrolledValue = Template.bind({});
UncontrolledValue.args = {
  placeholder: 'Uncontrolled value demo',
};

export const UseSelectContext: StoryFn<typeof SelectWrapper> = (args) => {
  // Note that the SelectContext is being used inside a component, because the SelectContext needs to be called within the SelectWrapper component and not before
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
      <SelectWrapper {...args}>
        <CustomClose />
        <SelectOption value="Option 1">Option 1</SelectOption>
        <SelectOption value="Option 2">Option 2</SelectOption>
        <SelectOption value="Option 3">Option 3</SelectOption>
      </SelectWrapper>
    </>
  );
};
UseSelectContext.args = {
  placeholder: 'useSelectContext demo',
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
  placeholder: 'isMultiSelect demo',
  isMultiSelect: true,
};
IsMultiSelect.storyName = 'isMultiSelect';

export const Placeholder = Template.bind({});
Placeholder.args = {
  placeholder: 'Placeholder demo',
};

export const IsDisabled = Template.bind({});
IsDisabled.args = {
  placeholder: 'isDisabled demo',
  isDisabled: true,
};
IsDisabled.storyName = 'isDisabled';

export const IsDanger = Template.bind({});
IsDanger.args = {
  placeholder: 'isDanger demo',
  isDanger: true,
};
IsDanger.storyName = 'isDanger';

export const PopoverProps = Template.bind({});
PopoverProps.args = {
  placeholder: 'popoverProps demo',
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
        triggerComponent={<SelectButton>onBlur count: {onBlur}</SelectButton>}
      >
        <Text>This is a demo of controlled onBlur.</Text>
      </SelectWrapper>
    </>
  );
};
OnBlur.args = {
  placeholder: '',
};
OnBlur.storyName = 'onBlur';

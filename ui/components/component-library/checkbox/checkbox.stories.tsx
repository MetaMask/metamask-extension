import { StoryFn, Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';
import React from 'react';

import { Box } from '..';
import {
  BorderColor,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import README from './README.mdx';

import { Checkbox } from '.';

export default {
  title: 'Components/ComponentLibrary/Checkbox',
  component: Checkbox,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    label: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    id: {
      control: 'text',
    },
  },
} as Meta<typeof Checkbox>;

const Template: StoryFn<typeof Checkbox> = (args) => {
  const [{ isChecked }, updateArgs] = useArgs();
  return (
    <Checkbox
      {...args}
      onChange={() =>
        updateArgs({
          isChecked: !isChecked,
        })
      }
      isChecked={isChecked}
    />
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Label = Template.bind({});
Label.args = {
  label: 'Checkbox label',
};

export const Id = Template.bind({});
Id.args = {
  label: 'Id demo',
  id: 'id-demo',
};

export const IsChecked = Template.bind({});
IsChecked.args = {
  isChecked: true,
  label: 'isChecked demo',
};

export const IsIndeterminate = (args) => {
  const [checkedItems, setCheckedItems] = React.useState([false, true, false]);

  const allChecked = checkedItems.every(Boolean);
  const isIndeterminate = checkedItems.some(Boolean) && !allChecked;

  const handleIndeterminateChange = () => {
    if (allChecked || isIndeterminate) {
      setCheckedItems([false, false, false]);
    } else {
      setCheckedItems([true, true, true]);
    }
  };

  const handleCheckboxChange = (index, value) => {
    const newCheckedItems = [...checkedItems];
    newCheckedItems[index] = value;
    setCheckedItems(newCheckedItems);
  };

  return (
    <div>
      <Checkbox
        {...args}
        isChecked={allChecked}
        isIndeterminate={isIndeterminate}
        onChange={handleIndeterminateChange}
        marginBottom={2}
      />
      <Box
        marginLeft={2}
        gap={1}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
      >
        <Checkbox
          isChecked={checkedItems[0]}
          onChange={(e) => handleCheckboxChange(0, e.target.checked)}
          label="Checkbox 1"
        />
        <Checkbox
          isChecked={checkedItems[1]}
          onChange={(e) => handleCheckboxChange(1, e.target.checked)}
          label="Checkbox 2"
        />
        <Checkbox
          isChecked={checkedItems[2]}
          onChange={(e) => handleCheckboxChange(2, e.target.checked)}
          label="Checkbox 3"
        />
      </Box>
    </div>
  );
};

IsIndeterminate.args = {
  label: 'isIndeterminate demo',
  isIndeterminate: true,
};

export const IsDisabled = Template.bind({});

IsDisabled.args = {
  isDisabled: true,
  label: 'isDisabled demo',
};

export const IsReadOnly = Template.bind({});

IsReadOnly.args = {
  isReadOnly: true,
  isChecked: true,
  label: 'isReadOnly demo',
};

export const OnChange = Template.bind({});
OnChange.args = {
  label: 'onChange demo',
};

export const IsRequired = Template.bind({});

IsRequired.args = {
  isRequired: true,
  isChecked: true,
  label: 'isRequired demo',
};

export const Title = Template.bind({});

Title.args = {
  title: 'Apples',
  label: 'Inspect to see title attribute',
};

export const Name = Template.bind({});

Name.args = {
  name: 'pineapple',
  label: 'Inspect to see name attribute',
};

export const InputProps = Template.bind({});
InputProps.args = {
  inputProps: { borderColor: BorderColor.errorDefault },
  label: 'inputProps demo',
};

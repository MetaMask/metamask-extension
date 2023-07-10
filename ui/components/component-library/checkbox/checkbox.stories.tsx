import { StoryFn, Meta } from '@storybook/react';
import React from 'react';

import { Box } from '..';
import {
  FontWeight,
  TextColor,
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
  argTypes: {},
  args: {},
} as Meta<typeof Checkbox>;

const Template: StoryFn<typeof Checkbox> = (args) => {
  const [isChecked, setIsChecked] = React.useState(false);

  return (
    <Checkbox
      {...args}
      onChange={() => setIsChecked(!isChecked)}
      isChecked={isChecked}
    />
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Label = (args) => {
  const [isChecked, setIsChecked] = React.useState(false);

  return (
    <Checkbox
      {...args}
      label="Checkbox Label"
      onChange={() => setIsChecked(!isChecked)}
      isChecked={isChecked}
      href="https://www.mattermost.com"
    />
  );
};

export const TextProps = (args) => {
  const [isChecked, setIsChecked] = React.useState(false);

  return (
    <Checkbox
      {...args}
      label="Checkbox Label with textProps"
      textProps={{ color: TextColor.errorDefault, fontWeight: FontWeight.Bold }}
      onChange={() => setIsChecked(!isChecked)}
      isChecked={isChecked}
    />
  );
};

export const IsChecked = (args) => {
  return <Checkbox {...args} label="isChecked Demo" />;
};

IsChecked.args = {
  isChecked: true,
};

export const IsIndeterminate = () => {
  const [isTopCheckboxChecked, setTopCheckboxChecked] = React.useState<
    boolean | 'indeterminate'
  >('indeterminate');
  const [checkboxes, setCheckboxes] = React.useState<boolean[]>([
    false,
    true,
    false,
  ]);

  const handleTopCheckboxChange = () => {
    if (isTopCheckboxChecked === true) {
      setTopCheckboxChecked(false);
      setCheckboxes([false, false, false]);
    } else {
      setTopCheckboxChecked(false);
      setCheckboxes([false, false, false]);
    }
  };

  const handleCheckboxChange = (index: number) => {
    const newCheckboxes = [...checkboxes];
    newCheckboxes[index] = !newCheckboxes[index];
    setCheckboxes(newCheckboxes);

    if (newCheckboxes.every((checkbox) => checkbox === true)) {
      setTopCheckboxChecked(true);
    } else if (newCheckboxes.every((checkbox) => checkbox === false)) {
      setTopCheckboxChecked(false);
    } else {
      setTopCheckboxChecked('indeterminate');
    }
  };

  return (
    <div>
      <Checkbox
        label="Demo with isIndeterminate"
        isChecked={isTopCheckboxChecked === true}
        isIndeterminate={isTopCheckboxChecked === 'indeterminate'}
        onChange={() => handleTopCheckboxChange()}
      />
      <Box marginLeft={2}>
        {checkboxes.map((isChecked, index) => (
          <Checkbox
            key={index}
            label={`Checkbox ${index + 1}`}
            isChecked={isChecked}
            onChange={() => handleCheckboxChange(index)}
          />
        ))}
      </Box>
    </div>
  );
};

IsIndeterminate.args = {
  isIndeterminate: true,
};

export const IsDisabled = (args) => {
  return <Checkbox {...args} label="isDisabled Demo" />;
};

IsDisabled.args = {
  isDisabled: true,
};

export const IsReadOnly = (args) => {
  return <Checkbox {...args} label="isReadOnly Demo" />;
};

IsReadOnly.args = {
  isReadOnly: true,
  isChecked: true,
};

export const OnChange = (args) => {
  const [isChecked, setIsChecked] = React.useState(false);
  return (
    <Checkbox
      {...args}
      onChange={() => setIsChecked(!isChecked)}
      isChecked={isChecked}
      label="onChange Demo"
    />
  );
};

export const IsRequired = (args) => {
  return <Checkbox {...args} label="isRequired Demo" />;
};

IsRequired.args = {
  isRequired: true,
  isChecked: true,
};

export const Title = (args) => {
  return <Checkbox {...args} />;
};

Title.args = {
  title: 'Apples',
  label: 'Inspect to see title attribute',
};

export const Name = (args) => {
  return <Checkbox {...args} />;
};

Name.args = {
  name: 'pineapple',
  label: 'Pineapple',
};

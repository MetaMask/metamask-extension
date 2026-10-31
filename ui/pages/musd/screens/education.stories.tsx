import type { Meta, StoryObj } from '@storybook/react-webpack5';
import MusdEducationScreen from './education';

const meta = {
  title: 'Pages/Musd/Education',
  component: MusdEducationScreen,
} satisfies Meta<typeof MusdEducationScreen>;

export default meta;
type Story = StoryObj<typeof MusdEducationScreen>;

export const DefaultStory: Story = {
  name: 'Default',
};

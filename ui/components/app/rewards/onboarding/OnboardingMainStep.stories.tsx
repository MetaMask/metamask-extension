import type { Meta, StoryObj } from '@storybook/react-webpack5';
import OnboardingMainStep from './OnboardingMainStep';

const meta: Meta<typeof OnboardingMainStep> = {
  title: 'Components/App/Rewards/OnboardingMainStep',
  component: OnboardingMainStep,
  args: {
    rewardPoints: 100,
  },
};

export default meta;
type Story = StoryObj<typeof OnboardingMainStep>;

export const DefaultStory: Story = {};
DefaultStory.storyName = 'Default';

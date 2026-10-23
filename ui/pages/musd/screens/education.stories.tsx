import React from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import MusdEducationScreen from './education';

const store = configureStore(mockState);

const meta = {
  title: 'Pages/Musd/Education',
  component: MusdEducationScreen,
} satisfies Meta<typeof MusdEducationScreen>;

export default meta;
type Story = StoryObj<typeof MusdEducationScreen>;

export const DefaultStory: Story = {
  name: 'Default',
};

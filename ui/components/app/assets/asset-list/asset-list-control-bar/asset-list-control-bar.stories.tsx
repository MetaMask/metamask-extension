import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../../../store/store';
import testData from '../../../../../../.storybook/test-data';
import AssetListControlBar from './asset-list-control-bar';

const store = configureStore(testData);

const meta: Meta<typeof AssetListControlBar> = {
  title: 'Components/App/Assets/AssetList/AssetListControlBar',
  component: AssetListControlBar,
  decorators: [(storyFn) => <Provider store={store}>{storyFn()}</Provider>],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
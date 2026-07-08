import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { LEDGER_HD_PATHS } from '../utils/hardware-hd-paths';
import { SelectHdPathPage } from './index';
import type { SelectHdPathPageProps } from './select-hd-path-page.types';

export default {
  title: 'Pages/CreateAccount/ConnectHardware/SelectHdPathPage',
  component: SelectHdPathPage,
  decorators: [
    (Story: StoryFn) => (
      <div style={{ width: '460px', minHeight: '800px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onPathChange: { action: 'onPathChange' },
    onBack: { action: 'onBack' },
  },
  args: {
    hdPaths: LEDGER_HD_PATHS,
    selectedPath: LEDGER_HD_PATHS[0].value,
  },
} as Meta<typeof SelectHdPathPage>;

export const DefaultStory: StoryFn<typeof SelectHdPathPage> = (
  args: SelectHdPathPageProps,
) => <SelectHdPathPage {...args} />;

DefaultStory.storyName = 'Default';

export const LegacySelected: StoryFn<typeof SelectHdPathPage> = (
  args: SelectHdPathPageProps,
) => <SelectHdPathPage {...args} selectedPath={LEDGER_HD_PATHS[1].value} />;

import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  Display,
  FlexDirection,
  BlockSize,
} from '../../../helpers/constants/design-system';

import { Box } from '../box';
import README from './README.mdx';
import { PickerNetwork } from './picker-network';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_IDS,
} from '../../../../shared/constants/network';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import { AvatarType } from '../../multichain/avatar-group/avatar-group.types';

export default {
  title: 'Components/ComponentLibrary/PickerNetwork',
  component: PickerNetwork,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    label: {
      control: 'text',
    },
    src: {
      control: 'text',
    },
  },
  args: {
    label: 'Avalanche C-Chain',
    src: './images/avax-token.svg',
  },
} as Meta<typeof PickerNetwork>;

const Template = (args) => <PickerNetwork {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Label: StoryFn<typeof PickerNetwork> = (args) => (
  <Box
    display={Display.InlineFlex}
    flexDirection={FlexDirection.Column}
    gap={2}
  >
    <PickerNetwork {...args} />
    <PickerNetwork {...args} src="" label="Arbitrum" />
    <PickerNetwork {...args} src="" label="Polygon" />
    <PickerNetwork {...args} src="" label="Optimism" />
    <PickerNetwork
      {...args}
      src=""
      label="BNB Smart Chain (previously Binance Smart Chain Mainnet)"
      style={{ maxWidth: '200px' }}
    />
  </Box>
);

export const Src: StoryFn<typeof PickerNetwork> = (args) => (
  <Box
    display={Display.InlineFlex}
    flexDirection={FlexDirection.Column}
    gap={2}
  >
    <PickerNetwork {...args} label="Arbitrum" src="./images/arbitrum.svg" />
    <PickerNetwork {...args} label="Polygon" src="./images/pol-token.svg" />
    <PickerNetwork {...args} label="Optimism" src="./images/optimism.svg" />
  </Box>
);

export const Width: StoryFn<typeof PickerNetwork> = (args) => (
  <>
    <PickerNetwork marginBottom={2} {...args} />
    <PickerNetwork {...args} width={BlockSize.Full} />
  </>
);

export const AvatarGroupProps: StoryFn<typeof PickerNetwork> = () => (
  <PickerNetwork
    label="Arbitrum"
    src="./images/arbitrum.svg"
    avatarGroupProps={{
      limit: 2,
      members: [
        CHAIN_IDS.MAINNET,
        CHAIN_IDS.POLYGON,
        CHAIN_IDS.AVALANCHE,
        CHAIN_IDS.BASE,
      ].map((c) => ({
        avatarValue:
          CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
            c as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
          ],
        symbol:
          NETWORK_TO_SHORT_NETWORK_NAME_MAP[
            c as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
          ],
      })),
      avatarType: AvatarType.NETWORK,
    }}
  />
);

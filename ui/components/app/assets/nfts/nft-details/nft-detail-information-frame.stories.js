import React from 'react';
import {
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { ButtonIcon, IconName, IconSize } from '../../../../component-library';
import NftDetailInformationFrame from './nft-detail-information-frame';

export default {
  title: 'Components/App/Assets/Nfts/NftDetails/NftDetailInformationFrame',

  argTypes: {
    nft: {
      control: 'object',
    },
  },
  args: {
    title: 'Bought for',
    value: '$500',
    frameClassname: 'nft-details__nft-frame',
    frameTextTitleProps: {
      textAlign: TextAlign.Center,
      color: TextColor.textAlternative,
      variant: TextVariant.bodyMdMedium,
    },
    frameTextTitleStyle: {
      fontSize: '10px',
      lineHeight: '16px',
    },
    frameTextValueProps: {
      color: TextColor.textDefault,
      variant: TextVariant.headingSm,
    },
    frameTextValueStyle: {
      fontSize: '16px',
      lineHeight: '24px',
    },
  },
};

export const DefaultStory = (args) => {
  return (
    <NftDetailInformationFrame
      {...args}
      icon={
        <ButtonIcon
          size={IconSize.Sm}
          padding={2}
          color={IconColor.iconMuted}
          onClick={() => {
            global.platform.openTab({
              url: 'test',
            });
          }}
          iconName={IconName.Export}
        />
      }
    />
  );
};

DefaultStory.storyName = 'Default';

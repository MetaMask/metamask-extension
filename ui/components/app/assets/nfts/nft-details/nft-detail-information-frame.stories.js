import React from 'react';
import {
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
<<<<<<< HEAD:ui/components/app/nft-details/nft-detail-information-frame.stories.js
} from '../../../helpers/constants/design-system';
import { ButtonIcon, IconName, IconSize } from '../../component-library';
=======
} from '../../../../../helpers/constants/design-system';
import { ButtonIcon, IconName, IconSize } from '../../../../component-library';
>>>>>>> f60b43e76451536162b670cf856ceba852cf60ab:ui/components/app/assets/nfts/nft-details/nft-detail-information-frame.stories.js
import NftDetailInformationFrame from './nft-detail-information-frame';

export default {
  title: 'Components/App/NftDetailInformationFrame',

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

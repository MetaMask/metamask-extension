import React from 'react';

<<<<<<< HEAD:ui/components/app/nft-details/nft-detail-information-frame.tsx
import { Box, Text } from '../../component-library';
=======
import { Box, Text } from '../../../../component-library';
>>>>>>> f60b43e76451536162b670cf856ceba852cf60ab:ui/components/app/assets/nfts/nft-details/nft-detail-information-frame.tsx
import {
  AlignItems,
  Display,
  JustifyContent,
<<<<<<< HEAD:ui/components/app/nft-details/nft-detail-information-frame.tsx
} from '../../../helpers/constants/design-system';
=======
} from '../../../../../helpers/constants/design-system';
>>>>>>> f60b43e76451536162b670cf856ceba852cf60ab:ui/components/app/assets/nfts/nft-details/nft-detail-information-frame.tsx

type NftDetailInformationFrameProps = {
  title?: string;
  value?: string;
  frameClassname: string;
  frameTextTitleProps: Record<string, unknown>;
  frameTextValueProps?: Record<string, unknown>;
  frameTextTitleStyle?: React.CSSProperties;
  frameTextValueStyle?: React.CSSProperties;
  icon?: React.ReactNode;
  buttonAddressValue?: React.ButtonHTMLAttributes<HTMLButtonElement>;
};

const NftDetailInformationFrame = ({
  title,
  value,
  buttonAddressValue,
  frameClassname,
  frameTextTitleProps,
  frameTextTitleStyle,
  frameTextValueStyle,
  frameTextValueProps,
  icon,
}: NftDetailInformationFrameProps) => {
  return (
    <Box className={`${frameClassname}`}>
      <Text style={frameTextTitleStyle} {...frameTextTitleProps}>
        {title}
      </Text>

      {icon ? (
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          {' '}
          {buttonAddressValue ? (
            { ...buttonAddressValue }
          ) : (
            <Text style={frameTextValueStyle} {...frameTextValueProps}>
              {value}
            </Text>
          )}
          {icon}
        </Box>
      ) : (
        <Text style={frameTextValueStyle} {...frameTextValueProps}>
          {value}
        </Text>
      )}
    </Box>
  );
};

export default NftDetailInformationFrame;

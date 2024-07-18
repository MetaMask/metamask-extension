import React from 'react';

<<<<<<< HEAD:ui/components/app/nft-details/nft-detail-information-row.tsx
import { Box, Text } from '../../component-library';
=======
import { Box, Text } from '../../../../component-library';
>>>>>>> f60b43e76451536162b670cf856ceba852cf60ab:ui/components/app/assets/nfts/nft-details/nft-detail-information-row.tsx
import {
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
<<<<<<< HEAD:ui/components/app/nft-details/nft-detail-information-row.tsx
} from '../../../helpers/constants/design-system';
=======
} from '../../../../../helpers/constants/design-system';
>>>>>>> f60b43e76451536162b670cf856ceba852cf60ab:ui/components/app/assets/nfts/nft-details/nft-detail-information-row.tsx

type NftDetailInformationRowProps = {
  title: string;
  valueColor?: TextColor;
  value?: string | null;
  icon?: React.ReactNode;
  buttonAddressValue?: React.ButtonHTMLAttributes<HTMLButtonElement> | null;
};

const NftDetailInformationRow: React.FC<NftDetailInformationRowProps> = ({
  title,
  valueColor,
  value,
  icon,
  buttonAddressValue,
}) => {
  if (!value && !buttonAddressValue) {
    return null;
  }
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      marginTop={2}
    >
      <Text
        color={TextColor.textAlternative}
        variant={TextVariant.bodyMdMedium}
      >
        {title}
      </Text>
      {icon ? (
        <Box display={Display.Flex}>
          {buttonAddressValue ? (
            { ...buttonAddressValue }
          ) : (
            <Text
              color={valueColor || TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              {value}
            </Text>
          )}
          {icon}
        </Box>
      ) : (
        <Text
          color={valueColor || TextColor.textAlternative}
          variant={TextVariant.bodyMdMedium}
        >
          {value}
        </Text>
      )}
    </Box>
  );
};

export default NftDetailInformationRow;

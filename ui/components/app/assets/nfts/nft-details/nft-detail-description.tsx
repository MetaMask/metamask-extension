import React, { useState } from 'react';
<<<<<<< HEAD:ui/components/app/nft-details/nft-detail-description.tsx
import useIsOverflowing from '../../../hooks/snaps/useIsOverflowing';
import { Box, Button, ButtonVariant, Text } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
=======
import useIsOverflowing from '../../../../../hooks/snaps/useIsOverflowing';
import {
  Box,
  Button,
  ButtonVariant,
  Text,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
>>>>>>> f60b43e76451536162b670cf856ceba852cf60ab:ui/components/app/assets/nfts/nft-details/nft-detail-description.tsx
import {
  FontWeight,
  TextColor,
  TextVariant,
<<<<<<< HEAD:ui/components/app/nft-details/nft-detail-description.tsx
} from '../../../helpers/constants/design-system';
=======
} from '../../../../../helpers/constants/design-system';
>>>>>>> f60b43e76451536162b670cf856ceba852cf60ab:ui/components/app/assets/nfts/nft-details/nft-detail-description.tsx

const NftDetailDescription = ({ value }: { value: string | null }) => {
  const t = useI18nContext();
  const { contentRef, isOverflowing } = useIsOverflowing();
  const [isOpen, setIsOpen] = useState(false);

  const shouldDisplayButton = !isOpen && isOverflowing;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <>
      <Box
        marginTop={2}
        className="nft-details__show-more"
        style={{
          position: 'relative',
          overflow: 'hidden',
          maxHeight: isOpen ? 'none' : undefined,
        }}
        ref={contentRef}
      >
        <Text
          variant={TextVariant.bodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.textAlternative}
          data-testid="nft-details__description"
        >
          {value}
        </Text>
        {shouldDisplayButton && (
          <Box className="buttonDescriptionContainer">
            <Button
              className="nft-details__show-more__button"
              padding={0}
              paddingLeft={9}
              variant={ButtonVariant.Link}
              onClick={handleClick}
            >
              <Text color={TextColor.infoDefault}>{t('showMore')}</Text>
            </Button>
          </Box>
        )}
      </Box>
      {isOpen && (
        <Box>
          <Button
            padding={0}
            variant={ButtonVariant.Link}
            onClick={handleClick}
          >
            <Text color={TextColor.infoDefault}>{t('showLess')}</Text>
          </Button>
        </Box>
      )}
    </>
  );
};

export default NftDetailDescription;

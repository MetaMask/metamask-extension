import React, { useState } from 'react';
import useIsOverflowing from '../../../../../hooks/snaps/useIsOverflowing';
import {
  Box,
  Button,
  ButtonVariant,
  Text,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';

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

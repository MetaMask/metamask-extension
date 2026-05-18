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

  if (!value) {
    return null;
  }

  const shouldDisplayButton = isOverflowing;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <>
      <Box marginTop={2}>
        <Text
          variant={TextVariant.bodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.textAlternative}
          data-testid="nft-details__description"
          ref={contentRef}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: isOpen ? 'unset' : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {value}
        </Text>
      </Box>
      {shouldDisplayButton && (
        <Box marginTop={2}>
          <Button
            padding={0}
            variant={ButtonVariant.Link}
            onClick={handleClick}
          >
            <Text color={TextColor.infoDefault}>
              {isOpen ? t('showLess') : t('showMore')}
            </Text>
          </Button>
        </Box>
      )}
    </>
  );
};

export default NftDetailDescription;

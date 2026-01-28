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

  // TEMPORARY MOCK - Remove this before committing
  const mockDescription =
    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.';
  const displayValue = value || mockDescription;

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
          {displayValue}
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

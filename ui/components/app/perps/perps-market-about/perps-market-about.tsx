import React, { useState } from 'react';
import {
  Box,
  FontWeight,
  Text,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import useIsOverflowing from '../../../../hooks/snaps/useIsOverflowing';

export type PerpsMarketAboutProps = {
  description?: string;
  assetName?: string;
};

const PerpsMarketAboutContent = ({
  description,
  assetName,
}: Required<Pick<PerpsMarketAboutProps, 'description'>> &
  Omit<PerpsMarketAboutProps, 'description'>) => {
  const t = useI18nContext();
  const { contentRef, isOverflowing } = useIsOverflowing();
  const [isExpanded, setIsExpanded] = useState(false);
  const trimmedAssetName = assetName?.trim();

  return (
    <Box
      paddingLeft={4}
      paddingRight={4}
      data-testid="perps-market-about-section"
    >
      <Box paddingTop={4} paddingBottom={2}>
        <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Medium}>
          {trimmedAssetName
            ? t('perpsAboutAsset', [trimmedAssetName])
            : t('perpsAbout')}
        </Text>
      </Box>
      <Text
        asChild
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        data-testid="perps-market-about-description"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: isExpanded ? 'unset' : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        <p ref={contentRef}>{description}</p>
      </Text>
      {!isExpanded && isOverflowing && (
        <Box paddingTop={2}>
          <TextButton
            className="w-fit !text-inherit underline underline-offset-2 [text-decoration-skip-ink:none] hover:!text-inherit hover:![text-decoration-color:inherit] hover:!underline-offset-2"
            onClick={() => setIsExpanded(true)}
            aria-label={
              trimmedAssetName
                ? t('perpsReadMoreAbout', [trimmedAssetName])
                : t('perpsReadMore')
            }
            data-testid="perps-market-about-read-more"
          >
            {t('perpsReadMore')}
          </TextButton>
        </Box>
      )}
    </Box>
  );
};

export const PerpsMarketAbout = (props: PerpsMarketAboutProps) => {
  const trimmedDescription = props.description?.trim();

  if (!trimmedDescription) {
    return null;
  }

  return (
    <PerpsMarketAboutContent
      description={trimmedDescription}
      assetName={props.assetName}
    />
  );
};

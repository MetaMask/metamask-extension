import React from 'react';
import classnames from 'classnames';
import { useDispatch } from 'react-redux';
import {
  Display,
  AlignItems,
  JustifyContent,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { ButtonLink, Box } from '../../../../component-library';
import { showIpfsModal } from '../../../../../store/actions';

interface NftDefaultImageProps {
  className: string;
  clickable: boolean;
}

export default function NftDefaultImage({
  className,
  clickable,
}: NftDefaultImageProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();

  return (
    <Box
      tabIndex={0}
      data-testid="nft-default-image"
      className={classnames(className, 'nft-default', {
        'nft-default--clickable': clickable,
      })}
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      borderRadius={BorderRadius.LG}
    >
      {clickable && (
        <ButtonLink
          block
          className="nft-default__button"
          onClick={(e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            dispatch(showIpfsModal());
          }}
        >
          {t('show')}
        </ButtonLink>
      )}
    </Box>
  );
}

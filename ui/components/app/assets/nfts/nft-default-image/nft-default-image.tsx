import React from 'react';
import classnames from 'clsx';
import { useDispatch } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { ButtonLink } from '../../../../component-library';
import { showIpfsModal } from '../../../../../store/actions';

type NftDefaultImageProps = {
  className: string;
  clickable?: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
      className={classnames('flex', className, 'nft-default', 'rounded-lg', {
        'nft-default--clickable': Boolean(clickable),
      })}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
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

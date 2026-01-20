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
      className={classnames(className, 'nft-default', {
        'nft-default--clickable': Boolean(clickable),
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

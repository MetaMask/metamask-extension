import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import {
  Display,
  AlignItems,
  JustifyContent,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ButtonLink, Box } from '../../component-library';
import { showIpfsModal } from '../../../store/actions';
import { getIpfsGateway } from '../../../selectors';

export default function NftDefaultImage({ className, clickable }) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const isIpfsEnabled = useSelector(getIpfsGateway);

  return (
    <Box
      tabIndex={0}
      data-testid="nft-default-image"
      className={classnames(className, 'nft-default', {
        'nft-default--clickable': clickable,
      })}
      display={Display.Flex}
      alignItems={AlignItems.Center}
      justifyContent={JustifyContent.Center}
      borderRadius={BorderRadius.LG}
    >
      {!isIpfsEnabled && (
        <ButtonLink
          block
          className="nft-default__button"
          onClick={(e) => {
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

NftDefaultImage.propTypes = {
  /**
   * Controls the css class for the cursor hover
   */
  clickable: PropTypes.bool,
  /**
   * An additional className to apply to the NFT default image
   */
  className: PropTypes.string,
};

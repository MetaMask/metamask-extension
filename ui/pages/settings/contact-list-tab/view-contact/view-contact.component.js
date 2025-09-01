import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom-v5-compat';
import { AvatarAccountSize } from '@metamask/design-system-react';
import {
  Button,
  ButtonVariant,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../components/component-library';
import { PreferredAvatar } from '../../../../components/app/preferred-avatar';

import Tooltip from '../../../../components/ui/tooltip';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import {
  IconColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

function quadSplit(address) {
  return `0x${address
    .slice(2)
    .match(/.{1,4}/gu)
    .join('')}`;
}

function ViewContact({
  navigate,
  name,
  address,
  checkSummedAddress,
  memo,
  editRoute,
  listRoute,
}) {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();

  if (!address) {
    return <Navigate to={{ pathname: listRoute }} />;
  }

  return (
    <div className="settings-page__content-row">
      <div className="settings-page__content-item">
        <Box
          className="settings-page__header address-book__header"
          paddingLeft={6}
          paddingRight={6}
        >
          <PreferredAvatar size={AvatarAccountSize.Lg} address={address} />
          <Text
            className="address-book__header__name"
            variant={TextVariant.bodyLgMedium}
            marginInlineStart={4}
            style={{ overflow: 'hidden' }}
            ellipsis
          >
            {name || address}
          </Text>
        </Box>
        <div className="address-book__view-contact__group">
          <Button
            variant={ButtonVariant.Secondary}
            onClick={() => {
              navigate(`${editRoute}/${address}`);
            }}
          >
            {t('edit')}
          </Button>
        </div>
        <div className="address-book__view-contact__group">
          <div className="address-book__view-contact__group__label">
            {t('ethereumPublicAddress')}
          </div>
          <div className="address-book__view-contact__group__value">
            <div className="address-book__view-contact__group__static-address">
              {quadSplit(checkSummedAddress)}
            </div>
            <Tooltip
              position="bottom"
              title={copied ? t('copiedExclamation') : t('copyToClipboard')}
            >
              <ButtonIcon
                ariaLabel="copy"
                className="address-book__view-contact__group__static-address--copy-icon"
                onClick={() => {
                  handleCopy(checkSummedAddress);
                }}
                iconName={copied ? IconName.CopySuccess : IconName.Copy}
                size={ButtonIconSize.Lg}
                color={IconColor.primaryDefault}
              />
            </Tooltip>
          </div>
        </div>
        {memo.length > 0 ? (
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label--capitalized">
              {t('memo')}
            </div>
            <div className="address-book__view-contact__group__static-address">
              {memo}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

ViewContact.propTypes = {
  name: PropTypes.string,
  address: PropTypes.string,
  navigate: PropTypes.func.isRequired,
  checkSummedAddress: PropTypes.string,
  memo: PropTypes.string,
  editRoute: PropTypes.string,
  listRoute: PropTypes.string.isRequired,
};

export default React.memo(ViewContact);

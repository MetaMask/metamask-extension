import React from 'react';
import PropTypes from 'prop-types';
import { BannerAlert, IconName, Text } from '../../../component-library';
import { TextColor } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const SnapUpdateAlert = ({ snapName, onUpdateClick, bannerAlertProps }) => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();
  return (
    <BannerAlert
      title={t('snapUpdateAvailable')}
      actionButtonLabel={t('update')}
      actionButtonOnClick={onUpdateClick}
      actionButtonProps={{
        endIconName: IconName.Download,
        color: TextColor.primaryDefault,
      }}
      {...bannerAlertProps}
    >
      <Text>{t('snapUpdateAlertDescription', [snapName])}</Text>
    </BannerAlert>
  );
};

SnapUpdateAlert.propTypes = {
  /**
   * snapName Name of a Snap.
   */
  snapName: PropTypes.string.isRequired,
  /**
   * onUpdateClick Update handler callback.
   */
  onUpdateClick: PropTypes.func.isRequired,
  /**
   * bannerAlertProps additional properties for BannerAlert.
   */
  bannerAlertProps: PropTypes.object,
};

export default SnapUpdateAlert;

import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ADD_POPULAR_CUSTOM_NETWORK } from '../../../../helpers/constants/routes';
import Button from '../../../../components/ui/button';
import {
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
  Text,
} from '../../../../components/component-library';
import {
  BackgroundColor,
  BlockSize,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';

const NetworksFormSubheader = ({ addNewNetwork }) => {
  const t = useI18nContext();
  const history = useHistory();

  if (addNewNetwork) {
    return (
      <div className="networks-tab__subheader">
        <span className="networks-tab__sub-header-text">{t('networks')}</span>
        <span className="networks-tab__sub-header-text">{'  >  '}</span>
        <div className="networks-tab__sub-header-text">{t('addANetwork')}</div>
        <span>{'  >  '}</span>
        <div className="networks-tab__subheader--break">
          {t('addANetworkManually')}
        </div>
      </div>
    );
  }

  return process.env.ENABLE_NETWORK_UI_REDESIGN ? (
    <div className="settings-page__sub-header">
      {/* <span className="settings-page__sub-header-text">
        {t('networkMenuHeading')}
      </span> */}
      <Text variant={TextVariant.headingSm}> {t('networkMenuHeading')}</Text>
      <div className="networks-tab__add-network-header-button-wrapper">
        <ButtonSecondary
          backgroundColor={BackgroundColor.backgroundDefault}
          textAlign={TextAlign.Center}
          variant={TextVariant.bodyMd}
          size={ButtonSecondarySize.Md}
          width={BlockSize.Full}
          startIconName={IconName.Add}
        >
          {t('addCustomNetwork')}
        </ButtonSecondary>
      </div>
    </div>
  ) : (
    <div className="settings-page__sub-header">
      <span className="settings-page__sub-header-text">{t('networks')}</span>
      <div className="networks-tab__add-network-header-button-wrapper">
        <Button
          type="primary"
          onClick={(event) => {
            event.preventDefault();
            history.push(ADD_POPULAR_CUSTOM_NETWORK);
          }}
        >
          {t('addANetwork')}
        </Button>
      </div>
    </div>
  );
};

NetworksFormSubheader.propTypes = {
  addNewNetwork: PropTypes.bool.isRequired,
};

export default NetworksFormSubheader;

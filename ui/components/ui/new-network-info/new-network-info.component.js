import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../popover';
import Button from '../button';
import Identicon from '../identicon/identicon.component';

const NewNetworkInfo = ({}) => {
  const t = useContext(I18nContext);

  return (
    <Popover className="new-network-info__wrapper">
      <div className="new-network-info__close">
        <img
          src="./images/times.svg"
          alt=""
          className="new-network-info__close__close-icon"
          onClick={() => {}}
        />
      </div>
      <div className="new-network-info__title">{t('switchedTo')}</div>
      <div className="new-network-info__ident-section">
        <Identicon className="new-network-info__ident-section" diameter={14} />{' '}
        name
      </div>
      <div className="new-network-info__subtitle">{t('thingsToKeep')}</div>
      <div className="new-network-info__content">
        <div className="new-network-info__content__content-box-1">
          <div className="new-network-info__content__content-box-1__serial-number-1">
            {t('onboardingPinExtensionStep1')}.
          </div>
          <div className="new-network-info__content__content-box-1__text-1">
            {t('nativeToken')}
          </div>
        </div>
        <div className="new-network-info__content__content-box-1">
          <div className="new-network-info__content__content-box-1__serial-number-1">
            {t('onboardingPinExtensionStep2')}.
          </div>
          <div className="new-network-info__content__content-box-1__text-1">
            {t('attemptSendingAssets')}
          </div>
        </div>
        <div className="new-network-info__content__content-box-2">
          <div className="new-network-info__content__content-box-1__serial-number-1">
            {t('onboardingPinExtensionStep3')}.
          </div>
          <div className="new-network-info__content__content-box-1__text-1">
            {t('tokenShowUp')} {t('clickToManuallyAdd')}
          </div>
        </div>
      </div>
      <div className="new-network-info__footer">
        <Button type="primary" onClick={() => {}}>
          {t('recoveryPhraseReminderConfirm')}
        </Button>
      </div>
    </Popover>
  );
};

NewNetworkInfo.propTypes = {};

export default NewNetworkInfo;

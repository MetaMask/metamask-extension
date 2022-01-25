import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../popover';
import Button from '../button';
import Identicon from '../identicon/identicon.component';
import I18nValue from '../i18n-value';
import { NETWORK_TYPE_RPC } from '../../../../shared/constants/network';

const NewNetworkInfo = ({
  onClose,
  autoDetectToken,
  tokenImage,
  providerTicker,
  providerNickname,
  providerType,
  onManuallyAddClick,
  tokenDetectionSupported,
}) => {
  const t = useContext(I18nContext);

  return (
    <Popover onClose={onClose} className="new-network-info__wrapper" footer={
      <Button type="primary" onClick={onClose}>
      {t('recoveryPhraseReminderConfirm')}
    </Button>
    }>
      {/* <div className="new-network-info__close">

        <img
          src="./images/times.svg"
          alt=""
          className="new-network-info__close__close-icon"
          onClick={onClose}
        />
      </div> */}
      <div className="new-network-info__title">{t('switchedTo')}</div>
      <div className="new-network-info__ident-section">
        {tokenImage ? 
          (
          <Identicon image={tokenImage} diameter={14} />
          ) : (
            <i className="fa fa-question-circle"/>
            )} 
        <label className="new-network-info__ident-section__nickname">{providerType === NETWORK_TYPE_RPC 
          ? providerNickname ?? t('privateNetwork')
          : t(providerType)}</label>
      </div>
      <div className="new-network-info__subtitle">{t('thingsToKeep')}</div>
      <div className="new-network-info__content">
        {providerTicker ? 
        (
        <div className="new-network-info__content__content-box-1">
          <div className="new-network-info__content__content-box-1__serial-number-1">
            &bull;
          </div>
          <div className="new-network-info__content__content-box-1__text-1">
            <I18nValue messageKey="nativeToken" options={[<label style={{ fontWeight: '700'}}>{providerTicker}</label>]} />
          </div>
        </div>
        ) : null }
        <div className="new-network-info__content__content-box-1">
          <div className="new-network-info__content__content-box-1__serial-number-1">
            &bull;
          </div>
          <div className="new-network-info__content__content-box-1__text-1">
            {t('attemptSendingAssets')} <a href="https://metamask.zendesk.com/hc/en-us/articles/4404424659995" target="_blank" className="new-network-info__content__content-box-1__link-1">{t('learnMoreUpperCase')}</a>
          </div>
        </div>
        {(!autoDetectToken || !tokenDetectionSupported) ? 
          (
          <div className="new-network-info__content__content-box-2">
            <div className="new-network-info__content__content-box-1__serial-number-1">
              &bull;
            </div>
            <div className="new-network-info__content__content-box-1__text-1">
              {t('tokenShowUp')} <Button type="link" onClick={onManuallyAddClick} className="new-network-info__content__content-box-1__link-1">{t('clickToManuallyAdd')}</Button>
            </div>
          </div>
          ) : null}
      </div>
    </Popover>
  );
};

NewNetworkInfo.propTypes = {
  onClose: PropTypes.func,
  autoDetectToken: PropTypes.bool,
  tokenImage: PropTypes.string,
  providerTicker: PropTypes.string,
  providerNickname: PropTypes.string,
  providerType: PropTypes.string,
  onManuallyAddClick: PropTypes.func,
  tokenDetectionSupported: PropTypes.bool,
};

export default NewNetworkInfo;

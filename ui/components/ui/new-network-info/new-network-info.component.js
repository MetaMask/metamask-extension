import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../popover';
import Button from '../button';
import Identicon from '../identicon/identicon.component';
import I18nValue from '../i18n-value';
import { getProvider, getUseTokenDetection } from '../../../selectors';
import { useSelector } from 'react-redux';

const NewNetworkInfo = ({
  featuredRPC
}) => {
  const t = useContext(I18nContext);

  const provider = useSelector(getProvider);
  const tokenDetection = useSelector(getUseTokenDetection);
  console.log(tokenDetection);

  return (
    <Popover className="new-network-info__wrapper" footer={
      <Button type="primary" onClick={() => {}}>
      {t('recoveryPhraseReminderConfirm')}
    </Button>
    }>
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
        {featuredRPC.rpcPrefs.imageUrl ? 
          (
          <Identicon image={featuredRPC.rpcPrefs.imageUrl} diameter={14} />
          ) : (
            <i className="fa fa-question-circle"/>
            )} 
        <label className="new-network-info__ident-section__nickname">{featuredRPC.nickname}</label>
      </div>
      <div className="new-network-info__subtitle">{t('thingsToKeep')}</div>
      <div className="new-network-info__content">
        {featuredRPC.ticker ? 
        (
        <div className="new-network-info__content__content-box-1">
          <div className="new-network-info__content__content-box-1__serial-number-1">
            &bull;
          </div>
          <div className="new-network-info__content__content-box-1__text-1">
            <I18nValue messageKey="nativeToken" options={[<label style={{ fontWeight: '700'}}>{featuredRPC.ticker}</label>]} />
          </div>
        </div>
        ) : null }
        <div className="new-network-info__content__content-box-1">
          <div className="new-network-info__content__content-box-1__serial-number-1">
            &bull;
          </div>
          <div className="new-network-info__content__content-box-1__text-1">
            {t('attemptSendingAssets')} <a href="https://metamask.zendesk.com/hc/en-us/articles/4404424659995" className="new-network-info__content__content-box-1__link-1">{t('learnMoreUpperCase')}</a>
          </div>
        </div>
        <div className="new-network-info__content__content-box-2">
          <div className="new-network-info__content__content-box-1__serial-number-1">
            &bull;
          </div>
          <div className="new-network-info__content__content-box-1__text-1">
            {t('tokenShowUp')} <a href="" className="new-network-info__content__content-box-1__link-1">{t('clickToManuallyAdd')}</a>
          </div>
        </div>

      </div>
      {/* <div className="new-network-info__footer">
        <Button type="primary" onClick={() => {}}>
          {t('recoveryPhraseReminderConfirm')}
        </Button>
      </div> */}
    </Popover>
  );
};

NewNetworkInfo.propTypes = {
  featuredRPC: PropTypes.object,
};

export default NewNetworkInfo;

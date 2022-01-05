import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import I18nValue from '../i18n-value';
import Tooltip from '../tooltip';
import Popover from '../popover';
import Button from '../button';
import InfoIcon from '../icon/info-icon.component';
import { SEVERITIES } from '../../../helpers/constants/design-system';
import Identicon from '../identicon/identicon.component';

const NetworkDetails = ({
  name,
  url,
  chainId,
  onClose = null,
  onAdd = null,
}) => {
  const t = useContext(I18nContext);

  const onCancel = () => {
    onClose();
  };

  const onSubmit = () => {
    onAdd(name, url, chainId);
    onClose();
  };

  return (
    <Popover
      className="network-details__wrapper"
      footerClassName="network-details__footer"
      footer={
        <>
          <Button
            className="network-details__cancel"
            type="secondary"
            onClick={onCancel}
          >
            {t('cancel')}
          </Button>
          <Button
            className="network-details__save"
            type="primary"
            onClick={onSubmit}
          >
            {t('addNetwork')}
          </Button>
        </>
      }
    >
      <div className="network-details__header">
        <Identicon
          className="network-details__header__identicon"
          diameter={14}
        />
        {name}
      </div>
      <div className="network-details__title">{t('wantToAddNetwork')}</div>
      <div className="network-details__subtitle">{t('thisAllows')}</div>
      <div className="network-details__info">
        <label className="network-details__info__bold-label">
          {t('doesNotVerify')}
          <Tooltip position="bottom" theme="light" title={t('scamsAndNetwork')}>
            <i className="fa fa-info-circle" />
          </Tooltip>
        </label>
        <div className="network-details__info__link-section">
          <I18nValue
            messageKey="learnAbout"
            options={[
              <a href="" key="learnAboutLnk">
                <I18nValue messageKey="scamAndNetworkRisks" />
              </a>,
            ]}
          />
        </div>
      </div>
      <div className="network-details__content">
        <div className="network-details__content__label--capitalized">
          {t('networkName')}
          <InfoIcon severity={SEVERITIES.INFO} />
        </div>
        <div className="network-details__content__address">{name}</div>
        <div className="network-details__content__label--capitalized">
          {t('networkURL')}
          <InfoIcon severity={SEVERITIES.INFO} />
        </div>
        <div className="network-details__content__address">{url}</div>
        <div className="network-details__content__label--capitalized">
          {t('chainId')}
          <InfoIcon severity={SEVERITIES.INFO} />
        </div>
        <div className="network-details__content__address">{chainId}</div>
        <div className="network-details__content__address">
          <Button
            className="network-details__content__view-all"
            type="link"
            href="https://metamask.zendesk.com/hc/en-us/articles/4404424659995"
          >
            {t('viewAllDetails')}
          </Button>
        </div>
      </div>
    </Popover>
  );
};

NetworkDetails.propTypes = {
  name: PropTypes.string,
  url: PropTypes.string,
  chainId: PropTypes.string,
  onClose: PropTypes.func,
  onAdd: PropTypes.func,
};

export default NetworkDetails;

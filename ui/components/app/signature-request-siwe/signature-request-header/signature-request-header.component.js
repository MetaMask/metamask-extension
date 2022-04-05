import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import AccountListItem from '../../account-list-item';
import { I18nContext } from '../../../../contexts/i18n';

export default function SIWERequestHeader({ fromAccount, domain }) {
  const t = useContext(I18nContext);

  return (
    <div className="siwe-request-header">
      <div className="siwe-request-header--domain">
        <div className="request-signature__overview__item">
          {domain}
          {/* <Box
            display={DISPLAY.FLEX}
            className="confirm-approve-content__icon-display-content"
          >
            <Box className="confirm-approve-content__metafoxlogo">
              <MetaFoxLogo useDark={isBeta()} />
            </Box>
            <Box
              display={DISPLAY.FLEX}
              className="confirm-approve-content__siteinfo"
            >
              <UrlIcon
                className="confirm-approve-content__siteimage-identicon"
                fallbackClassName="confirm-approve-content__siteimage-identicon"
                name={getURLHostName(domain)}
                // url={siteImage}
              />
              <Typography
                variant={TYPOGRAPHY.H6}
                fontWeight={FONT_WEIGHT.NORMAL}
                color={COLORS.TEXT_ALTERNATIVE}
                boxProps={{ marginLeft: 1, marginTop: 2 }}
              >
                {getURLHostName(domain)}
                {domain}
              </Typography>
            </Box>
          </Box> */}
        </div>
      </div>
      <div className="title">{t('SIWESiteRequestTitle')}</div>
      <div className="subtitle">{t('SIWESiteRequestSubtitle')}</div>
      <div className="siwe-request-header--account">
        {fromAccount && <AccountListItem account={fromAccount} />}
      </div>
    </div>
  );
}

SIWERequestHeader.propTypes = {
  fromAccount: PropTypes.object,
  domain: PropTypes.string,
};

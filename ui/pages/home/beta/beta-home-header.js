import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';

import Typography from '../../../components/ui/typography/typography';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { BETA_BUGS_URL } from '../../../helpers/constants/beta';

import { getShowBetaHeader } from '../../../selectors';
import { hideBetaHeader } from '../../../store/actions';

const BetaHomeHeader = () => {
  const t = useI18nContext();
  const showBetaHeader = useSelector(getShowBetaHeader);

  if (!showBetaHeader) {
    return null;
  }

  return (
    <div className="home__main-view__beta-header">
      <Typography
        variant={TYPOGRAPHY.H7}
        marginTop={0}
        marginBottom={0}
        className="home__main-view__beta-header__message"
      >
        {t('betaHomeHeaderText', [
          <a href={BETA_BUGS_URL} key="link" target="_blank" rel="noreferrer">
            {t('here')}
          </a>,
        ])}
      </Typography>
      {showBetaHeader ? (
        <button
          className="home__main-view__beta-header__button"
          onClick={() => {
            hideBetaHeader();
          }}
        >
          <i className="fa fa-times" />
        </button>
      ) : null}
    </div>
  );
};

export default BetaHomeHeader;

import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import {
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
} from '../../../../../../selectors';
import { I18nContext } from '../../../../../../contexts/i18n';

import { TypographyVariant } from '../../../../../../helpers/constants/design-system';

import Button from '../../../../../ui/button';
import Typography from '../../../../../ui/typography';
import { Icon, ICON_NAMES } from '../../../../../component-library';

const Accreditation = ({ fetchVia, address }) => {
  const t = useContext(I18nContext);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const addressLink = getAccountLink(address, chainId, rpcPrefs);

  const AccreditationLink = () => {
    return (
      <>
        <Typography
          variant={TypographyVariant.H7}
          className="accreditation__prefix"
          boxProps={{ margin: 0 }}
        >
          {t('transactionDecodingAccreditationVerified', [
            <Button
              type="link"
              className="accreditation__link"
              onClick={() => {
                global.platform.openTab({
                  url: addressLink,
                });
              }}
              target="_blank"
              rel="noopener noreferrer"
              title={t('etherscanView')}
              key="accreditation-link-button"
            >
              {fetchVia}
            </Button>,
          ])}
        </Typography>
        <Typography variant={TypographyVariant.H7} boxProps={{ margin: 0 }}>
          {t('transactionDecodingAccreditationDecoded')}
        </Typography>
      </>
    );
  };

  return (
    <div className="accreditation">
      <div className="accreditation__icon">
        <Icon name={ICON_NAMES.INFO} />
      </div>
      <div className="accreditation__info">
        <AccreditationLink />
      </div>
    </div>
  );
};

Accreditation.propTypes = {
  fetchVia: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
};

export default Accreditation;

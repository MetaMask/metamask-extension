import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import {
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
} from '../../../../../../selectors';
import { I18nContext } from '../../../../../../contexts/i18n';

import Button from '../../../../../ui/button';
import Tooltip from '../../../../../ui/tooltip';

const Accreditation = ({ fetchVia, address }) => {
  const t = useContext(I18nContext);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const addressLink = getAccountLink(address, chainId, rpcPrefs);

  const AccreditationLink = () => {
    return (
      <>
        <div className="accreditation__prefix">
          {t('transactionDecodingAccreditationVerified')}
        </div>
        <div className="accreditation__content">
          <Button
            type="link"
            className="accreditation__content--link"
            onClick={() => {
              global.platform.openTab({
                url: addressLink,
              });
            }}
            target="_blank"
            rel="noopener noreferrer"
            title={t('etherscanView')}
          >
            {fetchVia}
          </Button>
        </div>
        <div className="accreditation__suffix">
          {t('transactionDecodingAccreditationDecoded')}
        </div>
      </>
    );
  };

  return (
    <div className="accreditation">
      <div className="accreditation__tooltip">
        <Tooltip position="top" arrow>
          <i className="fa fa-info-circle" />
        </Tooltip>
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

import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import {
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
} from '../../../../../../selectors';
import { I18nContext } from '../../../../../../contexts/i18n';

import {
  BUTTON_VARIANT,
  Button,
  Icon,
  IconName,
  Text,
} from '../../../../../component-library';
import { TextVariant } from '../../../../../../helpers/constants/design-system';

const Accreditation = ({ fetchVia, address }) => {
  const t = useContext(I18nContext);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const addressLink = getAccountLink(address, chainId, rpcPrefs);

  const AccreditationLink = () => {
    return (
      <>
        <Text
          variant={TextVariant.bodySm}
          as="h6"
          className="accreditation__prefix"
          margin={0}
        >
          {t('transactionDecodingAccreditationVerified', [
            <Button
              variant={BUTTON_VARIANT.LINK}
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
        </Text>
        <Text variant={TextVariant.bodySm} as="h6">
          {t('transactionDecodingAccreditationDecoded')}
        </Text>
      </>
    );
  };

  return (
    <div className="accreditation">
      <div className="accreditation__icon">
        <Icon name={IconName.Info} />
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

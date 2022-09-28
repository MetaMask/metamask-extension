import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import AccountListItem from '../../account-list-item';
import { I18nContext } from '../../../../contexts/i18n';
import Tooltip from '../../../ui/tooltip';
import InfoIcon from '../../../ui/icon/info-icon.component';
import {
  TYPOGRAPHY,
  SEVERITIES,
  DISPLAY,
  ALIGN_ITEMS,
  COLORS,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import Chip from '../../../ui/chip';
import Typography from '../../../ui/typography/typography';
import { Icon } from '../../../component-library/icon/icon';
import PermissionsConnectHeader from '../../permissions-connect-header';

const LeftIconWarning = ({ domain }) => {
  const t = useContext(I18nContext);
  return (
    <Tooltip
      position="bottom"
      html={<p>{t('SIWEDomainWarningBody', [domain])}</p>}
      wrapperClassName="signature-request-siwe-header__tooltip"
      containerClassName="signature-request-siwe-header__tooltip__container"
    >
      <Box
        className="rounded"
        padding={1}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        backgroundColor={COLORS.ERROR_DEFAULT}
        // borderRadius="50%"
      >
        <Icon name="danger-filled" color={COLORS.ERROR_INVERSE} />
      </Box>
    </Tooltip>
  );
};

const RightIconWarning = ({ domain }) => {
  const t = useContext(I18nContext);
  return (
    <Tooltip
      position="bottom"
      html={<p>{t('SIWEDomainWarningBody', [domain])}</p>}
      wrapperClassName="signature-request-siwe-header__tooltip"
      containerClassName="signature-request-siwe-header__tooltip__container"
    >
      {/* <InfoIcon severity={SEVERITIES.DANGER} /> */}
      <Box
        className="rounded"
        marginRight={1}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        backgroundColor={COLORS.ERROR_DEFAULT}
      >
        <Typography
          fontWeight="bold"
          margin={1}
          variant={TYPOGRAPHY.H7}
          color={COLORS.ERROR_INVERSE}
        >
          {t('SIWEDomainWarningLabel')}
        </Typography>
      </Box>
    </Tooltip>
  );
};

// function LeftIconWarning() {
//   return (
//     <Tooltip
//       position="top"
//       title="This site is requesting access to your account"
//     >
//       <InfoIcon severity={SEVERITIES.WARNING} />
//     </Tooltip>
//   );
// }

// function RightIconWarning() {
//   return (
//     <Tooltip
//       position="top"
//       title="This site is requesting access to your account"
//     >
//       <InfoIcon severity={SEVERITIES.WARNING} />
//     </Tooltip>
//   );
// }

export default function SignatureRequestSIWEHeader({
  fromAccount,
  domain,
  isSIWEDomainValid,
  subjectMetadata,
}) {
  const t = useContext(I18nContext);

  return (
    <div className="signature-request-siwe-header">
      <PermissionsConnectHeader
        iconUrl={subjectMetadata.iconUrl}
        iconName={subjectMetadata.name}
        headerTitle={t('SIWESiteRequestTitle')}
        headerText={t('SIWESiteRequestSubtitle')}
        siteOrigin={domain}
        className={isSIWEDomainValid ? '' : 'bad-domain'}
        leftIcon={!isSIWEDomainValid && <LeftIconWarning domain={domain} />}
        rightIcon={!isSIWEDomainValid && <RightIconWarning domain={domain} />}
      />
      {fromAccount && (
        <AccountListItem
          account={fromAccount}
          className="signature-request-siwe-header__account-list-item"
        />
      )}
    </div>
  );
}

SignatureRequestSIWEHeader.propTypes = {
  /**
   * The account that is requesting permissions
   */
  fromAccount: PropTypes.object,
  /**
   * The domain that the request is for
   */
  domain: PropTypes.string,
  /**
   * Whether the domain is valid
   */
  isSIWEDomainValid: PropTypes.bool,
  /**
   * The metadata for the subject. This is used to display the icon and name
   * and is selected from the domain in the SIWE request.
   */
  subjectMetadata: PropTypes.object,
};

LeftIconWarning.propTypes = {
  domain: PropTypes.string,
};

RightIconWarning.propTypes = {
  domain: PropTypes.string,
};

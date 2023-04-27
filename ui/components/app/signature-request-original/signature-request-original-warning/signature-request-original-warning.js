import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import Popover from '../../../ui/popover';
import Box from '../../../ui/box';
import Button from '../../../ui/button';
import Typography from '../../../ui/typography';
import {
  IconColor,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JustifyContent,
  TextColor,
  TypographyVariant,
} from '../../../../helpers/constants/design-system';
import Identicon from '../../../ui/identicon';
import { shortenAddress } from '../../../../helpers/utils/util';
import { Icon, IconName } from '../../../component-library';

const SignatureRequestOriginalWarning = ({
  senderAddress,
  name,
  onSubmit,
  onCancel,
}) => {
  const t = useI18nContext();

  return (
    <Popover className="signature-request-warning__content">
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        padding={4}
        className="signature-request-warning__content__header"
      >
        <Icon
          name={IconName.Danger}
          color={IconColor.errorDefault}
          className="signature-request-warning__content__header__warning-icon"
        />
        <Typography
          variant={TypographyVariant.H4}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('yourFundsMayBeAtRisk')}
        </Typography>
      </Box>
      <Box
        display={DISPLAY.FLEX}
        padding={4}
        justifyContent={JustifyContent.spaceBetween}
        className="signature-request-warning__content__account"
      >
        <Box display={DISPLAY.FLEX}>
          <Identicon address={senderAddress} diameter={32} />
          <Typography
            variant={TypographyVariant.H5}
            marginLeft={2}
            className="signature-request-warning__content__account-name"
          >
            <b>{name}</b> {` (${shortenAddress(senderAddress)})`}
          </Typography>
        </Box>
      </Box>

      <Typography
        color={TextColor.textAlternative}
        margin={4}
        marginTop={4}
        marginBottom={4}
        variant={TypographyVariant.H6}
      >
        {t('signatureRequestWarning', [
          <a
            href="https://consensys.net/blog/metamask/the-seal-of-approval-know-what-youre-consenting-to-with-permissions-and-approvals-in-metamask/"
            target="_blank"
            type="link"
            key="non_custodial_link"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-primary-default)' }}
          >
            {t('learnMoreUpperCase')}
          </a>,
        ])}
      </Typography>

      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        justifyContent={JustifyContent.spaceBetween}
        padding={4}
        className="signature-request-warning__footer"
      >
        <Button
          className="signature-request-warning__footer__sign-button"
          type="danger-primary"
          onClick={onSubmit}
        >
          {t('sign')}
        </Button>
        <Button
          className="signature-request-warning__footer__reject-button"
          type="secondary"
          onClick={onCancel}
        >
          {t('reject')}
        </Button>
      </Box>
    </Popover>
  );
};

SignatureRequestOriginalWarning.propTypes = {
  senderAddress: PropTypes.string,
  name: PropTypes.string,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
};

export default SignatureRequestOriginalWarning;

import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import Popover from '../../../ui/popover';
import {
  IconColor,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import Identicon from '../../../ui/identicon';
import { shortenAddress } from '../../../../helpers/utils/util';
import { Icon, IconName, Box, Text, Button } from '../../../component-library';

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
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        padding={4}
        className="signature-request-warning__content__header"
      >
        <Icon
          name={IconName.Danger}
          color={IconColor.errorDefault}
          className="signature-request-warning__content__header__warning-icon"
        />
        <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Bold}>
          {t('yourFundsMayBeAtRisk')}
        </Text>
      </Box>
      <Box
        display={Display.Flex}
        padding={4}
        justifyContent={JustifyContent.spaceBetween}
        className="signature-request-warning__content__account"
      >
        <Box display={Display.Flex}>
          <Identicon address={senderAddress} diameter={32} />
          <Text
            variant={TextVariant.bodyMd}
            as="h5"
            marginLeft={2}
            className="signature-request-warning__content__account-name"
          >
            <b>{name}</b> {` (${shortenAddress(senderAddress)})`}
          </Text>
        </Box>
      </Box>

      <Text
        color={TextColor.textAlternative}
        margin={4}
        marginTop={4}
        marginBottom={4}
        variant={TextVariant.bodySm}
        as="h6"
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
      </Text>

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.spaceBetween}
        padding={4}
        className="signature-request-warning__footer"
      >
        <Button
          className="signature-request-warning__footer__sign-button"
          type="danger-primary"
          data-testid="signature-warning-sign-button"
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

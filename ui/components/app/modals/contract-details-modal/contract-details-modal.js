import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/box';
import CopyContractDetails from '../../../ui/icon/copy-contract-details';
import IconBlockExplorer from '../../../ui/icon/icon-block-explorer';
import Button from '../../../ui/button/button.component';
import Tooltip from '../../../ui/tooltip/tooltip';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Identicon from '../../../ui/identicon/identicon.component';
import { ellipsify } from '../../../../pages/send/send.utils';
import Popover from '../../../ui/popover';
import Typography from '../../../ui/typography';
import {
  FONT_WEIGHT,
  TYPOGRAPHY,
  DISPLAY,
  COLORS,
  JUSTIFY_CONTENT,
} from '../../../../helpers/constants/design-system';

export default function ContractDetailsModal({ onClose, address, tokenName }) {
  const t = useI18nContext();

  return (
    <Popover className="contract-details-modal">
      <Box
        paddingTop={6}
        paddingRight={4}
        paddingBottom={8}
        paddingLeft={4}
        className="contract-details-modal__content"
      >
        <Typography
          fontWeight={FONT_WEIGHT.BOLD}
          variant={TYPOGRAPHY.H5}
          display={DISPLAY.FLEX}
          boxProps={{ marginTop: 0, marginBottom: 0 }}
        >
          {t('contractTitle')}
        </Typography>
        <Typography
          variant={TYPOGRAPHY.H7}
          display={DISPLAY.FLEX}
          color={COLORS.TEXT_ALTERNATIVE}
          boxProps={{ marginTop: 2, marginBottom: 0 }}
        >
          {t('contractDescription')}
        </Typography>
        <Typography
          variant={TYPOGRAPHY.H6}
          display={DISPLAY.FLEX}
          marginTop={4}
          marginBottom={2}
        >
          {t('contractToken')}
        </Typography>
        <Box className="contract-details-modal__content__contract">
          <Identicon
            className="contract-details-modal__content__contract__identicon"
            address={address}
            diameter={24}
          />
          <Box data-testid="recipient">
            <Typography
              fontWeight={FONT_WEIGHT.BOLD}
              variant={TYPOGRAPHY.H5}
              marginTop={4}
            >
              {tokenName || ellipsify(address)}
            </Typography>
            {tokenName && (
              <Typography
                variant={TYPOGRAPHY.H6}
                display={DISPLAY.FLEX}
                color={COLORS.TEXT_ALTERNATIVE}
              >
                {ellipsify(address)}
              </Typography>
            )}
          </Box>
          <Box
            justifyContent={JUSTIFY_CONTENT.FLEX_END}
            className="contract-details-modal__content__contract__buttons"
          >
            <Box marginTop={5} marginRight={5}>
              <Tooltip position="top" title={t('copyToClipboard')}>
                <Button
                  className="contract-details-modal__content__contract__buttons__copy"
                  type="link"
                >
                  <CopyContractDetails />
                </Button>
              </Tooltip>
            </Box>
            <Box marginTop={5} marginRight={5}>
              <Tooltip position="top" title={t('openInBlockExplorer')}>
                <Button
                  className="contract-details-modal__content__contract__buttons__block-explorer"
                  type="link"
                >
                  <IconBlockExplorer />
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        <Typography
          variant={TYPOGRAPHY.H6}
          display={DISPLAY.FLEX}
          marginTop={4}
          marginBottom={2}
        >
          {t('contractRequestingSpendingCap')}
        </Typography>
        <Box className="contract-details-modal__content__contract">
          <Identicon
            className="contract-details-modal__content__contract__identicon"
            address={address}
            diameter={24}
          />
          <Box data-testid="recipient">
            <Typography
              fontWeight={FONT_WEIGHT.BOLD}
              variant={TYPOGRAPHY.H5}
              marginTop={4}
            >
              {tokenName || ellipsify(address)}
            </Typography>
            {tokenName && (
              <Typography
                variant={TYPOGRAPHY.H6}
                display={DISPLAY.FLEX}
                color={COLORS.TEXT_ALTERNATIVE}
              >
                {ellipsify(address)}
              </Typography>
            )}
          </Box>
          <Box
            justifyContent={JUSTIFY_CONTENT.FLEX_END}
            className="contract-details-modal__content__contract__buttons"
          >
            <Box marginTop={5} marginRight={5}>
              <Tooltip position="top" title={t('copyToClipboard')}>
                <Button
                  className="contract-details-modal__content__contract__buttons__copy"
                  type="link"
                >
                  <CopyContractDetails />
                </Button>
              </Tooltip>
            </Box>
            <Box marginTop={5} marginRight={5}>
              <Tooltip position="top" title={t('openInBlockExplorer')}>
                <Button
                  className="contract-details-modal__content__contract__buttons__block-explorer"
                  type="link"
                >
                  <IconBlockExplorer />
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box display={DISPLAY.FLEX} className="contract-details-modal__footer">
        <Button
          type="secondary"
          onClick={() => {
            onClose();
          }}
        >
          {t('cancel')}
        </Button>
        <Button type="primary">{t('confirm')}</Button>
      </Box>
    </Popover>
  );
}

ContractDetailsModal.propTypes = {
  onClose: PropTypes.func,
  address: PropTypes.string,
  tokenName: PropTypes.string,
};

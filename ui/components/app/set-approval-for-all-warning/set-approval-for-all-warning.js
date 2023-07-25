import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';

import Popover from '../../ui/popover';
import Box from '../../ui/box';

import {
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Identicon from '../../ui/identicon';
import { shortenAddress } from '../../../helpers/utils/util';
import {
  Icon,
  IconName,
  Button,
  BUTTON_VARIANT,
  Text,
} from '../../component-library';

const SetApproveForAllWarning = ({
  collectionName,
  senderAddress,
  name,
  total,
  isERC721,
  onSubmit,
  onCancel,
}) => {
  const t = useI18nContext();

  const footer = (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      justifyContent={JustifyContent.SPACE_BETWEEN}
      className="set-approval-for-all-warning__footer"
      gap={4}
    >
      <Button
        className="set-approval-for-all-warning__footer__approve-button"
        variant={BUTTON_VARIANT.PRIMARY}
        danger
        onClick={onSubmit}
      >
        {t('approveButtonText')}
      </Button>
      <Button
        className="set-approval-for-all-warning__footer__cancel-button"
        variant={BUTTON_VARIANT.SECONDARY}
        onClick={onCancel}
      >
        {t('reject')}
      </Button>
    </Box>
  );

  return (
    <Popover className="set-approval-for-all-warning__content" footer={footer}>
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        padding={4}
        className="set-approval-for-all-warning__content__header"
      >
        <Icon
          name={IconName.Danger}
          className="set-approval-for-all-warning__content__header__warning-icon"
        />
        <Text variant={TextVariant.headingSm} as="h4">
          {t('yourNFTmayBeAtRisk')}
        </Text>
      </Box>
      <Box
        display={DISPLAY.FLEX}
        padding={4}
        justifyContent={JustifyContent.spaceBetween}
        className="set-approval-for-all-warning__content__account"
      >
        <Box display={DISPLAY.FLEX}>
          <Identicon address={senderAddress} diameter={32} />
          <Text
            variant={TextVariant.bodyMd}
            as="h5"
            marginLeft={2}
            className="set-approval-for-all-warning__content__account-name"
          >
            <strong>{name}</strong> {` (${shortenAddress(senderAddress)})`}
          </Text>
        </Box>
        {isERC721 && total && <Text>{`${t('total')}: ${total}`}</Text>}
      </Box>

      <Text
        margin={4}
        marginTop={4}
        marginBottom={4}
        variant={TextVariant.bodySm}
        as="h6"
      >
        {t('nftWarningContent', [
          <strong key="non_custodial_bold">
            {t('nftWarningContentBold', [collectionName || ''])}
          </strong>,
          <strong key="non_custodial_grey">
            {t('nftWarningContentGrey')}
          </strong>,
        ])}
      </Text>
    </Popover>
  );
};

SetApproveForAllWarning.propTypes = {
  /**
   * NFT collection name that is being approved
   */
  collectionName: PropTypes.string,
  /**
   * Address of a current user that is approving collection
   */
  senderAddress: PropTypes.string,
  /**
   * Name of a current user that is approving collection
   */
  name: PropTypes.string,
  /**
   * Total number of items that are being approved
   */
  total: PropTypes.string,
  /**
   * Is asset standard ERC721
   */
  isERC721: PropTypes.bool,
  /**
   * Function that approves collection
   */
  onSubmit: PropTypes.func,
  /**
   * Function that rejects collection
   */
  onCancel: PropTypes.func,
};

export default SetApproveForAllWarning;

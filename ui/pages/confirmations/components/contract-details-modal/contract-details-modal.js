import React from 'react';
import PropTypes from 'prop-types';
import Popover from '../../../../components/ui/popover';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import ContractDetails from '../contract-details';
import {
  FontWeight,
  TextVariant,
  Display,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { Text, Box, Button } from '../../../../components/component-library';

export default function ContractDetailsModal({ onClose, ...props }) {
  const t = useI18nContext();

  return (
    <Popover className="contract-details-modal">
      <ContractDetails {...props}>
        <Text
          fontWeight={FontWeight.Bold}
          variant={TextVariant.bodyMd}
          as="h5"
          display={Display.Flex}
        >
          {t('contractTitle')}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          as="h6"
          display={Display.Flex}
          color={TextColor.textAlternative}
          marginTop={2}
        >
          {t('contractDescription')}
        </Text>
      </ContractDetails>
      <Box
        display={Display.Flex}
        paddingTop={6}
        paddingRight={4}
        paddingBottom={6}
        paddingLeft={4}
      >
        <Button type="primary" onClick={() => onClose()}>
          {t('recoveryPhraseReminderConfirm')}
        </Button>
      </Box>
    </Popover>
  );
}

ContractDetailsModal.propTypes = {
  /**
   * Function that should close the modal
   */
  onClose: PropTypes.func,
  /**
   * Name of the token that is waiting to be allowed
   */
  tokenName: PropTypes.string,
  /**
   * Address of the token that is waiting to be allowed
   */
  tokenAddress: PropTypes.string,
  /**
   * Contract address requesting spending cap
   */
  toAddress: PropTypes.string,
  /**
   * Current network chainId
   */
  chainId: PropTypes.string,
  /**
   * RPC prefs of the current network
   */
  rpcPrefs: PropTypes.object,
  /**
   * The token id of the NFT
   */
  tokenId: PropTypes.string,
  /**
   * Token Standard
   */
  assetStandard: PropTypes.string,
  /**
   * The name of the collection
   */
  assetName: PropTypes.string,
  /**
   * Whether contract requesting signature flow has started
   */
  isContractRequestingSignature: PropTypes.bool,
};

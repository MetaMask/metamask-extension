import React from 'react';
import { CaipChainId } from '@metamask/utils';
import { useDispatch } from 'react-redux';

import { useAccountCreationOnNetworkChange } from '../../../../hooks/accounts/useAccountCreationOnNetworkChange';
import { toggleNetworkMenu } from '../../../../store/actions';
import { MULTICHAIN_NETWORK_TO_NICKNAME } from '../../../../../shared/constants/multichain/networks';
import {
  Box,
  Text,
  ButtonPrimary,
  ButtonPrimarySize,
} from '../../../component-library';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const AddNonEvmAccountModal = ({ chainId }: { chainId: CaipChainId }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { createAccount } = useAccountCreationOnNetworkChange();

  return (
    <Box
      className="add-non-evm-account-modal"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Screen}
    >
      <Box paddingLeft={4} paddingRight={4}>
        <Text textAlign={TextAlign.Left} variant={TextVariant.bodyMd}>
          {t('addNonEvmAccountFromNetworkPicker', [
            MULTICHAIN_NETWORK_TO_NICKNAME[chainId],
          ])}
        </Text>
      </Box>
      <Box
        className="add-non-evm-account-modal__footer"
        backgroundColor={BackgroundColor.backgroundDefault}
        padding={4}
        width={BlockSize.Full}
      >
        <ButtonPrimary
          width={BlockSize.Full}
          size={ButtonPrimarySize.Lg}
          onClick={async () => {
            // This modal is being part of the `NetworkListMenu`. So
            // we need to explicitly close it before triggering
            // the account creation.
            // See: `NetworkMenuList.ACTION_MODE.ADD_NON_EVM_ACCOUNT`.
            dispatch(toggleNetworkMenu());
            await createAccount(chainId);
          }}
        >
          {t('addAccount')}
        </ButtonPrimary>
      </Box>
    </Box>
  );
};

export default AddNonEvmAccountModal;

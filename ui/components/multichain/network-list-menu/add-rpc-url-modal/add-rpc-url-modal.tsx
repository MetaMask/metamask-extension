import React, { MutableRefObject, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RpcEndpointType } from '@metamask/network-controller';
import {
  Box,
  ButtonPrimary,
  ButtonPrimarySize,
  FormTextField,
} from '../../../component-library';
import {
  BlockSize,
  Display,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  setActiveNetwork,
  upsertNetworkConfiguration,
} from '../../../../store/actions';
import { getNetworkConfigurationsByChainId } from '../../../../selectors';
import { getProviderConfig } from '../../../../ducks/metamask/metamask';

const AddRpcUrlModal = ({
  chainId,
  onRpcUrlAdded,
  onRpcUrlSelected,
  prevActionMode,
}: {
  chainId: string;
  onRpcUrlAdded: (rpcUrl: string) => void;
  prevActionMode: string;
}) => {
  const t = useI18nContext();
  // const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  console.log('prevActionMode ++++++', prevActionMode);
  // const {chainId: currentChainId} = useSelector(getProviderConfig)

  // const networkConfigurationsByChainId =
  //   useSelector(getNetworkConfigurationsByChainId);

  // const network = networkConfigurationsByChainId[chainId];

  // debugger;

  // TODO: Validate URL
  return (
    <Box padding={4}>
      <FormTextField
        inputRef={inputRef}
        id="additional-rpc-url"
        label={t('additionalRpcUrl')}
        labelProps={{
          children: undefined,
          variant: TextVariant.bodySmMedium,
        }}
      />

      <ButtonPrimary
        size={ButtonPrimarySize.Lg}
        display={Display.Block}
        width={BlockSize.Full}
        marginTop={8}
        marginLeft={'auto'}
        marginRight={'auto'}
        onClick={async () => {
          console.log('inputRef.current ======', inputRef.current);
          if (inputRef.current) {
            onRpcUrlAdded(inputRef.current.value);
          }

          // if (inputRef.current) {

          //   const editedNetwork = await dispatch(
          //     upsertNetworkConfiguration(
          //       {
          //         rpcUrls: [...network.rpcEndpoints, {url:inputRef.current.value, type:RpcEndpointType.Custom}],
          //         ticker: network.nativeCurrency,
          //         defaultRpcEndpointUrl: inputRef.current.value,
          //         chainId,
          //         nickname: network.name,
          //         rpcPrefs: {
          //           // imageUrl: undefined,
          //           blockExplorerUrl: network.blockExplorerUrl,
          //         },
          //       },
          //       {}
          //     ))

          //     const rpceee = editedNetwork.rpcEndpoints.find(rpcEndpoint => rpcEndpoint.url === inputRef.current.value);

          //     if (chainId === currentChainId) {
          //       dispatch(setActiveNetwork(rpceee.networkClientId));
          //     }

          //   // onRpcUrlAdded(inputRef.current.value)
          //   onRpcUrlAdded()
          // }
        }}
      >
        {t('addUrl')}
      </ButtonPrimary>
    </Box>
  );
};

export default AddRpcUrlModal;

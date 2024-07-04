// import React from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   BlockSize,
//   Display,
// } from '../../../../helpers/constants/design-system';
// import {
//   Box,
//   ButtonPrimary,
//   ButtonPrimarySize,
//   ButtonSecondary,
//   ButtonSecondarySize,
//   Modal,
//   ModalBody,
//   ModalContent,
//   ModalHeader,
//   ModalOverlay,
// } from '../../../component-library';
// import { useI18nContext } from '../../../../hooks/useI18nContext';
// import {
//   hideModal,
//   setEditedNetwork,
//   toggleNetworkMenu,
//   upsertNetworkConfiguration,
// } from '../../../../store/actions';
// import { useModalProps } from '../../../../hooks/useModalProps';
// import { getNetworkConfigurationsByChainId } from '../../../../selectors';

// const ConfirmDeleteRpcUrlModal = () => {
//   const t = useI18nContext();
//   const dispatch = useDispatch();

//   const {hideModal, props:{chainId, rpcUrl}} = useModalProps();

//   const networkConfigurationsByChainId =
//   useSelector(getNetworkConfigurationsByChainId);

//   const network = networkConfigurationsByChainId[chainId];

//   return (
//     <Modal
//       isClosedOnEscapeKey={true}
//       isClosedOnOutsideClick={true}
//       isOpen={true}
//       onClose={() => {
//         dispatch(setEditedNetwork());
//         dispatch(hideModal());
//       }}
//     >
//       <ModalOverlay />
//       <ModalContent>
//         <ModalHeader>{t('confirmDeletion')}</ModalHeader>
//         <ModalBody>
//           <Box>{t('confirmRpcUrlDeletionMessage')}</Box>
//           <Box display={Display.Flex} gap={4} marginTop={6}>
//             <ButtonSecondary
//               width={BlockSize.Full}
//               size={ButtonSecondarySize.Lg}
//               onClick={() => {
//                 dispatch(hideModal());
//                 dispatch(toggleNetworkMenu());
//               }}
//             >
//               {t('back')}
//             </ButtonSecondary>
//             <ButtonPrimary
//               width={BlockSize.Full}
//               size={ButtonPrimarySize.Lg}
//               danger={true}
//               onClick={async () => {
//                 const rpcUrls = network.rpcEndpoints.filter(rpcEndpoint => rpcEndpoint.url !== rpcUrl);

//                 await dispatch(
//                   upsertNetworkConfiguration(
//                     {
//                       rpcUrls,
//                       ticker: network.nativeCurrency,
//                       defaultRpcEndpointUrl: rpcUrl != network.defaultRpcEndpointUrl ? network.defaultRpcEndpointUrl  :  rpcUrls[0].url,
//                       chainId,
//                       nickname: network.name,
//                       rpcPrefs: {
//                         // imageUrl: undefined,
//                         blockExplorerUrl: network.blockExplorerUrl,
//                       },
//                     },
//                     {}
//                   ))

//                   dispatch(hideModal());
//                   dispatch(
//                     setEditedNetwork({
//                       chainId,
//                       nickname: network.name,
//                     }))
//                   dispatch(toggleNetworkMenu());
//               }}
//             >
//               {t('deleteRpcUrl')}
//             </ButtonPrimary>
//           </Box>
//         </ModalBody>
//       </ModalContent>
//     </Modal>
//   );
// };

// export default ConfirmDeleteRpcUrlModal;

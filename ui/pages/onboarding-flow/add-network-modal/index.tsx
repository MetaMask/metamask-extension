// import React from 'react';
// import { useDispatch } from 'react-redux';
// import PropTypes from 'prop-types';
// import { useI18nContext } from '../../../hooks/useI18nContext';

// import { hideModal } from '../../../store/actions';

// import Typography from '../../../components/ui/typography/typography';
// import Box from '../../../components/ui/box/box';
// import {
//   TEXT_ALIGN,
//   TypographyVariant,
//   FONT_WEIGHT,
// } from '../../../helpers/constants/design-system';
// import NetworksForm from '../../settings/networks-tab/networks-form/networks-form';
// import {
//   ACTION_MODES,
//   StagedBlockExplorerUrls,
//   StagedRpcUrls,
// } from '../../../components/multichain/network-list-menu/network-list-menu';
// import { DropdownEditorActions } from '../../settings/networks-tab/networks-form/url-editor';

// export default function AddNetworkModal({
//   showHeader = false, // todo is this always false?
//   onEditNetwork,
//   networkToEdit,
//   stagedRpcUrls,
//   stagedBlockExplorers,
//   rpcActions,
//   blockExplorerActions,
// }: // onExplorerUrlDeleted,
// // onRpcUrlAdd,
// // onBlockExplorerUrlAdd,
// // onRpcUrlDeleted,
// // onRpcUrlSelected,
// // onExplorerUrlSelected,
// // prevActionMode,
// // networkFormInformation = {},
// // setNetworkFormInformation = () => null,
// {
//   showHeader: boolean;
//   onEditNetwork: (network: any) => void;
//   networkToEdit: any;
//   stagedRpcUrls: StagedRpcUrls;
//   stagedBlockExplorers: StagedBlockExplorerUrls;
//   rpcActions: DropdownEditorActions;
//   blockExplorerActions: DropdownEditorActions;
//   // onExplorerUrlDeleted: (item: any, index: number) => void;
//   // onRpcUrlAdd: () => void;
//   // onBlockExplorerUrlAdd: () => void;
//   // onRpcUrlDeleted: (item: any, index: number) => void;
//   // onRpcUrlSelected: (item: any, index: number) => void;
//   // onExplorerUrlSelected: (item: any, index: number) => void;
//   // prevActionMode: ACTION_MODES;
//   // networkFormInformation = {},
//   // setNetworkFormInformation = () => null,
// }) {
//   const dispatch = useDispatch();
//   const t = useI18nContext();

//   const closeCallback = () =>
//     // dispatch(hideModal({ name: 'ONBOARDING_ADD_NETWORK' }));
//     dispatch(hideModal());

//   // const additionalProps = networkToEdit
//   //   ? { selectedNetwork: networkToEdit }
//   //   : {};

//   return (
//     <>
//       {showHeader ? (
//         <Box paddingTop={4}>
//           <Typography
//             variant={TypographyVariant.H4}
//             align={TEXT_ALIGN.CENTER}
//             fontWeight={FONT_WEIGHT.BOLD}
//           >
//             {t('onboardingMetametricsModalTitle')}
//           </Typography>
//         </Box>
//       ) : null}
//       <NetworksForm
//         addNewNetwork={!networkToEdit}
//         selectedNetwork={networkToEdit}
//         setActiveOnSubmit
//         networksToRender={[]}
//         cancelCallback={closeCallback}
//         submitCallback={closeCallback}
//         stagedRpcUrls={stagedRpcUrls}
//         stagedBlockExplorers={stagedBlockExplorers}
//         rpcActions={rpcActions}
//         blockExplorerActions={blockExplorerActions}
//         // onExplorerUrlDeleted={onExplorerUrlDeleted}
//         // onRpcUrlAdd={onRpcUrlAdd}
//         // onBlockExplorerUrlAdd={onBlockExplorerUrlAdd}
//         // onRpcUrlDeleted={onRpcUrlDeleted}
//         // onRpcUrlSelected={onRpcUrlSelected}
//         // onExplorerUrlSelected={onExplorerUrlSelected}
//         onEditNetwork={onEditNetwork}
//         // prevActionMode={prevActionMode}
//         // networkFormInformation={networkFormInformation}
//         // setNetworkFormInformation={setNetworkFormInformation}
//       />
//     </>
//   );
// }

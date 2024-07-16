import React from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';

import { hideModal } from '../../../store/actions';

import Typography from '../../../components/ui/typography/typography';
import Box from '../../../components/ui/box/box';
import {
  TEXT_ALIGN,
  TypographyVariant,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import NetworksForm from '../../settings/networks-tab/networks-form/networks-form';

export default function AddNetworkModal({
  showHeader = false,
  onEditNetwork = null,
  addNewNetwork = true,
  networkToEdit = null,
  stagedRpcUrls,
  stagedBlockExplorers,
  onExplorerUrlDeleted,
  onRpcUrlAdd,
  onBlockExplorerUrlAdd,
  onRpcUrlDeleted,
  onRpcUrlSelected,
  onExplorerUrlSelected,
  prevActionMode,
  networkFormInformation = {},
  setNetworkFormInformation = () => null,
}) {
  const dispatch = useDispatch();
  const t = useI18nContext();

  const closeCallback = () =>
    dispatch(hideModal({ name: 'ONBOARDING_ADD_NETWORK' }));

  const additionalProps = networkToEdit
    ? { selectedNetwork: networkToEdit }
    : {};

  return (
    <>
      {showHeader ? (
        <Box paddingTop={4}>
          <Typography
            variant={TypographyVariant.H4}
            align={TEXT_ALIGN.CENTER}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {t('onboardingMetametricsModalTitle')}
          </Typography>
        </Box>
      ) : null}
      <NetworksForm
        addNewNetwork={addNewNetwork}
        restrictHeight
        setActiveOnSubmit
        networksToRender={[]}
        cancelCallback={closeCallback}
        submitCallback={closeCallback}
        stagedRpcUrls={stagedRpcUrls}
        stagedBlockExplorers={stagedBlockExplorers}
        onExplorerUrlDeleted={onExplorerUrlDeleted}
        onRpcUrlAdd={onRpcUrlAdd}
        onBlockExplorerUrlAdd={onBlockExplorerUrlAdd}
        onRpcUrlDeleted={onRpcUrlDeleted}
        onRpcUrlSelected={onRpcUrlSelected}
        onExplorerUrlSelected={onExplorerUrlSelected}
        onEditNetwork={onEditNetwork}
        prevActionMode={prevActionMode}
        networkFormInformation={networkFormInformation}
        setNetworkFormInformation={setNetworkFormInformation}
        {...additionalProps}
      />
    </>
  );
}

AddNetworkModal.propTypes = {
  showHeader: PropTypes.bool,
  isNewNetworkFlow: PropTypes.bool,
  addNewNetwork: PropTypes.bool,
  onEditNetwork: PropTypes.func,
  networkToEdit: PropTypes.object,
  onRpcUrlAdd: PropTypes.func,
  onBlockExplorerUrlAdd: PropTypes.func,
  stagedRpcUrls: PropTypes.object,
  stagedBlockExplorers: PropTypes.object,
  onExplorerUrlDeleted: PropTypes.func,
  onRpcUrlDeleted: PropTypes.func,
  onRpcUrlSelected: PropTypes.func,
  prevActionMode: PropTypes.string,
  networkFormInformation: PropTypes.object,
  setNetworkFormInformation: PropTypes.func,
  onExplorerUrlSelected: PropTypes.func,
};

AddNetworkModal.defaultProps = {
  showHeader: false,
  isNewNetworkFlow: false,
  addNewNetwork: true,
  onEditNetwork: null,
  networkToEdit: null,
  prevActionMode: null,
  networkFormInformation: {},
  setNetworkFormInformation: () => null,
};

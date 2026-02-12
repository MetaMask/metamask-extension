import React, { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { TextVariant } from '../../../../helpers/constants/design-system';
import {
  Box,
  Popover,
  PopoverPosition,
  Label,
} from '../../../component-library';
import NetworkFilter from '../../assets/asset-list/network-filter';
import {
  getCurrentNetwork,
  getIsTokenNetworkFilterEqualCurrentNetwork,
} from '../../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { getImageForChainId } from '../../../../selectors/multichain';
import { NetworkFilterDropdown } from './network-filter-dropdown';

export const NetworkFilterImportToken = ({
  title,
  buttonDataTestId,
  openListNetwork,
  networkFilter,
  setNetworkFilter,
}: {
  title: string;
  buttonDataTestId: string;
  openListNetwork: () => void;
  networkFilter?: Record<string, boolean>;
  setNetworkFilter?: (network: Record<string, boolean>) => void;
}) => {
  const dropdown = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );
  const currentNetwork = useSelector(getCurrentNetwork);
  const currentNetworkImageUrl = getImageForChainId(currentNetwork?.chainId);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const allOpts = useMemo(
    () =>
      Object.keys(allNetworks || {}).reduce<Record<string, boolean>>(
        (acc, chain) => {
          acc[chain] = true;
          return acc;
        },
        {},
      ),
    [allNetworks],
  );

  const isCurrentNetwork = networkFilter
    ? Object.keys(networkFilter).length === 1 &&
      networkFilter[currentNetwork?.chainId]
    : isTokenNetworkFilterEqualCurrentNetwork;

  return (
    <Box>
      {title ? <Label variant={TextVariant.bodyMdMedium}>{title}</Label> : null}
      <NetworkFilterDropdown
        title={title}
        buttonDataTestId={buttonDataTestId}
        isCurrentNetwork={isCurrentNetwork}
        openListNetwork={openListNetwork}
        currentNetworkImageUrl={currentNetworkImageUrl ?? ''}
        allOpts={allOpts}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        dropdownRef={dropdown}
      />
      <Popover
        onClickOutside={() => setIsDropdownOpen(false)}
        isOpen={isDropdownOpen}
        position={PopoverPosition.BottomStart}
        referenceElement={dropdown.current}
        matchWidth
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
        }}
      >
        <NetworkFilter
          handleClose={() => setIsDropdownOpen(false)}
          handleFilterNetwork={(chainFilters) => {
            if (setNetworkFilter) {
              setNetworkFilter(chainFilters);
            }
          }}
          {...(networkFilter && {
            networkFilter,
          })}
        />
      </Popover>
    </Box>
  );
};

export default NetworkFilterImportToken;

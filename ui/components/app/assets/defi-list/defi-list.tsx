import React from 'react';
import AssetListControlBar from '../asset-list/asset-list-control-bar';
import { DefiProtocolListItem } from './defi-list-item';
import { useSelector } from 'react-redux';
import {
  getAllDefiPositionsForSelectedAddress,
  getCurrentNetwork,
} from '../../../../selectors';
import Spinner from '../../../ui/spinner';
import { Box } from '@material-ui/core';
import {
  AlignItems,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { Display } from '../../../../helpers/constants/design-system';
import { GroupedPositionsResponse } from '../../../../../shared/types/defi';

export const DefiList = () => {
  // const selectedAccount = useSelector(getSelectedAccount);
  // const [defiPositions, setDefiPositions] = useState<
  //   GroupedPositionsResponse[]
  // >([]);
  // const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //   console.log('selectedAccount', selectedAccount);

  //   if (selectedAccount?.address) {
  //     setIsLoading(true);
  //     const positions = fetchWithCache({
  //       url: `https://defi-services.metamask-institutional.io/defi-data/positions/${accountAddress}`,
  //       functionName: '#getGroupedPositions',
  //     }).then((positions) => {
  //       setDefiPositions(groupPositionsByProtocolAndChain(positions));
  //       setIsLoading(false);
  //     });
  //   } else {
  //     setDefiPositions([]);
  //     setIsLoading(false);
  //   }
  // }, [selectedAccount?.address]);

  const defiPositions: GroupedPositionsResponse[] = useSelector(
    getAllDefiPositionsForSelectedAddress,
  );
  const currentNetwork = useSelector(getCurrentNetwork);
  const chainId = parseInt(currentNetwork?.chainId.replace('0x', ''), 16);

  return (
    <>
      {!defiPositions ? (
        <Box
          paddingTop={6}
          paddingBottom={6}
          marginBottom={4}
          marginTop={4}
          display={Display.Flex}
          alignItems={AlignItems.center}
          flexDirection={FlexDirection.Column}
        >
          <Spinner />
        </Box>
      ) : (
        <>
          <AssetListControlBar showTokensLinks={true} />
          {defiPositions
            .filter((position) => position.chainId === chainId)
            .map((defiProtocolData) => (
              <DefiProtocolListItem
                key={`${defiProtocolData.chainId}-${defiProtocolData.protocolId}`}
                chain={`0x${defiProtocolData.chainId.toString(16)}`}
                protocolName={defiProtocolData.positions[0]!.name}
              iconUrl={defiProtocolData.positions[0]!.iconUrl}
              aggrigatedValues={defiProtocolData.aggregatedValues}
              positions={defiProtocolData}
            />
          ))}
        </>
      )}
    </>
  );
};
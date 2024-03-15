import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  ButtonPrimary,
  ButtonSecondary,
} from '../../../../components/component-library';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { BlockSize } from '../../../../helpers/constants/design-system';
import { t } from '../../../../../app/scripts/translate';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
  MetaMetricsSwapsEventSource,
} from '../../../../../shared/constants/metametrics';
import {
  AssetType,
  TokenStandard,
} from '../../../../../shared/constants/transaction';
import { startNewDraftTransaction } from '../../../../ducks/send';
import { INVALID_ASSET_TYPE } from '../../../../helpers/constants/error-keys';
import { SEND_ROUTE } from '../../../../helpers/constants/routes';
import { Asset } from '../asset-v2';

const AssetSendButton = ({
  asset,
  primary,
}: {
  asset: Asset;
  primary: boolean;
}) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const Button = primary ? ButtonPrimary : ButtonSecondary;
  return (
    <Button
      width={BlockSize.Full}
      padding={5}
      data-testid="asset-send-button"
      onClick={async () => {
        trackEvent({
          event: MetaMetricsEventName.NavSendButtonClicked,
          category: MetaMetricsEventCategory.Navigation,
          properties: {
            token_symbol: asset.symbol,
            location: MetaMetricsSwapsEventSource.TokenView,
            text: 'Send',
            chain_id: asset.chainId,
          },
        });
        try {
          await dispatch(
            startNewDraftTransaction({
              type: asset.type,
              details:
                asset.type === AssetType.native
                  ? undefined
                  : {
                      standard: TokenStandard.ERC20,
                      decimals: asset.decimals,
                      symbol: asset.symbol,
                      address: asset.address,
                    },
            }),
          );
          history.push(SEND_ROUTE);
        } catch (err: any) {
          if (!err?.message?.includes(INVALID_ASSET_TYPE)) {
            throw err;
          }
        }
      }}
    >
      {t('send')}
    </Button>
  );
};

export default AssetSendButton;

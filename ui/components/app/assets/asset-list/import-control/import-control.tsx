import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ButtonBase,
  ButtonBaseSize,
  IconName,
} from '../../../../component-library';
import {
  BackgroundColor,
  BorderColor,
  BorderStyle,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { showImportTokensModal } from '../../../../../store/actions';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

type AssetListControlBarProps = {
  showTokensLinks?: boolean;
};

const AssetListControlBar = ({ showTokensLinks }: AssetListControlBarProps) => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const isEvm = useSelector(getMultichainIsEvm);
  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  return (
    <ButtonBase
      className="asset-list-control-bar__button"
      data-testid="import-token-button"
      disabled={!shouldShowTokensLinks}
      size={ButtonBaseSize.Sm}
      startIconName={IconName.Add}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderColor={BorderColor.borderMuted}
      borderStyle={BorderStyle.solid}
      color={TextColor.textDefault}
      onClick={() => {
        dispatch(showImportTokensModal());
        trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.TokenImportButtonClicked,
          properties: {
            location: 'HOME',
          },
        });
      }}
    >
      {t('import')}
    </ButtonBase>
  );
};

export default AssetListControlBar;

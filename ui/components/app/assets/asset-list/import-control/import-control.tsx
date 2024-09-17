import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
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

const AssetListControlBar = () => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  return (
    <ButtonBase
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
      Import
    </ButtonBase>
  );
};

export default AssetListControlBar;

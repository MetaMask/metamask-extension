import React, { useCallback, useContext, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ASSET_ROUTE } from '../../../helpers/constants/routes';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  SUPPORT_LINK,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../shared/lib/ui-utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import NftsTab from '../../app/assets/nfts/nfts-tab';
import AssetList from '../../app/assets/asset-list';
import TransactionList from '../../app/transaction-list';
import { Tabs, Tab } from '../../ui/tabs';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-mmi)
import {
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  Display,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-mmi)
  JustifyContent,
} from '../../../helpers/constants/design-system';
///: END:ONLY_INCLUDE_IF
import {
  Box,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  ButtonLink,
  ButtonLinkSize,
  IconName,
  ///: END:ONLY_INCLUDE_IF
} from '../../component-library';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import InstitutionalHomeFooter from '../../../pages/home/institutional/institutional-home-footer';
///: END:ONLY_INCLUDE_IF
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewTabsProps = AccountOverviewCommonProps & {
  showTokens: boolean;
  showTokensLinks?: boolean;
  showNfts: boolean;
  showActivity: boolean;
};

export const AccountOverviewTabs = ({
  onTabClick,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  onSupportLinkClick,
  ///: END:ONLY_INCLUDE_IF
  defaultHomeActiveTabName,
  showTokens,
  showTokensLinks,
  showNfts,
  showActivity,
}: AccountOverviewTabsProps) => {
  const history = useHistory();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const tabProps = useMemo(
    () => ({
      activeClassName: 'account-overview__tab--active',
      className: 'account-overview__tab',
    }),
    [],
  );

  const getEventFromTabName = (tabName: string) => {
    switch (tabName) {
      case 'nfts':
        return MetaMetricsEventName.NftScreenOpened;
      case 'activity':
        return MetaMetricsEventName.ActivityScreenOpened;
      default:
        return MetaMetricsEventName.TokenScreenOpened;
    }
  };

  const handleTabClick = useCallback(
    (tabName: string) => {
      onTabClick(tabName);
      trackEvent({
        category: MetaMetricsEventCategory.Home,
        event: getEventFromTabName(tabName),
      });
    },
    [onTabClick],
  );

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  // The style in activity screen for support is different
  const activitySupportDisplayStyle =
    defaultHomeActiveTabName === 'activity'
      ? {
          justifyContent: JustifyContent.center,
          paddingLeft: 0,
          marginTop: 4,
          marginBottom: 4,
        }
      : {
          justifyContent: JustifyContent.flexStart,
          paddingLeft: 4,
          marginTop: 0,
          marginBottom: 4,
        };
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  const NeedHelpButtonLink = React.memo((props: Record<string, unknown>) => (
    <ButtonLink
      size={ButtonLinkSize.Md}
      startIconName={IconName.MessageQuestion}
      data-testid="need-help-link"
      href={SUPPORT_LINK}
      display={Display.Flex}
      onClick={onSupportLinkClick}
      externalLink
      {...props}
    >
      {t('needHelpLinkText')}
    </ButtonLink>
  ));
  ///: END:ONLY_INCLUDE_IF

  return (
    <Box style={{ flexGrow: '1' }}>
      <Tabs
        defaultActiveTabKey={defaultHomeActiveTabName}
        onTabClick={handleTabClick}
        tabsClassName="account-overview__tabs"
      >
        {showTokens && (
          <Tab
            name={t('tokens')}
            tabKey="tokens"
            data-testid="account-overview__asset-tab"
            {...tabProps}
          >
            <Box marginTop={2}>
              <AssetList
                showTokensLinks={showTokensLinks ?? true}
                onClickAsset={(asset: string) =>
                  history.push(`${ASSET_ROUTE}/${asset}`)
                }
              />
              {
                ///: BEGIN:ONLY_INCLUDE_IF(build-main)
                <NeedHelpButtonLink
                  justifyContent={JustifyContent.flexStart}
                  paddingLeft={4}
                  marginBottom={4}
                ></NeedHelpButtonLink>
                ///: END:ONLY_INCLUDE_IF
              }
            </Box>
          </Tab>
        )}

        {showNfts && (
          <Tab
            name={t('nfts')}
            tabKey="nfts"
            data-testid="account-overview__nfts-tab"
            {...tabProps}
          >
            <NftsTab />
            {
              ///: BEGIN:ONLY_INCLUDE_IF(build-main)
              <NeedHelpButtonLink
                justifyContent={JustifyContent.flexStart}
                paddingLeft={4}
                marginBottom={4}
              ></NeedHelpButtonLink>
              ///: END:ONLY_INCLUDE_IF
            }
          </Tab>
        )}

        {showActivity && (
          <Tab
            name={t('activity')}
            tabKey="activity"
            data-testid="account-overview__activity-tab"
            {...tabProps}
          >
            <TransactionList boxProps={{ paddingTop: 4 }} />
            {
              ///: BEGIN:ONLY_INCLUDE_IF(build-main)
              <NeedHelpButtonLink
                justifyContent={JustifyContent.center}
                marginBottom={4}
                marginTop={4}
              ></NeedHelpButtonLink>
              ///: END:ONLY_INCLUDE_IF
            }
          </Tab>
        )}
      </Tabs>
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        <InstitutionalHomeFooter
          activitySupportDisplayStyle={activitySupportDisplayStyle}
        />
        ///: END:ONLY_INCLUDE_IF
      }
    </Box>
  );
};

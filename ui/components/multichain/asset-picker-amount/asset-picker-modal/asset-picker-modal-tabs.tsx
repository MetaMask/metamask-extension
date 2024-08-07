import React, { ReactElement } from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Tab, Tabs } from '../../../ui/tabs';

export enum TabName {
  TOKENS = 'tokens',
  NFTS = 'nfts',
}

export const AssetPickerModalTabs = ({
  defaultActiveTabKey = TabName.TOKENS,
  children,
  visibleTabs = [TabName.TOKENS, TabName.NFTS],
}: {
  defaultActiveTabKey?: TabName;
  children: ReactElement[];
  visibleTabs?: TabName[];
}) => {
  const t = useI18nContext();

  if (visibleTabs.length > 1) {
    return (
      <Tabs
        defaultActiveTabKey={defaultActiveTabKey}
        tabsClassName="modal-tab__tabs"
      >
        {visibleTabs.map((tabName) => {
          return (
            <Tab
              key={tabName}
              activeClassName="modal-tab__tab--active"
              className="modal-tab__tab"
              name={t(tabName)}
              tabKey={tabName}
            >
              {children.find(({ key }) => key === tabName)}
            </Tab>
          );
        })}
      </Tabs>
    );
  }

  return (
    <>
      {visibleTabs.map((tabName) =>
        children.find(({ key }) => key === tabName),
      )}
    </>
  );
};

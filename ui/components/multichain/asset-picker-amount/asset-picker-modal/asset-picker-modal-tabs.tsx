import React, { ReactElement, useState } from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Tab, Tabs } from '../../../ui/tabs';

export enum TabName {
  TOKENS = 'tokens',
  NFTS = 'nfts',
}

/**
 * AssetPickerModalTabs component.
 *
 * @param props
 * @param props.defaultActiveTabKey - The key of the default active tab.
 * @param props.children - The child components to be displayed within tabs.
 * @param props.visibleTabs - A list of visible tabs.
 * @returns A Tabs instance with the provided visible children.
 */
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
  const [activeTab, setActiveTab] = useState(defaultActiveTabKey);

  if (visibleTabs.length > 1) {
    return (
      <Tabs
        activeTab={activeTab}
        onTabClick={setActiveTab}
        tabListProps={{ className: 'px-4' }}
      >
        {visibleTabs.map((tabName) => {
          return (
            <Tab
              key={tabName}
              name={t(tabName)}
              tabKey={tabName}
              className="flex-1"
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

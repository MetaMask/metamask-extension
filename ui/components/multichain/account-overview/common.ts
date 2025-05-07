import { AccountOverviewTabKey } from '../../../../shared/constants/app-state';

export type AccountOverviewCommonProps = {
  onTabClick: (tabName: string) => void;
  setBasicFunctionalityModalOpen: () => void;
  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  onSupportLinkClick: () => void;
  ///: END:ONLY_INCLUDE_IF
  defaultHomeActiveTabName: AccountOverviewTabKey | null;
};

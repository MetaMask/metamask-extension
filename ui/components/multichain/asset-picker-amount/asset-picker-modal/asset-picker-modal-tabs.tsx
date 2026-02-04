import React, { ReactElement } from 'react';

export enum TabName {
  TOKENS = 'tokens',
}

/**
 * AssetPickerModalTabs component - renders only the tokens tab content.
 *
 * @param props
 * @param props.children - The child components to be displayed.
 * @returns The tokens tab content.
 */
export const AssetPickerModalTabs = ({
  children,
}: {
  children: ReactElement[];
}) => {
  return <>{children.find(({ key }) => key === TabName.TOKENS)}</>;
};

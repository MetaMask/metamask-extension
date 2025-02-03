import { Box, IconName, Text } from '../../component-library';

export type DelineatorProps = {
  children?: React.ReactNode;
  headerComponent: React.ReactElement<typeof Text>;
  iconName?: IconName;
  isCollapsible?: boolean;
  isExpanded?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  onExpandChange?: (isExpanded: boolean) => void;
  type?: DelineatorType;
  wrapperBoxProps?: React.ComponentProps<typeof Box>;
  contentBoxProps?: React.ComponentProps<typeof Box>;
};

export enum DelineatorType {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Error = 'error',
  Default = 'default',
}

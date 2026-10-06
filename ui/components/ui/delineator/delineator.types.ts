import { Box } from '../../component-library/box/box';
import { IconName } from '../../component-library/icon/icon.types';
import { Text } from '../../component-library/text/text';

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

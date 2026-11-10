import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Box } from '../../../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { getEnvironmentType } from '../../../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../../../shared/constants/app';

type AssetControlsContextValue = {
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
  close: () => void;
};

const AssetControlsContext = createContext<AssetControlsContextValue | null>(
  null,
);

export const useAssetControls = () => {
  const context = useContext(AssetControlsContext);
  if (!context) {
    throw new Error('Asset controls must render inside AssetControls');
  }
  return context;
};

export const useAssetControl = (id: string) => {
  const { isOpen, toggle, close } = useAssetControls();
  return {
    isOpen: isOpen(id),
    toggle: () => toggle(id),
    close,
  };
};

export const useIsControlBarFullScreen = () => {
  const windowType = getEnvironmentType();
  return (
    windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
    windowType !== ENVIRONMENT_TYPE_POPUP
  );
};

export const controlPopoverStyle = (
  isFullScreen: boolean,
  minWidth: string,
) => ({
  zIndex: 10,
  display: 'flex' as const,
  flexDirection: 'column' as const,
  padding: 0,
  minWidth: isFullScreen ? minWidth : '',
});

type AssetControlsProps = {
  children: React.ReactNode;
  'data-testid'?: string;
};

/**
 * The asset control row. The network filter sits at the start and
 * {@link AssetControlsActions} sits at the end. Only one menu is open at a
 * time.
 *
 * @param props - The component props.
 * @param props.children - The filter and the actions group.
 * @param props.data-testid
 */
export const AssetControls = ({
  children,
  'data-testid': dataTestId,
}: AssetControlsProps) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);
  const close = useCallback(() => {
    setOpenId(null);
  }, []);
  const isOpen = useCallback((id: string) => openId === id, [openId]);
  const value = useMemo(
    () => ({ isOpen, toggle, close }),
    [close, isOpen, toggle],
  );

  return (
    <AssetControlsContext.Provider value={value}>
      <Box
        className="asset-list-control-bar pt-4 pb-1"
        marginLeft={4}
        marginRight={4}
        data-testid={dataTestId}
      >
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          {children}
        </Box>
      </Box>
    </AssetControlsContext.Provider>
  );
};

type AssetControlsActionsProps = {
  children: React.ReactNode;
};

/**
 * The action buttons at the end of the asset control row.
 *
 * @param props - The component props.
 * @param props.children - Sort, options, and refresh buttons.
 */
export const AssetControlsActions = ({
  children,
}: AssetControlsActionsProps) => (
  <Box
    display={Display.Flex}
    justifyContent={JustifyContent.flexEnd}
    alignItems={AlignItems.center}
  >
    {children}
  </Box>
);

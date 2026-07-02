import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Content,
  Footer,
  Page,
} from '../../../../components/multichain/pages/page';
import { HardwareHdPathOption } from '../../../../components/multichain-accounts/hardware-hd-path-option';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import type { SelectHdPathPageProps } from './select-hd-path-page.types';

/**
 * Lets the user choose an HD derivation path for a hardware wallet.
 *
 * @param options - Component props.
 * @param options.hdPaths - Available HD path options for the device.
 * @param options.selectedPath - Currently selected HD derivation path.
 * @param options.onPathChange - Called when the user confirms a path selection.
 * @param options.onBack - Called when the user navigates back.
 */
export const SelectHdPathPage = ({
  hdPaths,
  selectedPath,
  onPathChange,
  onBack,
}: SelectHdPathPageProps) => {
  const t = useI18nContext();
  const [pendingPath, setPendingPath] = useState(selectedPath);

  useEffect(() => {
    setPendingPath(selectedPath);
  }, [selectedPath]);

  const handlePathSelect = useCallback((path: string) => {
    setPendingPath(path);
  }, []);

  const handleContinue = useCallback(() => {
    onPathChange(pendingPath);
  }, [onPathChange, pendingPath]);

  const hdPathOptions = useMemo(
    () =>
      hdPaths.map((hdPath) => (
        <HardwareHdPathOption
          key={hdPath.value}
          label={hdPath.name}
          isSelected={hdPath.value === pendingPath}
          onSelect={() => handlePathSelect(hdPath.value)}
        />
      )),
    [handlePathSelect, hdPaths, pendingPath],
  );

  return (
    <Page className="mx-auto h-full min-h-0 w-full max-w-[460px] overflow-hidden sm:max-w-[520px]">
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        className="min-h-14 shrink-0 px-1 py-2"
      >
        <ButtonIcon
          size={ButtonIconSize.Md}
          iconName={IconName.ArrowLeft}
          ariaLabel={t('back') as string}
          onClick={onBack}
          data-testid="select-hd-path-page-back-button"
        />
        <Box className="w-10 shrink-0" />
      </Box>
      <Content className="min-h-0 flex-1 gap-6 overflow-hidden">
        <Text
          variant={TextVariant.HeadingLg}
          className="shrink-0 md:text-s-heading-lg md:leading-s-heading-lg md:tracking-s-heading-lg"
        >
          {t('selectHdPath')}
        </Text>
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={3}
          className="min-h-0 w-full flex-1 overflow-y-auto"
        >
          {hdPathOptions}
        </Box>
      </Content>
      <Footer className="shrink-0">
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          onClick={handleContinue}
          data-testid="select-hd-path-page-continue-button"
        >
          {t('continue')}
        </Button>
      </Footer>
    </Page>
  );
};

import React from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  Box,
  ButtonIconSize,
  TextFieldSearch,
  TextFieldSearchSize,
} from '../../../../component-library';
import { BlockSize } from '../../../../../helpers/constants/design-system';

const NetworkListSearch = ({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) => {
  const t = useI18nContext();

  return (
    <Box paddingLeft={4} paddingRight={4} paddingBottom={4} paddingTop={0}>
      <TextFieldSearch
        size={TextFieldSearchSize.Lg}
        width={BlockSize.Full}
        placeholder={t('search')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        clearButtonOnClick={() => setSearchQuery('')}
        clearButtonProps={{
          size: ButtonIconSize.Sm,
        }}
        inputProps={{ autoFocus: true }}
        className={undefined}
        endAccessory={undefined}
      />
    </Box>
  );
};

export default NetworkListSearch;

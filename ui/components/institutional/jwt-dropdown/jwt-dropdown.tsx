import React from 'react';
import Dropdown from '../../ui/dropdown';
import { TextColor } from '../../../helpers/constants/design-system';
import { Box, Text } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

type JwtDropdownProps = {
  jwtList: string[];
  currentJwt: string;
  onChange: (value: string) => void;
};

const JwtDropdown: React.FC<JwtDropdownProps> = ({
  currentJwt,
  jwtList,
  onChange,
}) => {
  const t = useI18nContext();

  return (
    <Box>
      <Text
        padding={1}
        color={TextColor.textDefault}
        className="custody-search-jwt__select-title"
      >
        {t('selectJWT')}
      </Text>
      <Dropdown
        data-testid="jwt-dropdown"
        className="custody-search-jwt__select"
        selectedOption={currentJwt}
        options={[
          ...(jwtList.find((item) => item === currentJwt)
            ? []
            : [
                {
                  value: currentJwt,
                  name:
                    currentJwt.length > 9
                      ? `...${currentJwt.slice(-9)}`
                      : currentJwt,
                },
              ]),
          ...jwtList.map((text) => {
            return {
              value: text,
              name: `...${text?.slice(-9)}`,
            };
          }),
        ]}
        onChange={(opt) => onChange(opt.value)}
      />
    </Box>
  );
};

export default JwtDropdown;

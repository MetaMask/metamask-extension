import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getMetaMaskAccountsOrdered } from '../../selectors';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import FoxIcon from '../../components/ui/fox-icon/FoxIcon';
import Dropdown from '../../components/ui/dropdown';
import Box from '../../components/ui/box/box';
import {
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { Text } from '../../components/component-library';
import { EditorSelectionOptions, POLISH_OPTIONS } from './constants';
import Button from '../../components/ui/button';
import { FOX_COLOR_PALETTE } from '../../helpers/utils/generative-color';

const checkValueExists = (arr, val) => {
  return arr.some((option) => option.value === val);
};

export default function FoxSelection() {
  const history = useHistory();
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const state = useSelector((state) => state);

  // internal state
  const [selectedAccountIndex, setSelectedAccountIndex] = useState('0');

  const [shouldShuffle, setShouldShuffle] = useState(false);
  const [accountOptions, setAccountOptions] = useState([]);
  const [editorSelection, setEditorSelection] = useState('1');
  const [foxColorSchema, setFoxColorSchema] = useState(
    Object.values(FOX_COLOR_PALETTE),
  );

  useEffect(() => {
    const newOptions = [];
    accounts.forEach((account, index) => {
      newOptions.push({
        value: index.toString(),
        name: `${account.name}: ${account.address}`,
      });
    });
    setAccountOptions(newOptions);
  }, [accounts]);

  const [polishOption, setPolishOption] = useState(
    accounts[Number(selectedAccountIndex)].colorSchema
      ? 'previousSelected'
      : 'generative',
  );

  const [polishOptions, setPolishOptions] = useState(POLISH_OPTIONS);

  useEffect(() => {
    if (
      // new account has previous selected fox
      accounts[Number(selectedAccountIndex)].colorSchema &&
      !checkValueExists(polishOptions, 'previousSelected')
    ) {
      polishOptions.push({
        value: 'previousSelected',
        name: 'My previous selection',
      });
      setPolishOptions(polishOptions);
      setPolishOption('previousSelected');
    }
    if (
      // new account has no previous selected fox
      !accounts[Number(selectedAccountIndex)].colorSchema &&
      checkValueExists(polishOptions, 'previousSelected')
    ) {
      polishOptions.pop();
      setPolishOptions(polishOptions);
    }
  }, [selectedAccountIndex, accounts, setPolishOptions]);

  const handleResetToPrevious = () => {
    setPolishOption('previousSelected');
  };

  const handleCancel = () => {
    if (accounts[Number(selectedAccountIndex)].colorSchema) {
      setPolishOption('previousSelected');
    } else {
      setPolishOption('default');
    }
  };

  const handleNewColorSettled = (callbackFromFoxIcon) => {
    setFoxColorSchema(callbackFromFoxIcon);
  };

  const handleSaveSelection = () => {
    console.log(foxColorSchema);
  };

  const handleShuffle = () => {
    setShouldShuffle(!shouldShuffle);
  };

  return (
    <div className={classnames('main-container customize-fox-page')}>
      <div className="customize-fox-page__header">
        <div className="customize-fox-page__header__title">
          You are rewarded to color the address with an unique fox
          <img src="./images/empower.svg" alt="" />
        </div>
        <div
          className="settings-page__header__title-container__close-button"
          onClick={() => {
            history.push(getMostRecentOverviewPage(state));
          }}
        />
      </div>
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        className="customize-fox-page__content"
      >
        <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN}>
          <div>
            <Text
              variant={TextVariant.bodySmBold}
              as="h6"
              color={TextColor.textDefault}
            >
              Your ethereum address:
            </Text>
            <Text
              variant={TextVariant.bodyXs}
              as="h6"
              color={TextColor.textMuted}
              marginBottom={1}
            >
              Select an address you want to have a customized fox with:
            </Text>
          </div>
          <Dropdown
            options={accountOptions}
            selectedOption={selectedAccountIndex}
            onChange={(option) => {
              setSelectedAccountIndex(option);
              setPolishOption(
                accounts[Number(option)].colorSchema
                  ? 'previousSelected'
                  : 'generative',
              );
            }}
          />
          <div style={{ marginTop: '32px' }}>
            <Text
              variant={TextVariant.bodySmBold}
              as="h6"
              color={TextColor.textDefault}
            >
              Customization option:
            </Text>
            <Text
              variant={TextVariant.bodyXs}
              as="h6"
              color={TextColor.textMuted}
              marginBottom={1}
            >
              The default option is a piece of generative art or your previously
              selected one. You can also choose between AI and editor's
              selections 🫶
            </Text>
            <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW}>
              <Dropdown
                options={polishOptions}
                selectedOption={polishOption}
                style={{ width: '200px' }}
                onChange={(option) => {
                  setPolishOption(option);
                  if (polishOption !== 'editorSelection') {
                    setEditorSelection('1');
                  }
                }}
              />
              {polishOption === 'editorSelection' && (
                <Dropdown
                  options={EditorSelectionOptions}
                  selectedOption={editorSelection}
                  style={{ width: '220px', marginLeft: '24px' }}
                  onChange={(option) => setEditorSelection(option)}
                />
              )}
            </Box>
          </div>
        </Box>
        <Box
          marginTop={8}
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.spaceBetween}
          flexDirection={FLEX_DIRECTION.ROW}
        >
          <div style={{ border: '1.5px solid #bbc0c5' }}>
            <FoxIcon
              address={accounts[Number(selectedAccountIndex)].address}
              settledColorSchema={
                accounts[Number(selectedAccountIndex)].colorSchema
              }
              size={280}
              colorPaletteType={polishOption}
              editorSelection={Number(editorSelection)}
              handleNewColorSettled={handleNewColorSettled}
              shouldShuffle={shouldShuffle}
            />
          </div>

          <Box marginLeft={4}>
            {accounts[Number(selectedAccountIndex)].colorSchema && (
              <Button type="secondary" onClick={() => handleResetToPrevious()}>
                <Text
                  variant={TextVariant.bodySm}
                  as="h6"
                  color={TextColor.primaryDefault}
                >
                  Reset to my previous selection 🙏🏻
                </Text>
              </Button>
            )}
            <Box marginTop={4}>
              <Button type="secondary" onClick={() => handleCancel()}>
                <Text
                  variant={TextVariant.bodySm}
                  as="h6"
                  color={TextColor.primaryDefault}
                >
                  Cancel and I will choose another time 👋
                </Text>
              </Button>
              <Text variant={TextVariant.bodyXs} color={TextColor.textMuted}>
                (This will give you default fox look or your previous selected
                fox)
              </Text>
            </Box>
            {(polishOption === 'generative' || polishOption === 'ai') && (
              <Box marginTop={4}>
                <Button type="tertiary" onClick={() => handleShuffle()}>
                  <Text
                    variant={TextVariant.bodySm}
                    as="h6"
                    color={TextColor.overlayInverse}
                  >
                    Shuffle to see more ✨
                  </Text>
                </Button>
              </Box>
            )}
            <Box marginTop={4}>
              <Button type="primary" onClick={() => handleSaveSelection()}>
                <Text
                  variant={TextVariant.bodySm}
                  as="h6"
                  color={TextColor.overlayInverse}
                >
                  Save this fox for me 😗
                </Text>
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </div>
  );
}

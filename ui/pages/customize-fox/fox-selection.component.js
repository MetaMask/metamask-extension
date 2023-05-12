import React, { useState, useEffect, useRef, useCallback } from 'react';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getMetaMaskAccountsOrdered,
  getSelectedAddress,
} from '../../selectors';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import FoxIcon from '../../components/ui/fox-icon/FoxIcon';
import Dropdown from '../../components/ui/dropdown';
import Box from '../../components/ui/box/box';
import {
  AlignItems,
  BLOCK_SIZES,
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { Text } from '../../components/component-library';
import Button from '../../components/ui/button';
import { FOX_COLOR_PALETTE } from '../../helpers/utils/generative-color';
import { setAccountColor } from '../../store/actions';
import { EditorSelectionOptions, POLISH_OPTIONS } from './constants';
import { downloadBlob } from '../../helpers/utils/color-util';

const checkValueExists = (arr, val) => {
  return arr.some((option) => option.value === val);
};

export default function FoxSelection() {
  const history = useHistory();
  const dispatch = useDispatch();
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const state = useSelector((state) => state);

  const selectedAddress = useSelector(getSelectedAddress);
  const initialSelectedIndex = accounts.findIndex(
    (account) => account.address === selectedAddress,
  );
  // internal state
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(
    initialSelectedIndex.toString(),
  );

  useEffect(() => {
    setSelectedAccountIndex(initialSelectedIndex.toString());
  }, [initialSelectedIndex]);

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

  useEffect(() => {
    setPolishOption(
      accounts[Number(selectedAccountIndex)].colorSchema
        ? 'previousSelected'
        : 'generative',
    );
  }, [selectedAccountIndex, accounts]);

  const [polishOptions, setPolishOptions] = useState(POLISH_OPTIONS);

  useEffect(() => {
    if (
      // new account has previous selected fox
      accounts[Number(selectedAccountIndex)].colorSchema &&
      !checkValueExists(polishOptions, 'previousSelected')
    ) {
      polishOptions.push({
        value: 'previousSelected',
        name: 'Previous selection',
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
    dispatch(
      setAccountColor(accounts[selectedAccountIndex].address, foxColorSchema),
    );
  };

  const handleShuffle = () => {
    setShouldShuffle(!shouldShuffle);
  };

  const svgRef = useRef();

  const handleDownSvg = useCallback(() => {
    const svg = svgRef.current.innerHTML;
    const currentAccount = accounts[selectedAccountIndex];
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    downloadBlob(blob, `${currentAccount.address}.svg`);
  }, [accounts, selectedAccountIndex]);

  return (
    <div className={classnames('main-container customize-fox-page')}>
      <div className="customize-fox-page__header">
        <div className="customize-fox-page__header__title">
          Customize a fox
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
              color={TextColor.textAlternative}
              marginBottom={1}
            >
              Select the account for your customized fox
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
              color={TextColor.textAlternative}
              marginBottom={1}
            >
              The default option is a piece of generative art or your previous
              selection. You can also choose between AI and editor's selections
              🫶
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
          marginTop={12}
          display={DISPLAY.FLEX}
          flexDirection={[FLEX_DIRECTION.COLUMN, FLEX_DIRECTION.ROW]}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          gap={12}
        >
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
            svgRef={svgRef}
          />

          <Box
            marginLeft={12}
            marginRight={12}
            width={[BLOCK_SIZES.FULL, BLOCK_SIZES.ONE_THIRD]}
          >
            {accounts[Number(selectedAccountIndex)].colorSchema && (
              <Button type="secondary" onClick={() => handleResetToPrevious()}>
                <Text
                  variant={TextVariant.bodySm}
                  as="h6"
                  color={TextColor.primaryDefault}
                >
                  Use previous selection 🙏🏻
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
                  Do this later 👋
                </Text>
              </Button>
            </Box>
            {(polishOption === 'generative' || polishOption === 'ai') && (
              <Box marginTop={4}>
                <Button type="tertiary" onClick={() => handleShuffle()}>
                  <Text
                    variant={TextVariant.bodySm}
                    as="h6"
                    color={TextColor.overlayInverse}
                  >
                    Shuffle ✨
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
                  Save this fox 😗
                </Text>
              </Button>
            </Box>
            <Box marginTop={4}>
              <Button type="primary" onClick={() => handleDownSvg()}>
                <Text
                  variant={TextVariant.bodySm}
                  as="h6"
                  color={TextColor.overlayInverse}
                >
                  Download my fox ✅
                </Text>
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </div>
  );
}

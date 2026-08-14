import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Container } from '@metamask/snaps-sdk/jsx';

import { isEqual } from 'lodash';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { ThemeProvider } from '@mui/material/styles';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import { getInterface } from '../../../../selectors';
import { Box } from '../../../component-library';

import { SnapInterfaceContextProvider } from '../../../../contexts/snaps';
import PulseLoader from '../../../ui/pulse-loader';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import {
  mapToExtensionCompatibleColor,
  mapToTemplate,
  muiPickerTheme,
} from './utils';
import { COMPONENT_MAPPING } from './components';

// Renders snap UI with scroll refs passed as props so mapToTemplate receives a
// real RefObject without crossing a parent useMemo closure (React Compiler safe).
const SnapUIContent = ({
  content,
  onCancel,
  useFooter,
  promptLegacyProps,
  t,
  backgroundColor,
  scrollableContainerRef,
  setScroll,
}) => {
  const sections = mapToTemplate({
    map: {},
    element: content,
    onCancel,
    useFooter,
    promptLegacyProps,
    t,
    contentBackgroundColor: backgroundColor,
    componentMap: COMPONENT_MAPPING,
    setScroll,
    scrollableContainerRef,
  });

  return <MetaMaskTemplateRenderer sections={sections} />;
};

SnapUIContent.propTypes = {
  content: PropTypes.object.isRequired,
  onCancel: PropTypes.func,
  useFooter: PropTypes.bool,
  promptLegacyProps: PropTypes.object,
  t: PropTypes.func.isRequired,
  backgroundColor: PropTypes.string,
  scrollableContainerRef: PropTypes.object.isRequired,
  setScroll: PropTypes.func.isRequired,
};

// Component for tracking the number of re-renders
// DO NOT USE IN PRODUCTION
// Increments in layout effect (not during render) for React Compiler.
// `renderSignal` must change with interface content so this child re-runs.
const PerformanceTracker = ({ renderSignal }) => {
  const elementRef = useRef(null);

  useLayoutEffect(() => {
    const node = elementRef.current;
    if (!node) {
      return;
    }
    const previous = Number(node.getAttribute('data-renders') || '0');
    node.setAttribute('data-renders', String(previous + 1));
  }, [renderSignal]);

  return <span ref={elementRef} data-testid="performance" data-renders="0" />;
};

PerformanceTracker.propTypes = {
  renderSignal: PropTypes.object.isRequired,
};

// Component that maps Snaps UI JSON format to MetaMask Template Renderer format
const SnapUIRendererComponent = ({
  snapId,
  isLoading = false,
  // This is a workaround while we have the prompt dialog type since we can't inject the SnapUIRenderer in the template renderer.
  isPrompt = false,
  inputValue,
  onInputChange,
  placeholder,
  interfaceId,
  useFooter = false,
  onCancel,
  contentBackgroundColor,
  PERF_DEBUG,
}) => {
  const scrollableContainerRef = useRef(null);
  const scrollRef = useRef(0);

  const setScroll = useCallback(() => {
    if (scrollableContainerRef.current) {
      scrollRef.current = scrollableContainerRef.current.scrollTop;
    }
  }, []);

  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);

  const interfaceState = useSelector(
    (state) => getInterface(state, interfaceId),
    // We only want to update the state if the content has changed.
    // We do this to avoid useless re-renders.
    (oldState, newState) => isEqual(oldState?.content, newState?.content),
  );

  useEffect(() => {
    scrollableContainerRef.current?.scrollTo?.(0, scrollRef.current);
  }, [interfaceState?.content]);

  const rawContent = interfaceState?.content;
  const content =
    rawContent?.type === 'Container' || !rawContent
      ? rawContent
      : Container({ children: rawContent });

  const promptLegacyProps = useMemo(
    () =>
      isPrompt
        ? {
            inputValue,
            onInputChange,
            placeholder,
          }
        : undefined,
    [inputValue, onInputChange, placeholder, isPrompt],
  );

  const backgroundColor =
    contentBackgroundColor ??
    mapToExtensionCompatibleColor(content?.props?.backgroundColor) ??
    BackgroundColor.backgroundAlternative;

  const pickerLocaleText = useMemo(
    () => ({
      clearButtonLabel: t('clear'),
      cancelButtonLabel: t('cancel'),
      okButtonLabel: t('ok').toUpperCase(),
    }),
    [t],
  );

  if (isLoading || !content) {
    return (
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        height={BlockSize.Full}
        width={BlockSize.Full}
      >
        <PulseLoader />
      </Box>
    );
  }

  const { state: initialState } = interfaceState;

  return (
    <SnapInterfaceContextProvider
      snapId={snapId}
      interfaceId={interfaceId}
      initialState={initialState}
    >
      <ThemeProvider theme={muiPickerTheme}>
        <LocalizationProvider
          dateAdapter={AdapterLuxon}
          adapterLocale={locale}
          localeText={pickerLocaleText}
        >
          <Box
            className="snap-ui-renderer__content"
            height={BlockSize.Full}
            backgroundColor={backgroundColor}
            style={{
              overflowY: 'auto',
            }}
          >
            <SnapUIContent
              content={content}
              onCancel={onCancel}
              useFooter={useFooter}
              promptLegacyProps={promptLegacyProps}
              t={t}
              backgroundColor={backgroundColor}
              scrollableContainerRef={scrollableContainerRef}
              setScroll={setScroll}
            />
            {PERF_DEBUG && <PerformanceTracker renderSignal={content} />}
          </Box>
        </LocalizationProvider>
      </ThemeProvider>
    </SnapInterfaceContextProvider>
  );
};

// SnapUIRenderer is memoized to avoid useless re-renders if one of the parents element re-renders.
export const SnapUIRenderer = memo(
  SnapUIRendererComponent,
  (prevProps, nextProps) => isEqual(prevProps, nextProps),
);

SnapUIRendererComponent.propTypes = {
  snapId: PropTypes.string,
  isLoading: PropTypes.bool,
  isPrompt: PropTypes.bool,
  inputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  placeholder: PropTypes.string,
  interfaceId: PropTypes.string,
  useFooter: PropTypes.bool,
  onCancel: PropTypes.func,
  contentBackgroundColor: PropTypes.string,
  PERF_DEBUG: PropTypes.bool, // DO NOT USE THIS IN PRODUCTION
};

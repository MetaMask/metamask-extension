/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/core/bridge.mjs
// Typed bridge between the WebView IIFE and React Native.
//
// Wraps the same window.ReactNativeWebView.postMessage(...) call shape that
// legacy chartLogic.js's sendToReactNative() uses, so the RN-side
// parseWebViewMessage in AdvancedChart.types.ts decodes our messages without
// any change to its consumers.
function safeStringify(value) {
    try {
        return JSON.stringify(value) ?? 'Unknown error';
    }
    catch {
        return String(value);
    }
}
/**
 * Posts a typed message to React Native via window.ReactNativeWebView.
 * Equivalent to legacy `sendToReactNative(type, payload)` at chartLogic.js
 * line ~98. Silently no-ops when window.ReactNativeWebView is absent (e.g.
 * during unit tests in a jsdom environment without the RN bridge stub).
 *
 * @param type - The outbound message type tag.
 * @param payload - The payload associated with the message type.
 */
function postToRN(type, payload) {
    const bridge = window.ReactNativeWebView;
    if (!bridge) {
        return;
    }
    try {
        bridge.postMessage(JSON.stringify({ type, payload }));
    }
    catch {
        // postMessage / JSON.stringify failure: nothing to do — the WebView
        // cannot inform RN of its own bridge failure.
    }
}
/**
 * Reports a runtime error to React Native via the ERROR channel. Matches the
 * legacy `sendToReactNative('ERROR', { message })` pattern used throughout
 * chartLogic.js.
 *
 * @param error - The error (or arbitrary thrown value) to report.
 */
function reportErrorToRN(error) {
    let message;
    if (error instanceof Error) {
        message = error.message;
    }
    else if (typeof error === 'string') {
        message = error;
    }
    else {
        message = safeStringify(error);
    }
    postToRN('ERROR', { message });
}
/**
 * Registers a single inbound listener. React Native posts JSON strings via
 * webView.postMessage; the WebView receives them on window 'message' on iOS
 * and document 'message' on Android (see chartLogic.js line ~400). We
 * subscribe to both so consumers don't have to.
 *
 * The returned function unsubscribes — useful for tests; the real bundle
 * subscribes once at bootstrap and never unsubscribes.
 *
 * @param handler - Callback invoked with each well-formed inbound message.
 * @returns A function that removes the registered listeners.
 */
function onFromRN(handler) {
    const dispatch = (event) => {
        // RN WebView inline HTML: native bridge messages arrive with an empty
        // or "null" origin. Reject messages from real web origins.
        const { origin } = event;
        if (origin && origin !== 'null' && !origin.startsWith('file:')) {
            return;
        }
        let parsed;
        try {
            parsed =
                typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        }
        catch (parseError) {
            reportErrorToRN(parseError);
            return;
        }
        if (!parsed || typeof parsed !== 'object') {
            return;
        }
        const candidate = parsed;
        if (typeof candidate.type !== 'string') {
            return;
        }
        // Trusting the type narrowing here is fine because messages/handler.ts
        // re-validates via a switch on candidate.type before dispatching to a
        // typed handler. Phase 1 only routes SET_THEME_COLORS, but the listener
        // forwards every well-formed message so the handler can decide.
        handler(parsed);
    };
    // iOS posts arrive on window; Android posts arrive on document. Subscribe
    // to both to match legacy chartLogic.js handleMessage wiring.
    window.addEventListener('message', dispatch);
    document.addEventListener('message', dispatch);
    return () => {
        window.removeEventListener('message', dispatch);
        document.removeEventListener('message', dispatch);
    };
}
//# sourceMappingURL=bridge.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/core/state.mjs
// Module-local state container for the AdvancedChart WebView.
//
// Replaces the legacy `window.chartWidget`, `window.isChartReady`,
// `window.currentSymbol`, etc. (chartLogic.js lines ~21-60). Module-scoped
// variables — not window.* globals — so behaviour is testable and ownership
// is explicit. Future phases extend this with the OHLCV slice, the indicator
// slice, and so on; the convention is "core state goes here, feature-local
// state goes in features/<feature>/state.ts or overlays/<feature>/state.ts".
const emptyPagination = () => ({
    nextCursor: null,
    hasMore: false,
    assetId: null,
    vsCurrency: null,
});
const state = {
    widget: null,
    isChartReady: false,
    currentSymbol: 'ASSET',
    currentResolution: '5',
    currentChartType: 2,
    theme: null,
    libraryLoaded: false,
    libraryError: null,
    ohlcvData: [],
    ohlcvGeneration: 0,
    ohlcvPagination: emptyPagination(),
    visibleFromMs: null,
    visibleToMs: null,
    realtimeCallbacks: {},
    activeStudies: new Map(),
    maStudies: new Map(),
    legendStudyOrder: new Map(),
    volumeStudyId: null,
    volumeIsOverlay: null,
    subPaneHeightRatio: null,
    rnBackedPagination: { enabled: false },
    hasExplicitCurrentPriceLine: false,
    hotReloadSeq: 0,
    slbMode: false,
    slbCenteringPending: false,
    legendOwnsLayoutSettle: false,
};
// ----- Widget lifecycle ---------------------------------------------------
function getWidget() {
    return state.widget;
}
function setWidget(widget) {
    state.widget = widget;
}
function isChartReady() {
    return state.isChartReady;
}
function setChartReady(ready) {
    state.isChartReady = ready;
}
// ----- Symbol + resolution ------------------------------------------------
function getCurrentSymbol() {
    return state.currentSymbol;
}
function setCurrentSymbol(symbol) {
    state.currentSymbol = symbol;
}
function getCurrentResolution() {
    return state.currentResolution;
}
function setCurrentResolution(resolution) {
    state.currentResolution = resolution;
}
// ----- Theme --------------------------------------------------------------
function getTheme() {
    return state.theme;
}
function setTheme(theme) {
    state.theme = theme;
}
// ----- Library load -------------------------------------------------------
function isLibraryLoaded() {
    return state.libraryLoaded;
}
function setLibraryLoaded(loaded) {
    state.libraryLoaded = loaded;
}
function getLibraryError() {
    return state.libraryError;
}
function setLibraryError(error) {
    state.libraryError = error;
}
// ----- Chart type --------------------------------------------------------
function getCurrentChartType() {
    return state.currentChartType;
}
function setCurrentChartType(type) {
    state.currentChartType = type;
}
// ----- OHLCV data --------------------------------------------------------
function getOhlcvData() {
    return state.ohlcvData;
}
function setOhlcvData(data) {
    state.ohlcvData = data;
}
function appendOrReplaceLastBar(bar) {
    const data = state.ohlcvData;
    const last = data.at(-1);
    if (data.length > 0 && last?.time === bar.time) {
        data[data.length - 1] = bar;
    }
    else {
        data.push(bar);
    }
}
function prependOhlcvBars(bars) {
    state.ohlcvData = bars.concat(state.ohlcvData);
}
function getOhlcvGeneration() {
    return state.ohlcvGeneration;
}
function state_bumpOhlcvGeneration() {
    state.ohlcvGeneration += 1;
    return state.ohlcvGeneration;
}
function getOhlcvPagination() {
    return state.ohlcvPagination;
}
function setOhlcvPagination(pagination) {
    state.ohlcvPagination = pagination;
}
function clearOhlcvPagination() {
    state.ohlcvPagination = emptyPagination();
}
// ----- Visible range ------------------------------------------------------
function getVisibleFromMs() {
    return state.visibleFromMs;
}
function setVisibleFromMs(ms) {
    state.visibleFromMs = ms;
}
function getVisibleToMs() {
    return state.visibleToMs;
}
function setVisibleToMs(ms) {
    state.visibleToMs = ms;
}
// ----- Realtime tick subscribers ------------------------------------------
function registerRealtimeCallback(listenerGuid, callback) {
    state.realtimeCallbacks[listenerGuid] = callback;
}
function unregisterRealtimeCallback(listenerGuid) {
    delete state.realtimeCallbacks[listenerGuid];
}
function getRealtimeCallbacks() {
    return state.realtimeCallbacks;
}
// ----- Indicator studies --------------------------------------------------
function getActiveStudies() {
    return state.activeStudies;
}
function getMaStudies() {
    return state.maStudies;
}
function getLegendStudyOrder() {
    return state.legendStudyOrder;
}
function registerStudy(bucket, name, studyId) {
    if (bucket === 'active') {
        state.activeStudies.set(name, studyId);
    }
    else {
        state.maStudies.set(name, studyId);
    }
    state.legendStudyOrder.set(name, studyId);
}
function unregisterStudy(name) {
    const fromActive = state.activeStudies.get(name);
    const fromMA = state.maStudies.get(name);
    state.activeStudies.delete(name);
    state.maStudies.delete(name);
    state.legendStudyOrder.delete(name);
    return fromActive ?? fromMA;
}
// ----- Volume study -------------------------------------------------------
function getVolumeStudyId() {
    return state.volumeStudyId;
}
function setVolumeStudyId(id) {
    state.volumeStudyId = id;
    if (id) {
        state.legendStudyOrder.set('Volume', id);
    }
    else {
        state.legendStudyOrder.delete('Volume');
    }
}
function getVolumeIsOverlay() {
    return state.volumeIsOverlay;
}
function setVolumeIsOverlay(isOverlay) {
    state.volumeIsOverlay = isOverlay;
}
// ----- Sub-pane height ratio ----------------------------------------------
function getSubPaneHeightRatio() {
    return state.subPaneHeightRatio;
}
function setSubPaneHeightRatio(ratio) {
    state.subPaneHeightRatio = ratio;
}
// ----- RN-backed pagination --------------------------------------------------
function getRnBackedPagination() {
    return state.rnBackedPagination;
}
function setRnBackedPagination(config) {
    state.rnBackedPagination = config;
}
// ----- Hot-reload sequence guards --------------------------------------------
function bumpHotReloadSeq() {
    state.hotReloadSeq += 1;
    return state.hotReloadSeq;
}
function getHotReloadSeq() {
    return state.hotReloadSeq;
}
// ----- SLB (Social Leaderboard) mode -----------------------------------------
function getSlbMode() {
    return state.slbMode;
}
function setSlbMode(enabled) {
    state.slbMode = enabled;
}
function isSlbCenteringPending() {
    return state.slbCenteringPending;
}
function setSlbCenteringPending(pending) {
    state.slbCenteringPending = pending;
}
// ----- Legend owns layout settle ---------------------------------------------
function setLegendOwnsLayoutSettle(owns) {
    state.legendOwnsLayoutSettle = owns;
}
function doesLegendOwnLayoutSettle() {
    return state.legendOwnsLayoutSettle;
}
// ----- Explicit current price line -------------------------------------------
function getHasExplicitCurrentPriceLine() {
    return state.hasExplicitCurrentPriceLine;
}
function setHasExplicitCurrentPriceLine(has) {
    state.hasExplicitCurrentPriceLine = has;
}
/**
 * Resets state to defaults — useful for unit tests. NOT for runtime use; the
 * WebView is created fresh per mount (the RN side recreates the HTML when
 * the theme or feature flags change).
 */
function _resetStateForTests() {
    state.widget = null;
    state.isChartReady = false;
    state.currentSymbol = 'ASSET';
    state.currentResolution = '5';
    state.currentChartType = 2;
    state.theme = null;
    state.libraryLoaded = false;
    state.libraryError = null;
    state.ohlcvData = [];
    state.ohlcvGeneration = 0;
    state.ohlcvPagination = emptyPagination();
    state.visibleFromMs = null;
    state.visibleToMs = null;
    state.realtimeCallbacks = {};
    state.activeStudies = new Map();
    state.maStudies = new Map();
    state.legendStudyOrder = new Map();
    state.volumeStudyId = null;
    state.volumeIsOverlay = null;
    state.subPaneHeightRatio = null;
    state.rnBackedPagination = { enabled: false };
    state.hasExplicitCurrentPriceLine = false;
    state.hotReloadSeq = 0;
    state.slbMode = false;
    state.slbCenteringPending = false;
    state.legendOwnsLayoutSettle = false;
}
//# sourceMappingURL=state.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/widget/tvDomHelpers.mjs
// Pure DOM traversal helpers for TradingView's same-origin iframe layout.
//
// Ported from chartLogic.js: findOuterChartMarkupTable (~line 1977) and
// eachChartDocument (~line 2003). Used by externalLinkBridge and (in later
// phases) by indicator legend overlay layout calculations.
/**
 * Find the outermost `.chart-markup-table` element in a document — the
 * container that wraps the price + time axes. Skips inner panes and axis
 * containers so consumers can reason about chart bounds.
 *
 * @param doc - The document to search, or null/undefined.
 * @returns The outermost chart-markup-table element, or null when not found.
 */
function findOuterChartMarkupTable(doc) {
    if (!doc) {
        return null;
    }
    const list = doc.querySelectorAll('.chart-markup-table');
    for (const el of Array.from(list)) {
        const className = el.className ? String(el.className) : '';
        if (el.classList.contains('pane')) {
            continue;
        }
        if (className.includes('price-axis-container')) {
            continue;
        }
        if (className.includes('time-axis')) {
            continue;
        }
        return el;
    }
    return list.length ? list[0] : null;
}
/**
 * Run `fn(document)` and `fn(iframe.contentDocument)` for the TradingView
 * same-origin iframe. TradingView's chart can mount in either the host doc
 * or a same-origin iframe depending on `iframe_loading_same_origin`; helpers
 * that traverse DOM should hit both.
 *
 * @param fn - Callback invoked with each chart document.
 */
function eachChartDocument(fn) {
    try {
        fn(document);
    }
    catch {
        // Continue to the iframe document.
    }
    try {
        const container = document.getElementById('tv_chart_container');
        const iframe = container?.querySelector('iframe');
        if (iframe?.contentDocument) {
            fn(iframe.contentDocument);
        }
    }
    catch {
        // No-op — iframe access can fail for cross-origin or detached frames.
    }
}
//# sourceMappingURL=tvDomHelpers.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/features/indicators/legend.mjs
// DOM legend overlay for active indicator studies.
//
// Ported from chartLogic.js: createStudyLegendOverlay (~4365),
// refreshStudyLegendFromExport (~4644), buildLegendHTML (~4497),
// updateLegendOverlayLayout (~4401), legend retry/timeout machinery
// (~4630-4785), getMainPriceAxisLeftRelativeTo (~1472).
//
// The overlay is a `<div id="study-legend-overlay">` injected into
// #tv_chart_container that holds one `.legend-pill` per active indicator.
// Theme-aware text colors are computed from CONFIG.theme; per-plot colors
// come from the legend config supplied by RN.
//
// `LEGEND_RENDERED` is posted to RN once the overlay has settled (either
// real values returned by chart.exportData() or after the retry timeout).



const OVERLAY_ID = 'study-legend-overlay';
const OVERLAY_LEFT_PX = 8;
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 100;
const RENDER_TIMEOUT_MS = 3000;
let exportGeneration = 0;
let retryCount = 0;
let timeoutId = null;
let legendOverlayEnabled = false;
/** Typed legend config from RN — the single source of truth for legend rendering. */
let legendConfig;
/** Sub-pane overlay elements keyed by indicator name. */
const subPaneOverlays = new Map();
// ----- Lifecycle ---------------------------------------------------------
/**
 * Called once on chart-ready to set up the DOM container.
 *
 * @param config - The legend overlay configuration, or undefined.
 */
function setupLegendOverlay(config) {
    legendOverlayEnabled = Boolean(config?.enabled);
    legendConfig = config?.config;
    if (!legendOverlayEnabled) {
        return;
    }
    createOverlayElement();
    injectHideLegendButtonsCSS();
}
/**
 * Subscribes to the widget's `panes_height_changed` event so the overlay
 * max-width is recomputed whenever a pane resize (e.g. after adding MACD
 * or RSI) shifts the price-axis boundary.
 *
 * @param widget - The TradingView widget (subset used here).
 * @param widget.subscribe - Subscribes to the `panes_height_changed` event.
 * @param widget.activeChart - Returns the active chart.
 */
function attachLegendResizeListener(widget) {
    try {
        widget.subscribe('panes_height_changed', () => {
            const el = document.getElementById(OVERLAY_ID);
            if (el) {
                updateLegendOverlayLayout();
            }
            repositionSubPaneOverlays(widget.activeChart());
        });
    }
    catch {
        // TV may throw if subscribe isn't ready; safe to ignore.
    }
}
function createOverlayElement() {
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) {
        existing.remove();
    }
    const container = document.getElementById('tv_chart_container');
    if (!container) {
        return;
    }
    const div = document.createElement('div');
    div.id = OVERLAY_ID;
    div.style.cssText =
        `position:absolute;top:1px;left:${OVERLAY_LEFT_PX}px;z-index:5;` +
            `pointer-events:none;display:flex;flex-wrap:wrap;align-items:flex-start;` +
            `column-gap:8px;row-gap:2px;`;
    container.style.position = 'relative';
    container.appendChild(div);
}
function injectHideLegendButtonsCSS() {
    const styleId = 'mm-hide-legend-buttons';
    if (document.getElementById(styleId)) {
        return;
    }
    let targetDoc = document;
    eachChartDocument((doc) => {
        if (targetDoc === document && doc !== document) {
            targetDoc = doc;
        }
    });
    const style = targetDoc.createElement('style');
    style.id = styleId;
    style.textContent =
        '.chart-controls-bar .apply-common-tooltip,' +
            '.legendElement .showHide,' +
            '.legendElement button[data-name="legend-show-hide-action"],' +
            '.legendElement button[data-name="legend-settings-action"],' +
            '.legendElement button[data-name="legend-delete-action"],' +
            '.legendElement .buttons-wrapper,' +
            '.legendElement .buttonsWrapper{display:none!important;}';
    targetDoc.head.appendChild(style);
}
// ----- Legend rebuild ---------------------------------------------------
/**
 * Returns the per-indicator legend config supplied by RN via legendOverlay.config.
 * Consumers must pass their own config — there is no built-in fallback.
 *
 * @returns The per-indicator legend config map (empty when unset).
 */
function getPresetMap() {
    return legendConfig ?? {};
}
function getLegendAltColor() {
    const theme = getTheme();
    return (theme?.legendTextColor ??
        theme?.textAlternativeColor ??
        theme?.textColor ??
        'rgb(133,136,152)');
}
function isEmptyValue(value) {
    return !value || value === '' || value === 'n/a' || value === '∅';
}
function plotValue(indicatorConfig, plotCfg, plotIndex, values) {
    if (indicatorConfig.useIndex && plotIndex < values.length) {
        return values[plotIndex].value;
    }
    const match = values.find((candidate) => candidate.title === plotCfg.tvTitle);
    return match?.value ?? '';
}
function wrapPill(innerHtml, color) {
    const style = color ? ` style="color:${color};"` : '';
    return `<span class="legend-pill"${style}>${innerHtml}</span>`;
}
function buildHTML(entries) {
    const altColor = getLegendAltColor();
    const presets = getPresetMap();
    const successColor = getTheme()?.successColor ?? 'rgb(38,166,154)';
    const pills = [];
    for (const entry of entries) {
        const indicatorConfig = presets[entry.name];
        if (!indicatorConfig) {
            continue;
        }
        if (indicatorConfig.isMA) {
            const ma = indicatorConfig.plots[0];
            const value = plotValue(indicatorConfig, ma, 0, entry.values);
            if (isEmptyValue(value)) {
                continue;
            }
            pills.push(wrapPill(`${ma.label} ${value}`, ma.color ?? undefined));
            continue;
        }
        if (indicatorConfig.combineInOnePill) {
            const labelColor = indicatorConfig.plots[0].color ?? successColor;
            let inner = `<span style="color:${labelColor}">${indicatorConfig.title ?? indicatorConfig.plots[0].label}</span>`;
            let hasValues = false;
            indicatorConfig.plots.forEach((plot, idx) => {
                const value = plotValue(indicatorConfig, plot, idx, entry.values);
                if (isEmptyValue(value)) {
                    return;
                }
                hasValues = true;
                inner +=
                    `<span style="color:${labelColor}">&nbsp;${plot.label}</span>` +
                        `<span style="color:${altColor}">&nbsp;${value}</span>`;
            });
            if (hasValues) {
                pills.push(wrapPill(inner));
            }
            continue;
        }
        indicatorConfig.plots.forEach((plot, idx) => {
            const value = plotValue(indicatorConfig, plot, idx, entry.values);
            if (isEmptyValue(value)) {
                return;
            }
            const color = plot.color ?? successColor;
            const inner = `<span style="color:${color}">${plot.label}</span>` +
                `<span style="color:${altColor}">&nbsp;${value}</span>`;
            pills.push(wrapPill(inner));
        });
    }
    return pills.join('');
}
// ----- Refresh from chart.exportData() ----------------------------------
function collectStudyIdMap() {
    const map = {};
    for (const [name, id] of getActiveStudies().entries()) {
        map[String(id)] = name;
    }
    for (const [name, id] of getMaStudies().entries()) {
        map[String(id)] = name;
    }
    const vol = getVolumeStudyId();
    if (vol) {
        map[String(vol)] = 'Volume';
    }
    return map;
}
function buildOrderedEntries(byStudy) {
    const result = [];
    for (const [name, studyId] of getLegendStudyOrder().entries()) {
        const sid = String(studyId);
        const values = byStudy[sid];
        if (values) {
            result.push({ name, values });
        }
    }
    return result;
}
function formatLegendValue(value) {
    if (!Number.isFinite(value)) {
        return '';
    }
    const abs = Math.abs(value);
    if (abs >= 1e9) {
        return `${(value / 1e9).toFixed(2)}B`;
    }
    if (abs >= 1e6) {
        return `${(value / 1e6).toFixed(2)}M`;
    }
    if (abs >= 1e4) {
        return `${(value / 1e3).toFixed(1)}K`;
    }
    if (abs >= 1000) {
        return value.toFixed(2);
    }
    if (abs >= 1) {
        return value.toFixed(2);
    }
    if (abs >= 0.01) {
        return value.toFixed(4);
    }
    return value.toPrecision(4);
}
function hasAnyEmpty(entries) {
    for (const entry of entries) {
        for (const value of entry.values) {
            if (isEmptyValue(value.value)) {
                return true;
            }
        }
    }
    return false;
}
function notifyLegendRendered() {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            postToRN('LEGEND_RENDERED', {});
            if (doesLegendOwnLayoutSettle()) {
                setLegendOwnsLayoutSettle(false);
                postToRN('CHART_LAYOUT_SETTLED', {});
            }
        });
    });
}
function clearTimer() {
    if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
}
function startTimeout(gen) {
    clearTimer();
    timeoutId = setTimeout(() => {
        if (gen !== exportGeneration) {
            return;
        }
        retryCount = 0;
        clearTimer();
        notifyLegendRendered();
    }, RENDER_TIMEOUT_MS);
}
function scheduleRetry(gen) {
    if (retryCount >= MAX_RETRIES) {
        retryCount = 0;
        clearTimer();
        notifyLegendRendered();
        return;
    }
    retryCount += 1;
    setTimeout(() => {
        if (gen === exportGeneration) {
            refreshStudyLegendFromExport();
        }
    }, RETRY_DELAY_MS);
}
function renderOverlay(entries) {
    const presets = getPresetMap();
    const widget = getWidget();
    const chart = widget?.activeChart();
    const activeStudies = getActiveStudies();
    const mainEntries = [];
    const subPaneEntries = [];
    for (const entry of entries) {
        const preset = presets[entry.name];
        if (preset?.subPaneLegend && chart) {
            const studyId = activeStudies.get(entry.name);
            const study = studyId ? chart.getStudyById(studyId) : null;
            const paneIdx = study?.paneIndex?.();
            if (paneIdx !== undefined && paneIdx > 0) {
                subPaneEntries.push({ name: entry.name, paneIdx, entry });
                continue;
            }
        }
        mainEntries.push(entry);
    }
    const mainOverlay = document.getElementById(OVERLAY_ID);
    if (mainOverlay) {
        mainOverlay.innerHTML = buildHTML(mainEntries);
    }
    const activeNames = new Set(subPaneEntries.map((subPane) => subPane.name));
    for (const name of subPaneOverlays.keys()) {
        if (!activeNames.has(name)) {
            removeSubPaneOverlay(name);
        }
    }
    for (const { name, paneIdx, entry } of subPaneEntries) {
        const overlay = ensureSubPaneOverlay(name, paneIdx, chart ?? undefined);
        if (overlay) {
            overlay.innerHTML = buildHTML([entry]);
        }
    }
    updateLegendOverlayLayout();
    if (chart) {
        repositionSubPaneOverlays(chart);
    }
}
function refreshStudyLegendFromExport() {
    if (!legendOverlayEnabled) {
        return;
    }
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) {
        return;
    }
    const studyIdMap = collectStudyIdMap();
    const studyIds = Object.keys(studyIdMap);
    if (studyIds.length === 0) {
        overlay.innerHTML = '';
        removeAllSubPaneOverlays();
        retryCount = 0;
        clearTimer();
        return;
    }
    exportGeneration += 1;
    const gen = exportGeneration;
    if (retryCount === 0) {
        startTimeout(gen);
    }
    const chart = widget.activeChart();
    chart
        .exportData({
        includeSeries: false,
        includedStudies: studyIds,
    })
        .then((data) => {
        if (gen === exportGeneration) {
            handleExportData(data, gen);
        }
        return undefined;
    })
        .catch(() => scheduleRetry(gen));
}
function isValidExportData(data) {
    return Boolean(data?.schema && data.data && data.data.length > 0);
}
function resolveDisplayValue(rawVal, colIndex, displayedData) {
    let displayVal = rawVal !== undefined && !Number.isNaN(rawVal)
        ? formatLegendValue(rawVal)
        : '';
    if (displayedData && displayedData.length > 0) {
        const dispRow = displayedData.at(-1);
        if (dispRow?.[colIndex]) {
            displayVal = dispRow[colIndex];
        }
    }
    return displayVal;
}
function buildStudyMap(data, lastRow) {
    const byStudy = {};
    for (let index = 0; index < data.schema.length; index++) {
        const field = data.schema[index];
        if (field.type === 'time' || field.type === 'userTime') {
            continue;
        }
        const sid = field.sourceId ? String(field.sourceId) : '';
        if (!sid) {
            continue;
        }
        if (!byStudy[sid]) {
            byStudy[sid] = [];
        }
        const displayVal = resolveDisplayValue(lastRow[index], index, data.displayedData);
        byStudy[sid].push({ title: field.plotTitle ?? '', value: displayVal });
    }
    return byStudy;
}
function handleExportData(data, gen) {
    if (!isValidExportData(data)) {
        scheduleRetry(gen);
        return;
    }
    const lastRow = data.data.at(-1);
    if (!lastRow) {
        scheduleRetry(gen);
        return;
    }
    const byStudy = buildStudyMap(data, lastRow);
    const entries = buildOrderedEntries(byStudy);
    if (hasAnyEmpty(entries) && retryCount < MAX_RETRIES) {
        scheduleRetry(gen);
        return;
    }
    retryCount = 0;
    renderOverlay(entries);
    clearTimer();
    notifyLegendRendered();
}
/**
 * Used by indicator handlers to request a legend rebuild after a study has
 * been added/removed. Two rAFs to wait for TV's internal layout pass.
 */
function scheduleLegendRefresh() {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => refreshStudyLegendFromExport());
    });
}
/**
 * Subscribes to a study's onDataLoaded event so the legend refreshes once
 * the study's calculation finishes. Falls back to immediate refresh when
 * the subscription API isn't available.
 *
 * @param chart - The active TradingView chart.
 * @param studyId - The id of the study to subscribe to.
 */
function subscribeStudyDataLoaded(chart, studyId) {
    try {
        const study = chart.getStudyById(studyId);
        if (study?.onDataLoaded) {
            study.onDataLoaded().subscribe(null, () => {
                scheduleLegendRefresh();
            });
            return;
        }
    }
    catch {
        // Fallthrough to direct refresh.
    }
    scheduleLegendRefresh();
}
// ----- Sub-pane overlay management ----------------------------------------
function subPaneOverlayId(name) {
    return `${OVERLAY_ID}-pane-${name}`;
}
function getSubPaneTopPx(paneIndex, chart) {
    const heights = chart.getAllPanesHeight();
    let top = 0;
    for (let i = 0; i < paneIndex && i < heights.length; i++) {
        top += heights[i];
    }
    return top + 4;
}
function ensureSubPaneOverlay(name, paneIndex, chart) {
    const existing = subPaneOverlays.get(name);
    if (existing && document.contains(existing)) {
        return existing;
    }
    const container = document.getElementById('tv_chart_container');
    if (!container) {
        return null;
    }
    const div = document.createElement('div');
    div.id = subPaneOverlayId(name);
    const topPx = chart ? getSubPaneTopPx(paneIndex, chart) : 0;
    div.style.cssText =
        `position:absolute;top:${topPx}px;left:${OVERLAY_LEFT_PX}px;z-index:5;` +
            `pointer-events:none;display:flex;flex-wrap:wrap;align-items:flex-start;` +
            `column-gap:8px;row-gap:2px;`;
    container.appendChild(div);
    subPaneOverlays.set(name, div);
    return div;
}
function removeSubPaneOverlay(name) {
    const el = subPaneOverlays.get(name);
    if (el) {
        el.remove();
        subPaneOverlays.delete(name);
    }
}
function removeAllSubPaneOverlays() {
    for (const el of subPaneOverlays.values()) {
        el.remove();
    }
    subPaneOverlays.clear();
}
function repositionSubPaneOverlays(chart) {
    const activeStudies = getActiveStudies();
    for (const [name, el] of subPaneOverlays) {
        const studyId = activeStudies.get(name);
        const study = studyId ? chart.getStudyById(studyId) : null;
        const paneIdx = study?.paneIndex?.();
        if (paneIdx !== undefined && paneIdx > 0) {
            el.style.top = `${getSubPaneTopPx(paneIdx, chart)}px`;
        }
    }
}
// ----- Layout ------------------------------------------------------------
const FALLBACK_SCALE_WIDTH = 48;
const SCALE_GAP = 4;
function getPriceScaleWidth() {
    const widget = getWidget();
    if (!widget) {
        return FALLBACK_SCALE_WIDTH;
    }
    const chart = widget.activeChart();
    const panes = chart.getPanes?.();
    if (!panes || panes.length === 0) {
        return FALLBACK_SCALE_WIDTH;
    }
    const scales = panes[0].getRightPriceScales?.();
    const width = scales?.[0]?.width?.();
    return width && width > 0 ? width : FALLBACK_SCALE_WIDTH;
}
function updateLegendOverlayLayout() {
    const container = document.getElementById('tv_chart_container');
    if (!container) {
        return;
    }
    const containerWidth = container.clientWidth;
    if (containerWidth <= 0) {
        return;
    }
    const scaleWidth = getPriceScaleWidth();
    const maxWidth = `${containerWidth - OVERLAY_LEFT_PX - scaleWidth - SCALE_GAP}px`;
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.style.maxWidth = maxWidth;
    }
    for (const el of subPaneOverlays.values()) {
        el.style.maxWidth = maxWidth;
    }
}
/** Test-only: clear all module-local state between cases. */
function _resetLegendForTests() {
    exportGeneration = 0;
    retryCount = 0;
    clearTimer();
    legendOverlayEnabled = false;
    legendConfig = undefined;
    removeAllSubPaneOverlays();
}
//# sourceMappingURL=legend.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/features/indicators/resize.mjs
// Re-runs the widget's own resize after study operations so overlay lines
// re-align with the price scale. Ported from chartLogic.js
// `scheduleChartWidgetResize` (~line 162). Two rAFs + a 120ms timeout mirror
// the legacy staggered sequence — TradingView doesn't always align on the
// first tick after createStudy resolves.

function scheduleChartWidgetResize() {
    const run = () => {
        const widget = getWidget();
        if (!widget) {
            return;
        }
        try {
            widget.resize();
        }
        catch {
            // TV can throw if the widget is mid-teardown; safe to ignore.
        }
    };
    try {
        requestAnimationFrame(() => {
            requestAnimationFrame(run);
        });
    }
    catch {
        setTimeout(run, 0);
    }
    setTimeout(run, 120);
}
//# sourceMappingURL=resize.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/features/indicators/studies.mjs
// Study presets — the createStudy() shape for each indicator we support.
//
// Ported from chartLogic.js: handleAddIndicator's switch (~line 818),
// MA_LENGTHS / MA_COLORS (~line 920), handleSetMAVisibility createStudy
// call (~line 959). Phase 3 keeps the curated TV-study surface used by
// Token Details; consumers needing TV's full study picker can re-enable
// header_widget via the disabledFeatures prop.
/**
 * Built-in MA visibility periods. Used by SET_MA_VISIBILITY to keep the
 * MA dropdown in sync. Order matters for the default rendering order.
 */
const MA_LENGTHS = {
    MA5: 5,
    MA10: 10,
    MA20: 20,
    MA50: 50,
    MA200: 200,
};
const DEFAULT_MA_COLORS = {
    MA5: 'rgb(139,139,245)',
    MA10: 'rgb(255,107,157)',
    MA20: 'rgb(245,166,35)',
    MA50: 'rgb(184,230,46)',
    MA200: 'rgb(92,201,245)',
};
function getMAColor(name, indicatorColors) {
    const fromConfig = indicatorColors?.MA?.[name];
    if (fromConfig) {
        return fromConfig;
    }
    return DEFAULT_MA_COLORS[name] ?? DEFAULT_MA_COLORS.MA200;
}
function macdPreset(colors) {
    const palette = colors?.MACD ?? {};
    return {
        studyName: 'MACD',
        inputs: { in_0: 12, in_1: 26, in_2: 9 },
        overrides: {
            'MACD.color': palette.macd,
            'Signal.color': palette.signal,
            'Histogram.color.0': palette.histogramPositive,
            'Histogram.color.1': palette.histogramNegative,
        },
        paneTarget: 'sub',
    };
}
function rsiPreset(colors) {
    const palette = colors?.RSI ?? {};
    return {
        studyName: 'Relative Strength Index',
        inputs: { in_0: 14 },
        overrides: {
            'Plot.color': palette.plot,
            'hlines background.visible': false,
        },
        paneTarget: 'sub',
    };
}
function bolPreset(colors) {
    const palette = colors?.BOL ?? {};
    return {
        studyName: 'Bollinger Bands',
        inputs: { in_0: 20, in_1: 2 },
        overrides: {
            'Upper.color': palette.upper,
            'Basis.color': palette.basis,
            'Lower.color': palette.lower,
        },
    };
}
function ma200Preset() {
    return {
        studyName: 'Moving Average',
        inputs: { length: 200 },
        overrides: {},
    };
}
function maVariantPreset(name, colors) {
    return {
        studyName: 'Moving Average',
        inputs: { length: MA_LENGTHS[name] },
        overrides: {
            'Plot.color': getMAColor(name, colors),
        },
    };
}
function fallbackPreset(inputs) {
    return {
        studyName: '',
        inputs: inputs ?? {},
        overrides: {},
    };
}
/**
 * Resolves the createStudy preset for one of the curated indicators. Unknown
 * names fall back to a generic preset that uses the name verbatim as the
 * study name and the inputs as provided.
 *
 * @param name - The curated indicator name (e.g. `MACD`, `MA50`).
 * @param indicatorColors - Optional per-indicator color overrides.
 * @param inputsOverride - Inputs used for the fallback preset on unknown names.
 * @returns The resolved study preset.
 */
function resolveStudyPreset(name, indicatorColors, inputsOverride) {
    switch (name) {
        case 'MACD':
            return macdPreset(indicatorColors);
        case 'RSI':
            return rsiPreset(indicatorColors);
        case 'BOL':
            return bolPreset(indicatorColors);
        case 'MA200':
            return ma200Preset();
        case 'MA5':
        case 'MA10':
        case 'MA20':
        case 'MA50':
            return maVariantPreset(name, indicatorColors);
        default: {
            const preset = fallbackPreset(inputsOverride);
            preset.studyName = name;
            return preset;
        }
    }
}
function isSubPanePreset(preset) {
    return preset.paneTarget === 'sub';
}
/**
 * Creates the indicator study on the given chart, returning the studyId once
 * TradingView resolves the create promise.
 *
 * @param chart - The active TradingView chart.
 * @param preset - The study preset describing name, inputs and overrides.
 * @returns A promise resolving to the created study id.
 */
function createIndicatorStudy(chart, preset) {
    return chart.createStudy(preset.studyName, false, false, preset.inputs, preset.overrides);
}
//# sourceMappingURL=studies.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/features/indicators/subPane.mjs
// Sub-pane height ratio handler.
//
// Ported from chartLogic.js handleSetSubPaneLayout (~line 783) +
// applySubPaneHeightRatio (~line 750). The consumer-supplied ratio
// (subPaneHeightRatio prop) governs the size of RSI/MACD sub-panes.


const MIN_MAIN_PX = 72;
function hasActiveSubPaneIndicators() {
    const widget = getWidget();
    if (!widget) {
        return false;
    }
    const chart = widget.activeChart();
    for (const studyId of getActiveStudies().values()) {
        const study = chart.getStudyById(studyId);
        const paneIdx = study?.paneIndex?.();
        if (paneIdx !== undefined && paneIdx > 0) {
            return true;
        }
    }
    return false;
}
function applySubPaneHeightRatio(chart) {
    const ratio = getSubPaneHeightRatio();
    if (ratio === null) {
        return;
    }
    try {
        const heights = chart.getAllPanesHeight();
        if (heights.length < 2) {
            return;
        }
        const total = heights.reduce((sum, height) => sum + height, 0);
        const bottomCount = heights.length - 1;
        let bottomTotal = Math.round(total * ratio * bottomCount);
        let main = total - bottomTotal;
        if (main < MIN_MAIN_PX) {
            main = MIN_MAIN_PX;
            bottomTotal = total - main;
        }
        const newHeights = [main];
        let remaining = bottomTotal;
        for (let i = 0; i < bottomCount; i++) {
            const paneHeight = i === bottomCount - 1
                ? remaining
                : Math.floor(bottomTotal / bottomCount);
            newHeights.push(paneHeight);
            remaining -= paneHeight;
        }
        chart.setAllPanesHeight(newHeights);
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
function handleSetSubPaneLayout(payload) {
    if (payload.heightRatio === null || payload.heightRatio === undefined) {
        setSubPaneHeightRatio(null);
        return;
    }
    const ratio = payload.heightRatio;
    if (typeof ratio !== 'number' || !(ratio > 0 && ratio <= 1)) {
        return;
    }
    setSubPaneHeightRatio(ratio);
    const widget = getWidget();
    if (widget && isChartReady() && hasActiveSubPaneIndicators()) {
        applySubPaneHeightRatio(widget.activeChart());
    }
}
//# sourceMappingURL=subPane.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/features/indicators/index.mjs
// ADD_INDICATOR / REMOVE_INDICATOR / SET_MA_VISIBILITY handlers.
//
// Ported from chartLogic.js handleAddIndicator (~line 803),
// handleRemoveIndicator (~line 891), handleSetMAVisibility (~line 929).
// Phase 3 keeps the curated indicator set used by Token Details (MACD, RSI,
// BOL, MA200 + MA visibility variants). Consumers needing TV's native study
// picker can re-enable header_widget via the disabledFeatures prop.






function isOwnStringKey(key) {
    return (typeof key === 'string' &&
        key !== '__proto__' &&
        key !== 'constructor' &&
        key !== 'prototype');
}
function notifyIndicatorAdded(name, studyId) {
    // Two-frame wait so RN reads the legend overlay after layout completes.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            postToRN('INDICATOR_ADDED', { name, id: String(studyId) });
        });
    });
}
function handleAddIndicator(payload, config) {
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    if (!payload?.name) {
        return;
    }
    const { name } = payload;
    if (!isOwnStringKey(name)) {
        return;
    }
    if (getActiveStudies().has(name)) {
        return;
    }
    const chart = widget.activeChart();
    const preset = resolveStudyPreset(name, config.indicatorColors, payload.inputs);
    createIndicatorStudy(chart, preset)
        .then((studyId) => {
        registerStudy('active', name, studyId);
        if (isSubPanePreset(preset)) {
            applySubPaneHeightRatio(chart);
        }
        subscribeStudyDataLoaded(chart, studyId);
        scheduleChartWidgetResize();
        notifyIndicatorAdded(name, studyId);
        return undefined;
    })
        .catch((error) => {
        reportErrorToRN(error instanceof Error
            ? new Error(`Failed to add indicator: ${error.message}`)
            : error);
    });
}
function handleRemoveIndicator(payload) {
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    if (!payload?.name) {
        return;
    }
    const { name } = payload;
    if (!isOwnStringKey(name)) {
        return;
    }
    if (!getActiveStudies().has(name)) {
        return;
    }
    const studyId = unregisterStudy(name);
    if (!studyId) {
        return;
    }
    try {
        const chart = widget.activeChart();
        const study = chart.getStudyById(studyId);
        const paneIdx = study?.paneIndex?.();
        const wasSubPane = paneIdx !== undefined && paneIdx > 0;
        if (wasSubPane) {
            removeSubPaneOverlay(name);
        }
        chart.removeEntity(studyId);
        scheduleLegendRefresh();
        postToRN('INDICATOR_REMOVED', { name });
        if (wasSubPane && hasActiveSubPaneIndicators()) {
            applySubPaneHeightRatio(chart);
        }
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
function handleSetMAVisibility(payload, config) {
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    if (!payload) {
        return;
    }
    const visible = payload.visible || [];
    const chart = widget.activeChart();
    const visibleNames = new Set();
    for (const visibleName of visible) {
        if (isOwnStringKey(visibleName) && MA_LENGTHS[visibleName] !== undefined) {
            visibleNames.add(visibleName);
        }
    }
    removeMAVariants(chart, visibleNames);
    addMAVariants(chart, visible, config);
}
function removeMAVariants(chart, keep) {
    const toRemove = [];
    for (const name of getMaStudies().keys()) {
        if (!keep.has(name)) {
            toRemove.push(name);
        }
    }
    if (toRemove.length === 0) {
        return;
    }
    for (const name of toRemove) {
        const studyId = unregisterStudy(name);
        if (!studyId) {
            continue;
        }
        try {
            chart.removeEntity(studyId);
            postToRN('INDICATOR_REMOVED', { name });
        }
        catch (error) {
            reportErrorToRN(error);
        }
    }
    // Removing TV studies doesn't auto-clear the DOM legend pills. Refresh so
    // the disabled MA's pill disappears alongside the underlying study.
    scheduleLegendRefresh();
}
function addMAVariants(chart, visible, config) {
    const promises = [];
    for (const name of visible) {
        if (!isOwnStringKey(name) || MA_LENGTHS[name] === undefined) {
            continue;
        }
        if (getMaStudies().has(name)) {
            continue;
        }
        const preset = resolveStudyPreset(name, config.indicatorColors);
        promises.push(createIndicatorStudy(chart, preset)
            .then((studyId) => {
            registerStudy('ma', name, studyId);
            subscribeStudyDataLoaded(chart, studyId);
            notifyIndicatorAdded(name, studyId);
            return undefined;
        })
            .catch((error) => {
            reportErrorToRN(new Error(`MA creation failed: ${name} - ${String(error)}`));
        }));
    }
    if (promises.length > 0) {
        Promise.all(promises)
            .then(() => {
            scheduleLegendRefresh();
            scheduleChartWidgetResize();
            return undefined;
        })
            .catch(reportErrorToRN);
    }
}
//# sourceMappingURL=index.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/widget/theme.mjs
// Theme application + SET_THEME_COLORS hot-swap handler.
//
// Ported from chartLogic.js: getThemeLineColor (line ~1034),
// getThemeLastPriceLineColor (~1044), getSeriesColorOverrides (~1084),
// applySeriesStyleProperties (~1114), applySeriesColors (~1134), and
// handleSetThemeColors (~1158).
//
// Phase 1 simplifications vs legacy:
// - Drops `useCustomPriceLabels` branching (custom chrome is being removed;
//   TV built-in scale + crosshair labels are always used).
// - Drops in-place shape recolor for line-end dot / dashed last-price / pills
//   (all chrome shapes that no longer exist).
// - Volume study recolor is wired through a subscribe callback so Phase 3's
//   features/volume/ can register without theme.ts knowing about it.


const listeners = new Set();
/**
 * Subscribe to theme changes. The callback fires whenever
 * applyThemeColors() updates state.theme.
 *
 * @param listener - Callback invoked with the new theme on each change.
 * @returns A function that unsubscribes the listener.
 */
function subscribeTheme(listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
/**
 * Returns the series stroke color. Falls back to successColor when
 * lineColor is unset (ambient feature off).
 *
 * @param theme - The current chart theme.
 * @returns The series stroke color.
 */
function getThemeLineColor(theme) {
    return theme.lineColor || theme.successColor;
}
/**
 * Returns the current-price line color. Honors currentPriceColor when set,
 * else matches the series line color.
 *
 * @param theme - The current chart theme.
 * @returns The current-price line color.
 */
function getThemeLastPriceLineColor(theme) {
    return theme.currentPriceColor || getThemeLineColor(theme);
}
/**
 * Returns the visual color for the current-price line/pill. Falls back
 * through currentPriceColor → lineColor → successColor.
 *
 * @param theme - The current chart theme.
 * @returns The current-price line/pill color.
 */
function getCurrentPriceVisualColor(theme) {
    return theme.currentPriceColor || theme.lineColor || theme.successColor;
}
/**
 * Volume up-bar color. Falls back to the candle success color.
 *
 * @param theme - The current chart theme.
 * @returns The volume up-bar color.
 */
function getVolumeSuccessColor(theme) {
    return theme.volumeSuccessColor ?? theme.successColor;
}
/**
 * Volume down-bar color. Falls back to the candle error color.
 *
 * @param theme - The current chart theme.
 * @returns The volume down-bar color.
 */
function getVolumeErrorColor(theme) {
    return theme.volumeErrorColor ?? theme.errorColor;
}
/**
 * Returns the TradingView main-series style overrides for a given line color.
 *
 * @param lineColor - The series stroke color.
 * @param lastPriceLineColor - The current-price line/pill color.
 * @returns The main-series style overrides.
 */
function getSeriesColorOverrides(lineColor, lastPriceLineColor) {
    const pillColor = lastPriceLineColor ?? lineColor;
    return {
        'mainSeriesProperties.lineStyle.color': lineColor,
        'mainSeriesProperties.lineStyle.colorType': 'solid',
        'mainSeriesProperties.lineStyle.linewidth': 2,
        'mainSeriesProperties.lineWithMarkersStyle.color': lineColor,
        'mainSeriesProperties.lineWithMarkersStyle.colorType': 'solid',
        'mainSeriesProperties.lineWithMarkersStyle.linewidth': 2,
        'mainSeriesProperties.areaStyle.linecolor': lineColor,
        'mainSeriesProperties.areaStyle.linewidth': 2,
        'mainSeriesProperties.baselineStyle.topLineColor': lineColor,
        'mainSeriesProperties.baselineStyle.topLineWidth': 2,
        'mainSeriesProperties.baselineStyle.bottomLineColor': lineColor,
        'mainSeriesProperties.baselineStyle.bottomLineWidth': 2,
        'mainSeriesProperties.baselineStyle.topFillColor1': 'rgba(0,0,0,0)',
        'mainSeriesProperties.baselineStyle.topFillColor2': 'rgba(0,0,0,0)',
        'mainSeriesProperties.baselineStyle.bottomFillColor1': 'rgba(0,0,0,0)',
        'mainSeriesProperties.baselineStyle.bottomFillColor2': 'rgba(0,0,0,0)',
        'mainSeriesProperties.priceLineColor': pillColor,
    };
}
/**
 * Returns the TV built-in scale + crosshair label overrides. With custom
 * chrome removed, TV's built-ins are always enabled (showSeriesLastValue,
 * showPriceScaleCrosshairLabel, showTimeScaleCrosshairLabel).
 *
 * @param theme - The current chart theme.
 * @returns The built-in scale + crosshair label overrides.
 */
function getBuiltInScaleLabelOverrides(theme) {
    const crosshairBg = theme.crosshairBackgroundColor ||
        theme.sectionBackgroundColor ||
        theme.backgroundColor;
    return {
        'scalesProperties.textColor': theme.textColor,
        'scalesProperties.crosshairLabelBgColorDark': crosshairBg,
        'scalesProperties.crosshairLabelBgColorLight': crosshairBg,
        'mainSeriesProperties.priceLineColor': getThemeLastPriceLineColor(theme),
    };
}
/**
 * Returns the candle-style overrides (up/down colors). Applied on init and on
 * SET_THEME_COLORS.
 *
 * @param theme - The current chart theme.
 * @returns The candle-style (up/down color) overrides.
 */
function getCandleStyleOverrides(theme) {
    return {
        'mainSeriesProperties.candleStyle.upColor': theme.successColor,
        'mainSeriesProperties.candleStyle.downColor': theme.errorColor,
        'mainSeriesProperties.candleStyle.borderUpColor': theme.successColor,
        'mainSeriesProperties.candleStyle.borderDownColor': theme.errorColor,
        'mainSeriesProperties.candleStyle.wickUpColor': theme.successColor,
        'mainSeriesProperties.candleStyle.wickDownColor': theme.errorColor,
    };
}
/**
 * Initialize theme state from a CONFIG.theme payload. Called once by
 * bootstrap before the widget is created. Doesn't touch the widget — it
 * only seeds state so the widget constructor (and listeners) can read it.
 *
 * @param theme - The initial theme from `CONFIG.theme`.
 */
function initThemeFromConfig(theme) {
    setTheme(theme);
}
/**
 * Hot-swap theme colors. Mirrors legacy chartLogic.js handleSetThemeColors
 * but without the chrome-shape updates (those features are deleted).
 *
 * @param payload - The partial set of theme colors to hot-swap.
 */
function applyThemeColors(payload) {
    const current = getTheme();
    if (!current) {
        return;
    }
    const updated = {
        ...current,
        ...(payload.lineColor !== undefined && { lineColor: payload.lineColor }),
        ...(payload.successColor !== undefined && {
            successColor: payload.successColor,
        }),
        ...(payload.errorColor !== undefined && { errorColor: payload.errorColor }),
        ...(payload.currentPriceColor !== undefined && {
            currentPriceColor: payload.currentPriceColor,
        }),
        ...(payload.volumeSuccessColor !== undefined && {
            volumeSuccessColor: payload.volumeSuccessColor,
        }),
        ...(payload.volumeErrorColor !== undefined && {
            volumeErrorColor: payload.volumeErrorColor,
        }),
    };
    setTheme(updated);
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        notifyListeners(updated);
        return;
    }
    const lineColor = getThemeLineColor(updated);
    try {
        widget.applyOverrides({
            ...getCandleStyleOverrides(updated),
            ...getSeriesColorOverrides(lineColor, getThemeLastPriceLineColor(updated)),
            ...getBuiltInScaleLabelOverrides(updated),
        });
    }
    catch (error) {
        reportErrorToRN(error);
    }
    applySeriesStyleProperties(widget, lineColor);
    notifyListeners(updated);
}
/**
 * Re-apply the current theme from state to the widget. Called on chart ready
 * to flush any SET_THEME_COLORS that arrived before the chart was initialized.
 * Ensures the first visible frame shows the correct color, not stale CONFIG.
 */
function flushPendingTheme() {
    const theme = getTheme();
    if (!theme) {
        return;
    }
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    const lineColor = getThemeLineColor(theme);
    try {
        widget.applyOverrides({
            ...getCandleStyleOverrides(theme),
            ...getSeriesColorOverrides(lineColor, getThemeLastPriceLineColor(theme)),
            ...getBuiltInScaleLabelOverrides(theme),
        });
    }
    catch (error) {
        reportErrorToRN(error);
    }
    applySeriesStyleProperties(widget, lineColor);
}
/**
 * Directly update the live series stroke color for line (2) and baseline (10)
 * chart styles. `applyOverrides` only sets widget-level defaults; this call
 * ensures the already-rendered series picks up the new color immediately.
 *
 * @param widget - The TradingView widget to update.
 * @param lineColor - The series stroke color to apply.
 */
function applySeriesStyleProperties(widget, lineColor) {
    try {
        const series = widget.activeChart().getSeries();
        series.setChartStyleProperties(2, {
            color: lineColor,
            colorType: 'solid',
            linewidth: 2,
        });
        series.setChartStyleProperties(10, {
            topLineColor: lineColor,
            bottomLineColor: lineColor,
            topLineWidth: 2,
            bottomLineWidth: 2,
        });
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
function notifyListeners(theme) {
    for (const listener of listeners) {
        try {
            listener(theme);
        }
        catch (error) {
            reportErrorToRN(error);
        }
    }
}
/** Test-only: clear all subscribers. */
function _resetThemeForTests() {
    listeners.clear();
}
//# sourceMappingURL=theme.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/features/volume/index.mjs
// Volume study handler. Supports overlay-on-main-pane and sub-pane modes.
//
// Ported from chartLogic.js handleToggleVolume (~line 4877) +
// createVolumeStudy (~line 4824). Sub-pane mode reshapes pane heights to
// give the volume strip ~22% of total chart height with sensible minimums.




const MIN_VOLUME_PX = 56;
const volume_MIN_MAIN_PX = 72;
const VOLUME_RATIO = 0.22;
function buildVolumeOverrides(useOverlay) {
    const theme = getTheme();
    if (!theme) {
        return {
            'volume ma.display': 0,
            'volume.transparency': useOverlay ? 70 : 0,
        };
    }
    return {
        'volume ma.display': 0,
        'volume.transparency': useOverlay ? 70 : 0,
        'volume.color.0': getVolumeErrorColor(theme),
        'volume.color.1': getVolumeSuccessColor(theme),
    };
}
function applySubPaneHeights(chart) {
    try {
        const heights = chart.getAllPanesHeight();
        if (heights.length !== 2) {
            return;
        }
        const total = heights[0] + heights[1];
        let vol = Math.max(Math.round(total * VOLUME_RATIO), MIN_VOLUME_PX);
        let main = total - vol;
        if (main < volume_MIN_MAIN_PX && total > volume_MIN_MAIN_PX + MIN_VOLUME_PX) {
            main = volume_MIN_MAIN_PX;
            vol = total - main;
        }
        else if (main < volume_MIN_MAIN_PX) {
            main = Math.max(48, total - MIN_VOLUME_PX);
            vol = total - main;
        }
        chart.setAllPanesHeight([main, vol]);
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
function createVolumeStudy(useOverlay) {
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    if (getVolumeStudyId()) {
        return;
    }
    const chart = widget.activeChart();
    const overrides = buildVolumeOverrides(useOverlay);
    const promise = useOverlay
        ? chart.createStudy('Volume', true, false, {}, overrides, {
            priceScale: 'no-scale',
        })
        : chart.createStudy('Volume', false, false, {}, overrides);
    promise
        .then((studyId) => {
        setVolumeStudyId(studyId);
        if (!useOverlay) {
            applySubPaneHeights(chart);
        }
        scheduleLegendRefresh();
        return undefined;
    })
        .catch((error) => reportErrorToRN(error));
}
function handleToggleVolume(payload) {
    const widget = getWidget();
    if (!widget || !isChartReady() || !payload) {
        return;
    }
    const useOverlay = payload.volumeOverlay === true;
    if (!payload.visible) {
        const existing = getVolumeStudyId();
        if (existing) {
            try {
                widget.activeChart().removeEntity(existing);
            }
            catch (error) {
                reportErrorToRN(error);
            }
            setVolumeStudyId(null);
        }
        setVolumeIsOverlay(null);
        scheduleLegendRefresh();
        return;
    }
    const existing = getVolumeStudyId();
    if (existing &&
        getVolumeIsOverlay() !== null &&
        getVolumeIsOverlay() !== useOverlay) {
        try {
            widget.activeChart().removeEntity(existing);
        }
        catch (error) {
            reportErrorToRN(error);
        }
        setVolumeStudyId(null);
    }
    setVolumeIsOverlay(useOverlay);
    if (!getVolumeStudyId()) {
        createVolumeStudy(useOverlay);
    }
}
function recolorVolumeStudy(theme) {
    const studyId = getVolumeStudyId();
    if (!studyId) {
        return;
    }
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    try {
        const study = widget.activeChart().getStudyById(studyId);
        if (study && typeof study.applyOverrides === 'function') {
            study.applyOverrides({
                'volume.color.0': getVolumeErrorColor(theme),
                'volume.color.1': getVolumeSuccessColor(theme),
            });
        }
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
function registerVolumeThemeSync() {
    subscribeTheme(recolorVolumeStudy);
}
//# sourceMappingURL=index.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/interaction/crosshair.mjs
// Crosshair → CROSSHAIR_MOVE message bridge + short-tap dismiss.
//
// Subscribes to TradingView's crossHairMoved() and posts the nearest OHLCV
// bar to RN. RN side's parseWebViewMessage routes this to onCrosshairMove,
// and AdvancedChart.tsx's OHLCVBar component reads `payload.data`.
//
// Also subscribes to mouse_down / mouse_up so a short tap (< 400ms) after a
// visible crosshair session dismisses the OHLCV bar — matches legacy
// chartLogic.js (~lines 5742-5779). Without this the OHLCV bar lingers
// forever after a long-press shows it.
//
// Ported from chartLogic.js (~line 5672) but simplified:
// - No custom DOM crosshair-label drawing (Phase 4 deleted that)
// - No marker hit-test bookkeeping (Phase 5's overlays/tradeMarkers owns it)


const session = {
    visible: false,
    shownAt: 0,
    dismissUntil: 0,
    tooltipInteractSent: false,
    mouseDownAt: 0,
};
const SHORT_TAP_MS = 400;
const SYNTHETIC_CLICK_GUARD_MS = 500;
const DISMISS_WINDOW_MS = 800;
const DISMISS_RN_DELAY_MS = 50;
function nearestBar(timeSec, data) {
    if (data.length === 0) {
        return null;
    }
    const targetMs = timeSec * 1000;
    let best = null;
    let bestDiff = Infinity;
    for (const bar of data) {
        const diff = Math.abs(bar.time - targetMs);
        if (diff < bestDiff) {
            bestDiff = diff;
            best = bar;
        }
    }
    return best;
}
function toCrosshairData(bar) {
    if (!bar) {
        return null;
    }
    return {
        time: bar.time,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
    };
}
/**
 * Subscribes the chart's crosshair-move event. Each tick posts CROSSHAIR_MOVE
 * with the nearest OHLCV bar shaped as CrosshairData, or null when the
 * crosshair dismisses or when we're inside the post-tap dismiss window.
 *
 * @param chart - The active TradingView chart to subscribe to.
 */
function attachCrosshairListener(chart) {
    try {
        const subscription = chart.crossHairMoved();
        subscription.subscribe(null, (params) => {
            if (params?.price === undefined || params?.time === undefined) {
                postToRN('CROSSHAIR_MOVE', { data: null });
                return;
            }
            if (Date.now() < session.dismissUntil) {
                postToRN('CROSSHAIR_MOVE', { data: null });
                return;
            }
            const bar = nearestBar(params.time, getOhlcvData());
            if (!session.visible) {
                session.shownAt = Date.now();
            }
            session.visible = true;
            if (bar && !session.tooltipInteractSent) {
                postToRN('CHART_INTERACTED', { interaction_type: 'tooltip' });
                session.tooltipInteractSent = true;
            }
            postToRN('CROSSHAIR_MOVE', { data: toCrosshairData(bar) });
        });
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
/**
 * Subscribes mouse_down / mouse_up so a short tap after a long-press-shown
 * crosshair dismisses the OHLCV bar on the RN side. TV's built-in crosshair
 * line will stay on the chart (no TV API for programmatic dismiss); only the
 * RN-side OHLCV bar reads `CROSSHAIR_MOVE { data: null }` to hide itself.
 *
 * @param widget - The TradingView widget to subscribe to.
 */
function attachTapDismiss(widget) {
    try {
        widget.subscribe('mouse_down', () => {
            session.mouseDownAt = Date.now();
            session.dismissUntil = 0;
        });
        widget.subscribe('mouse_up', () => {
            if (!session.visible) {
                return;
            }
            const pressDuration = Date.now() - session.mouseDownAt;
            if (pressDuration >= SHORT_TAP_MS) {
                return;
            }
            // Avoid dismissing the bar in response to the synthetic mouse-up that
            // fires when a long-press finally releases — only dismiss if the bar
            // has been visible long enough to be a deliberate "second tap".
            if (Date.now() - session.shownAt < SYNTHETIC_CLICK_GUARD_MS) {
                return;
            }
            session.visible = false;
            session.shownAt = 0;
            session.dismissUntil = Date.now() + DISMISS_WINDOW_MS;
            setTimeout(() => {
                session.tooltipInteractSent = false;
                postToRN('CROSSHAIR_MOVE', { data: null });
            }, DISMISS_RN_DELAY_MS);
        });
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
/** Test-only: reset the module-local crosshair session state. */
function _resetCrosshairForTests() {
    session.visible = false;
    session.shownAt = 0;
    session.dismissUntil = 0;
    session.tooltipInteractSent = false;
    session.mouseDownAt = 0;
}
//# sourceMappingURL=crosshair.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/core/dataLifecycle.mjs
// Lightweight event bus for data lifecycle events overlays need to react to.
//
// The widget modules (ohlcvIngestion, pagination, visibleRange) publish
// events after they mutate the OHLCV series or the visible range;
// overlay modules (tradeMarkers, positionLines) subscribe and re-place
// their shapes. Keeps overlays decoupled from widget/* — overlays never
// import from widget/*, matching the ESLint `no-restricted-paths`
// direction described in the plan.
//
// The events are intentionally void — subscribers read whatever state
// they need from core/state.ts. Errors inside a subscriber are logged
// to RN so a broken overlay doesn't take the widget down with it.

const dataLifecycle_listeners = {
    ohlcvReset: [],
    ohlcvPrepended: [],
    visibleRangeChanged: [],
};
function onDataLifecycle(event, listener) {
    dataLifecycle_listeners[event].push(listener);
    return () => {
        const bucket = dataLifecycle_listeners[event];
        const idx = bucket.indexOf(listener);
        if (idx !== -1) {
            bucket.splice(idx, 1);
        }
    };
}
function notifyDataLifecycle(event) {
    const bucket = dataLifecycle_listeners[event];
    for (const listener of bucket) {
        try {
            listener();
        }
        catch (error) {
            reportErrorToRN(error);
        }
    }
}
/** Test-only: clear every listener across every event. */
function _resetDataLifecycleForTests() {
    dataLifecycle_listeners.ohlcvReset = [];
    dataLifecycle_listeners.ohlcvPrepended = [];
    dataLifecycle_listeners.visibleRangeChanged = [];
}
//# sourceMappingURL=dataLifecycle.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/interaction/visibleRange.mjs
// Visible-range / bar-spacing → CHART_INTERACTED analytics.
//
// Subscribes to TradingView's barSpacingChanged (zoom) and
// onVisibleRangeChanged (pan), debouncing each by 450ms and skipping pan
// events that fire within 500ms of a zoom (the same finger gesture often
// triggers both).
//
// Ported from chartLogic.js zoom/pan debounce code in onChartReady
// (~lines 5587-5661), trimmed of the legacy `__mmSuppressChartInteractUntil`
// suppression (which gated analytics during OHLCV reloads — we emit
// CHART_LAYOUT_SETTLED on each reload directly, so analytics can ignore
// that gate).



const DEBOUNCE_MS = 450;
const PAN_SKIP_AFTER_ZOOM_MS = 500;
const debounce = {
    zoomTimer: null,
    panTimer: null,
    zoomLastFiredAt: 0,
};
function fireZoom() {
    if (!getWidget() || !isChartReady()) {
        return;
    }
    postToRN('CHART_INTERACTED', { interaction_type: 'zoom' });
    debounce.zoomLastFiredAt = Date.now();
}
function firePan() {
    if (!getWidget() || !isChartReady()) {
        return;
    }
    if (Date.now() - debounce.zoomLastFiredAt < PAN_SKIP_AFTER_ZOOM_MS) {
        return;
    }
    postToRN('CHART_INTERACTED', { interaction_type: 'pan' });
}
function scheduleZoom() {
    if (debounce.zoomTimer) {
        clearTimeout(debounce.zoomTimer);
    }
    debounce.zoomTimer = setTimeout(() => {
        debounce.zoomTimer = null;
        fireZoom();
    }, DEBOUNCE_MS);
}
function schedulePan() {
    if (Date.now() - debounce.zoomLastFiredAt < PAN_SKIP_AFTER_ZOOM_MS) {
        return;
    }
    if (debounce.panTimer) {
        clearTimeout(debounce.panTimer);
    }
    debounce.panTimer = setTimeout(() => {
        debounce.panTimer = null;
        firePan();
    }, DEBOUNCE_MS);
}
/**
 * Subscribes zoom (barSpacingChanged) and pan (onVisibleRangeChanged) to the
 * debounced CHART_INTERACTED emitters. Safe to call once per chart-ready.
 *
 * @param chart - The active TradingView chart to subscribe to.
 */
function attachVisibleRangeListeners(chart) {
    try {
        chart.getTimeScale().barSpacingChanged().subscribe(null, scheduleZoom);
    }
    catch (error) {
        reportErrorToRN(error);
    }
    try {
        chart.onVisibleRangeChanged().subscribe(null, () => {
            // Notify overlays (trade markers etc.) immediately so panned-in
            // shapes get re-placed without waiting on the analytics debounce.
            notifyDataLifecycle('visibleRangeChanged');
            schedulePan();
        });
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
/** Test-only: reset the debounce state between cases. */
function _resetVisibleRangeForTests() {
    if (debounce.zoomTimer) {
        clearTimeout(debounce.zoomTimer);
    }
    if (debounce.panTimer) {
        clearTimeout(debounce.panTimer);
    }
    debounce.zoomTimer = null;
    debounce.panTimer = null;
    debounce.zoomLastFiredAt = 0;
}
//# sourceMappingURL=visibleRange.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/messages/handler.mjs
// Inbound message dispatcher. Modules register typed handlers for the message
// types they own; the dispatcher routes incoming messages by `type`.
//
// Mirrors legacy chartLogic.js `handleMessage` (lines ~341-401) but inverts
// control: instead of a hard-coded switch, modules subscribe via
// registerHandler. This lets Phase 2/3/5/6 add message types without editing
// this file.
//
// Phase 1 routes SET_THEME_COLORS via widget/theme.ts.

const handlers = new Map();
/**
 * Register a handler for a single inbound message type. Subsequent calls
 * with the same type replace the previous handler (intentional — there's
 * one owner per message type by convention).
 *
 * @param type - The inbound message type to register a handler for.
 * @param handler - Callback invoked with the payload for that message type.
 */
function registerHandler(type, handler) {
    handlers.set(type, handler);
}
/**
 * Dispatches an incoming message to the registered handler. Unknown types
 * are silently dropped — future phases will add their handlers; the
 * dispatcher doesn't need to know what's coming.
 *
 * Errors inside a handler are forwarded to RN via ERROR.
 *
 * @param message - The inbound message to route to its registered handler.
 */
function dispatchInboundMessage(message) {
    const handler = handlers.get(message.type);
    if (!handler) {
        return;
    }
    try {
        handler(message.payload);
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
/** Test-only: clear all registered handlers. */
function _resetHandlersForTests() {
    handlers.clear();
}
//# sourceMappingURL=handler.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/core/timeUtils.mjs
// Time normalization helpers used across modules.
//
// Ported from chartLogic.js: normalizeChartUnixSec (line ~3564),
// chartRawTimeToUnixMs (line ~3573), getApproxBarDurationSec (line ~3587).
// Phase 2's widget/ohlcvIngestion.ts and pagination/priceApi.ts consume
// these.
/**
 * Convert a timestamp to unix seconds, accepting either ms or seconds.
 * Values ≥ 1e12 are treated as milliseconds (~Sep 2001 in seconds; safe
 * threshold). Returns null for non-finite input.
 *
 * @param value - A timestamp in seconds or milliseconds.
 * @returns The timestamp in unix seconds, or null when non-finite.
 */
function normalizeChartUnixSec(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return null;
    }
    return numericValue >= 1e12
        ? Math.floor(numericValue / 1000)
        : Math.floor(numericValue);
}
/**
 * Convert a raw TradingView timestamp to unix milliseconds. Unlike
 * normalizeChartUnixSec, keeps sub-second precision when the input is already
 * in seconds (multiplies by 1000 instead of flooring).
 *
 * @param value - A raw TradingView timestamp in seconds or milliseconds.
 * @returns The timestamp in unix milliseconds, or null when non-finite.
 */
function chartRawTimeToUnixMs(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return null;
    }
    if (numericValue >= 1e12) {
        return numericValue;
    }
    return numericValue * 1000;
}
const DEFAULT_BAR_DURATION_SEC = 300;
const MIN_BAR_DURATION_SEC = 60;
/**
 * Approximates the bar duration (seconds) for a series of OHLCV bars by
 * measuring the gap between the last two points. Used for visible-range
 * alignment and end-icon insets.
 *
 * Returns a sensible default when the series is too short.
 *
 * @param bars - The OHLCV bar series to measure.
 * @returns The approximate bar duration in seconds.
 */
function getApproxBarDurationSec(bars) {
    if (!bars || bars.length < 2) {
        return DEFAULT_BAR_DURATION_SEC;
    }
    const prev = bars.at(-2);
    const last = bars.at(-1);
    if (!prev || !last) {
        return DEFAULT_BAR_DURATION_SEC;
    }
    const lastMs = Math.abs(last.time - prev.time);
    return Math.max(MIN_BAR_DURATION_SEC, Math.round(lastMs / 1000));
}
//# sourceMappingURL=timeUtils.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/overlays/focusTime/index.mjs
// Slide-to-center-on-a-time overlay used by Social's "tap a trade row →
// center the chart on that trade" interaction.
//
// Ported from chartLogic.js `handleFocusTime` (~lines 3103-3205),
// including the ease-in-out-quart timing, the "already comfortably
// visible → don't move" inset check, and the generation token that
// cancels an in-flight slide when a newer FOCUS_TIME arrives.
//
// Since chrome / custom-crosshair suppression is gone in Phase 4, there
// is no `suppressChartUserInteraction` counterpart here — analytics
// gating during the animation lived in the deleted line-chrome path.




const ANIM_MS = 600;
const FALLBACK_BARS = 60;
/** A target inside this fraction of the visible span from either edge is "already visible". */
const VISIBLE_INSET = 0.08;
let animGeneration = 0;
function easeInOutQuart(progress) {
    return progress < 0.5
        ? 8 * progress * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 4) / 2;
}
function readVisibleRangeSec(chart) {
    if (typeof chart.getVisibleRange !== 'function') {
        return null;
    }
    try {
        const vr = chart.getVisibleRange();
        if (!vr) {
            return null;
        }
        const from = normalizeChartUnixSec(vr.from);
        const to = normalizeChartUnixSec(vr.to);
        if (from === null || to === null || to <= from) {
            return null;
        }
        return { from, to };
    }
    catch {
        return null;
    }
}
function applyRange(chart, from, to) {
    try {
        chart.setVisibleRange({ from, to });
    }
    catch {
        // TV may refuse a range while a resolution switch is mid-flight; drop.
    }
}
function handleFocusTime(payload) {
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    if (!payload || !Number.isFinite(payload.timeMs)) {
        return;
    }
    let chart;
    try {
        chart = widget.activeChart();
    }
    catch (error) {
        reportErrorToRN(error);
        return;
    }
    if (!chart || typeof chart.setVisibleRange !== 'function') {
        return;
    }
    const centerSec = payload.timeMs / 1000;
    const current = readVisibleRangeSec(chart);
    // Already comfortably visible → don't move (caller pulses separately).
    if (current) {
        const inset = (current.to - current.from) * VISIBLE_INSET;
        if (centerSec >= current.from + inset && centerSec <= current.to - inset) {
            return;
        }
    }
    let spanSec;
    if (Number.isFinite(payload.spanMs) && payload.spanMs > 0) {
        spanSec = payload.spanMs / 1000;
    }
    else if (getSlbMode()) {
        // SLB: default span covers the entire trade window so the focused
        // trade stays in context with all other trades visible.
        const slbFromMs = getVisibleFromMs();
        const slbToMs = getVisibleToMs();
        if (slbFromMs !== null && slbToMs !== null) {
            spanSec = (slbToMs - slbFromMs) / 1000;
        }
        else if (current) {
            spanSec = current.to - current.from;
        }
        else {
            spanSec = getApproxBarDurationSec(getOhlcvData()) * FALLBACK_BARS;
        }
    }
    else if (current) {
        spanSec = current.to - current.from;
    }
    else {
        spanSec = getApproxBarDurationSec(getOhlcvData()) * FALLBACK_BARS;
    }
    const targetFrom = centerSec - spanSec / 2;
    const targetTo = centerSec + spanSec / 2;
    animGeneration += 1;
    const gen = animGeneration;
    // Jump when animation is disabled or we have no start range to lerp from.
    if (payload.animate === false || !current) {
        applyRange(chart, targetFrom, targetTo);
        return;
    }
    const startFrom = current.from;
    const startTo = current.to;
    const startTs = Date.now();
    const step = () => {
        if (gen !== animGeneration) {
            return;
        }
        if (!getWidget() || !isChartReady()) {
            return;
        }
        const elapsed = Date.now() - startTs;
        const progress = elapsed >= ANIM_MS ? 1 : elapsed / ANIM_MS;
        const eased = easeInOutQuart(progress);
        applyRange(chart, startFrom + (targetFrom - startFrom) * eased, startTo + (targetTo - startTo) * eased);
        if (progress < 1) {
            try {
                requestAnimationFrame(step);
            }
            catch {
                setTimeout(step, 16);
            }
        }
    };
    try {
        requestAnimationFrame(step);
    }
    catch {
        applyRange(chart, targetFrom, targetTo);
    }
}
function registerFocusTimeOverlay() {
    registerHandler('FOCUS_TIME', (payload) => {
        handleFocusTime(payload);
    });
}
/** Test-only: reset the animation generation counter. */
function _resetFocusTimeForTests() {
    animGeneration = 0;
}
//# sourceMappingURL=index.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/overlays/positionLines/state.mjs
// Module-local state for position line shape IDs.
// Kept separate from core/state.ts per convention: overlay-specific state
// lives in the overlay's own state module.
let shapeIds = [];
let generation = 0;
function getPositionShapeIds() {
    return shapeIds;
}
function pushPositionShapeId(id) {
    shapeIds.push(id);
}
function clearPositionShapeIds() {
    shapeIds = [];
}
function bumpGeneration() {
    generation += 1;
    return generation;
}
function getGeneration() {
    return generation;
}
function _resetPositionLineStateForTests() {
    shapeIds = [];
    generation = 0;
}
//# sourceMappingURL=state.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/overlays/positionLines/index.mjs
// Position lines overlay (Perps). Renders horizontal dashed lines for entry,
// take-profit, stop-loss, liquidation, and optionally a current-price line.
//
// Ported from chartLogic.js handleSetPositionLines (~line 2624),
// clearPositionLines (~line 2608), and positionShapeIds state.





function clearPositionLines() {
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        clearPositionShapeIds();
        return;
    }
    const chart = widget.activeChart();
    for (const id of getPositionShapeIds()) {
        try {
            chart.removeEntity(id);
        }
        catch {
            // Shape may already be gone after resetData
        }
    }
    clearPositionShapeIds();
}
function handleSetPositionLines(payload) {
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    bumpGeneration();
    clearPositionLines();
    if (!payload?.position) {
        setHasExplicitCurrentPriceLine(false);
        try {
            widget.applyOverrides({
                'mainSeriesProperties.showPriceLine': true,
            });
        }
        catch {
            // Best-effort
        }
        return;
    }
    const { position } = payload;
    setHasExplicitCurrentPriceLine(Boolean(position.currentPrice));
    try {
        widget.applyOverrides({
            'mainSeriesProperties.showPriceLine': !getHasExplicitCurrentPriceLine(),
        });
    }
    catch {
        // Best-effort
    }
    const theme = getTheme();
    if (!theme) {
        return;
    }
    const colors = payload.positionLineColors ?? {};
    const currentPriceColor = colors.currentPrice ??
        getThemeLastPriceLineColor(theme);
    const entryColor = colors.entry || theme.borderColor;
    const takeProfitColor = colors.takeProfit || theme.successColor;
    const stopLossColor = colors.stopLoss || theme.borderColor;
    const liquidationColor = colors.liquidation || theme.errorColor;
    const lines = [];
    if (position.currentPrice) {
        lines.push({
            price: position.currentPrice,
            color: currentPriceColor,
            lineStyle: 2,
            lineWidth: 1,
            showLabel: false,
            showPrice: false,
            horzLabelsAlign: 'right',
        });
    }
    if (position.entryPrice) {
        lines.push({
            price: position.entryPrice,
            text: 'Entry',
            color: entryColor,
            lineStyle: 2,
            lineWidth: 1,
            showLabel: true,
            showPrice: true,
            horzLabelsAlign: 'left',
        });
    }
    if (position.takeProfitPrice) {
        lines.push({
            price: position.takeProfitPrice,
            text: 'TP',
            color: takeProfitColor,
            lineStyle: 2,
            lineWidth: 1,
            showLabel: true,
            showPrice: true,
            horzLabelsAlign: 'left',
        });
    }
    if (position.stopLossPrice) {
        lines.push({
            price: position.stopLossPrice,
            text: 'SL',
            color: stopLossColor,
            lineStyle: 2,
            lineWidth: 1,
            showLabel: true,
            showPrice: true,
            horzLabelsAlign: 'left',
        });
    }
    if (position.liquidationPrice) {
        lines.push({
            price: position.liquidationPrice,
            text: 'Liq',
            color: liquidationColor,
            lineStyle: 2,
            lineWidth: 1,
            showLabel: true,
            showPrice: true,
            horzLabelsAlign: 'left',
        });
    }
    try {
        const chart = widget.activeChart();
        const gen = getGeneration();
        for (const line of lines) {
            chart
                .createShape({ price: line.price }, {
                shape: 'horizontal_line',
                lock: true,
                disableSelection: true,
                disableSave: true,
                disableUndo: true,
                ...(line.text !== undefined && line.text !== null
                    ? { text: line.text }
                    : {}),
                overrides: {
                    linecolor: line.color,
                    linestyle: line.lineStyle,
                    linewidth: line.lineWidth,
                    showLabel: line.showLabel,
                    textcolor: line.color,
                    fontsize: 11,
                    horzLabelsAlign: line.horzLabelsAlign,
                    showPrice: line.showPrice,
                },
            })
                .then((entityId) => {
                if (!entityId) {
                    return undefined;
                }
                if (getGeneration() !== gen) {
                    try {
                        chart.removeEntity(entityId);
                    }
                    catch {
                        // Shape may already be gone
                    }
                    return undefined;
                }
                pushPositionShapeId(entityId);
                return undefined;
            })
                .catch(() => {
                // Shape creation can fail silently
            });
        }
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
function registerPositionLinesOverlay() {
    registerHandler('SET_POSITION_LINES', (payload) => {
        handleSetPositionLines(payload);
    });
}
//# sourceMappingURL=index.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/overlays/socialLeaderboard/index.mjs
// Social Leaderboard (SLB) viewport centering and back-fill pagination.
//
// Implements **Strategy C — SLB bulk back-fill**, the third pagination
// strategy alongside Strategy A (Price API / Token Details) and Strategy B
// (RN-backed / Perps).
//
// ── How it works ──────────────────────────────────────────────────────────
//
//   1. RN pre-loads the complete OHLCV dataset that covers the trade window
//      (visibleFromMs → visibleToMs) and sends it in one SET_OHLCV_DATA
//      message with `slbMode: true`.
//
//   2. The WebView stores the data in core/state and marks viewport centering
//      as pending (`slbCenteringPending = true`).
//
//   3. After the TradingView widget finishes its data load cycle, this module
//      centers the viewport on the trade window so the user sees all relevant
//      trades immediately (no manual scrolling needed).
//
//   4. getBars pagination is a no-op: because RN pre-loaded all data, any
//      getBars call for a time range outside the in-memory dataset returns
//      `{ noData: true }`. There is no second fetch — the dataset is complete.
//
//   5. When the user taps a different trade row, RN re-sends SET_OHLCV_DATA
//      with updated visibleFromMs / visibleToMs. The centering flag resets,
//      and step 3 fires again for the new window.
//
// ── Why a separate strategy? ──────────────────────────────────────────────
//
//   Strategy A (Price API) and Strategy B (RN-backed) both paginate
//   incrementally — fetching one page at a time as the user scrolls left.
//   SLB needs the entire trade window visible from the start, so incremental
//   pagination would cause visible "holes" while pages load. Bulk back-fill
//   avoids this by having RN send all data upfront.
//
// ── Scoping via slbMode ──────────────────────────────────────────────────
//
//   All SLB behavior is gated behind the `slbMode` flag so it cannot affect
//   Token Details, Perps, or any other consumer. When `slbMode` is false
//   (or omitted), this module is inert.



/**
 * How long (ms) to keep re-asserting the centered visible range for a
 * historical frame. A one-shot `setVisibleRange` issued during the post-load
 * settle is overridden by TradingView's default "scroll to latest" positioning,
 * so we re-apply every animation frame for this window — the same thing the
 * animated focusTime slide does implicitly, which a single auto-center call did
 * not. Kept short so it never fights a real user gesture.
 */
const CENTER_HOLD_MS = 700;
/** Bumped on each hold so a newer center / fresh series cancels an in-flight hold. */
let centerHoldGeneration = 0;
/**
 * Re-asserts `setVisibleRange({ from, to })` every animation frame for
 * {@link CENTER_HOLD_MS}, defeating TradingView's post-load scroll-to-latest
 * that clobbers a single call. Generation- and data-guarded so a newer center
 * or a fresh series stops it; no-ops once the widget is torn down.
 *
 * Deliberately omits the `{ percentRightMargin: 0 }` option: passing it makes
 * TradingView anchor to the latest candle and ignore an older from/to, so a
 * historical frame (an old position's trades) would snap back to "today".
 *
 * @param chart - The active TradingView chart.
 * @param fromSec - Left edge of the range, in unix seconds.
 * @param toSec - Right edge of the range, in unix seconds.
 */
function holdCenteredVisibleRange(chart, fromSec, toSec) {
    centerHoldGeneration += 1;
    const gen = centerHoldGeneration;
    const dataGeneration = getOhlcvGeneration();
    const startTs = Date.now();
    const apply = () => {
        if (gen !== centerHoldGeneration) {
            return;
        }
        if (dataGeneration !== getOhlcvGeneration()) {
            return;
        }
        if (!getWidget() || !isChartReady()) {
            return;
        }
        try {
            chart.setVisibleRange({ from: fromSec, to: toSec });
        }
        catch {
            // setVisibleRange can throw every frame while the chart is mid-teardown;
            // swallow silently so the hold window doesn't spam errors to RN.
        }
        if (Date.now() - startTs < CENTER_HOLD_MS) {
            try {
                requestAnimationFrame(apply);
            }
            catch {
                setTimeout(apply, 16);
            }
        }
    };
    apply();
}
/**
 * Centers the viewport on the SLB trade window after a data load.
 *
 * Called from ohlcvIngestion's `applyVisibleRange` when `slbMode` is active.
 * Uses `visibleFromMs` / `visibleToMs` to frame the viewport, with a 2-bar
 * padding on each side so the edge candles aren't glued to the chart border.
 *
 * The centering flag is cleared after success so subsequent REALTIME_UPDATE
 * messages don't re-trigger the slide. Only a fresh SET_OHLCV_DATA resets it.
 *
 * When `options.immediate` is true, applies centering synchronously instead of
 * waiting for `onDataLoaded`. Used after `setResolution` where TradingView has
 * already completed its data cycle by the time the callback fires.
 *
 * @param chart - The active TradingView chart.
 * @param options - Optional centering options.
 * @param options.immediate - When true, centers synchronously.
 */
function slbCenterViewport(chart, options) {
    if (!getSlbMode() || !isSlbCenteringPending()) {
        return;
    }
    const fromMs = getVisibleFromMs();
    const toMs = getVisibleToMs();
    if (fromMs === null || toMs === null) {
        return;
    }
    const capturedGeneration = getOhlcvGeneration();
    const applyCenter = () => {
        if (capturedGeneration !== getOhlcvGeneration()) {
            return;
        }
        if (!isSlbCenteringPending()) {
            return;
        }
        const data = getOhlcvData();
        const barPadSec = getApproxBarDurationSec(data) * 2;
        const fromSec = Math.floor(fromMs / 1000) - barPadSec;
        const toSec = Math.ceil(toMs / 1000) + barPadSec;
        // A frame whose right edge sits before the latest loaded bar is a historical
        // position (an old, closed trade range). TradingView's post-load
        // scroll-to-latest clobbers a single `setVisibleRange`, and
        // `percentRightMargin: 0` re-anchors it to the latest candle — together they
        // snap the viewport back to "today" and push the trades off-screen. Re-assert
        // the range across the settle window (without that option) so the historical
        // frame sticks. A frame ending at/after the latest bar is the trailing window:
        // TV doesn't fight it, so a single anchored call is enough.
        const lastBar = data.at(-1);
        const lastBarSec = lastBar === undefined ? null : Math.floor(lastBar.time / 1000);
        const isHistoricalFrame = lastBarSec !== null && Math.ceil(toMs / 1000) < lastBarSec;
        try {
            if (isHistoricalFrame) {
                holdCenteredVisibleRange(chart, fromSec, toSec);
            }
            else {
                chart.setVisibleRange({ from: fromSec, to: toSec }, { percentRightMargin: 0 });
            }
            setSlbCenteringPending(false);
        }
        catch (error) {
            reportErrorToRN(error);
        }
    };
    if (options?.immediate) {
        applyCenter();
        return;
    }
    const subscription = chart.onDataLoaded();
    const onLoaded = () => {
        subscription.unsubscribe(null, onLoaded);
        applyCenter();
    };
    subscription.subscribe(null, onLoaded);
}
/** Test-only: reset the center-hold generation counter between cases. */
function _resetSocialLeaderboardForTests() {
    centerHoldGeneration = 0;
}
/**
 * Schedules SLB viewport centering after the initial chart-ready event.
 *
 * Called from bootstrap's `onReady` callback. Only fires when the chart
 * loaded with `slbMode` active — for all other consumers this is a no-op.
 */
function slbScheduleInitialCentering() {
    if (!getSlbMode() || !isSlbCenteringPending()) {
        return;
    }
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    try {
        const chart = widget.activeChart();
        slbCenterViewport(chart);
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
/**
 * SLB back-fill pagination handler for datafeed.ts getBars.
 *
 * In SLB mode, RN has already sent the complete dataset — there is nothing
 * to fetch. This function simply signals `noData: true` to TradingView,
 * which stops it from requesting more bars.
 *
 * Returns `true` if it handled the request (caller should return early),
 * or `false` if the caller should fall through to the other strategies.
 *
 * @param onResult - TradingView getBars result callback.
 * @returns `true` when handled, `false` to fall through to other strategies.
 */
function slbHandleGetBars(onResult) {
    if (!getSlbMode()) {
        return false;
    }
    onResult([], { noData: true });
    return true;
}
//# sourceMappingURL=index.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/overlays/tradeMarkers/state.mjs
// Module-local state for the Social trade-marker overlay.
//
// Replaces legacy globals `window.tradeMarkerShapeIds`,
// `window.tradeMarkerShapeIdsById`, `window.tradeMarkersData`,
// `window.__tradeMarkerGen`, `window.__tradeMarkerPulseGen` from
// chartLogic.js (lines 29-33, 2649, 2900). Confined to this folder so
// no other module can read or mutate it — the trade-marker lifecycle is
// entirely owned here.
const state_state = {
    shapeIds: [],
    shapesByMarkerId: new Map(),
    markers: null,
    placementGeneration: 0,
    pulseGeneration: 0,
};
function getShapeIds() {
    return state_state.shapeIds;
}
function pushShapeId(id) {
    state_state.shapeIds.push(id);
}
function clearShapes() {
    state_state.shapeIds = [];
    state_state.shapesByMarkerId = new Map();
}
function getShapesByMarkerId() {
    return state_state.shapesByMarkerId;
}
function setShapesForMarkerId(id, pair) {
    state_state.shapesByMarkerId.set(id, pair);
}
function getMarkers() {
    return state_state.markers;
}
function setMarkers(markers) {
    state_state.markers = markers;
}
function bumpPlacementGeneration() {
    state_state.placementGeneration += 1;
    return state_state.placementGeneration;
}
function getPlacementGeneration() {
    return state_state.placementGeneration;
}
function bumpPulseGeneration() {
    state_state.pulseGeneration += 1;
    return state_state.pulseGeneration;
}
function getPulseGeneration() {
    return state_state.pulseGeneration;
}
/** Test-only: reset every slice between test cases. */
function _resetTradeMarkerStateForTests() {
    state_state.shapeIds = [];
    state_state.shapesByMarkerId = new Map();
    state_state.markers = null;
    state_state.placementGeneration = 0;
    state_state.pulseGeneration = 0;
}
//# sourceMappingURL=state.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/overlays/tradeMarkers/index.mjs
// Social trade-marker overlay: places colored circles (with black rings)
// on the chart for each of the user's trades, at the price of the candle
// their trade timestamp falls in.
//
// Ported from chartLogic.js (~lines 2633-2896):
//   TRADE_MARKER_ICON, TRADE_MARKER_SIZE, TRADE_MARKER_RING_SIZE,
//   TRADE_MARKER_RING_COLOR, createTradeMarkerIcon, clearTradeMarkers,
//   handleSetTradeMarkers, placeTradeMarkers, scheduleTradeMarkerRefresh.
//
// State lives in ./state.ts (no window.* globals). The overlay reacts to
// three data-lifecycle events emitted by widget/pagination/interaction
// modules — see registerTradeMarkerOverlay(). Overlays never import from
// widget/*; the lifecycle bus decouples them.
//
// Sequential ring/fill draw order: creating ring1, fill1, ring2, fill2, …
// with every shape at zOrder 'top' keeps a black rim visible between
// touching circles (otherwise adjacent fills merge into one blob).





/** FontAwesome fa-circle glyph — same icon used elsewhere for the line-end dot. */
const TRADE_MARKER_ICON = 0xf111;
/** Inner colored circle diameter (px). */
const TRADE_MARKER_SIZE = 10;
/** Outer ring diameter (px). The colored circle sits on top, leaving a ~2px rim. */
const TRADE_MARKER_RING_SIZE = 14;
/** Ring/outline color drawn behind every colored circle. */
const TRADE_MARKER_RING_COLOR = 'rgb(0, 0, 0)';
/** Debounce delay for a re-placement after pan / zoom / pagination. */
const REFRESH_DEBOUNCE_MS = 150;
let refreshDebounce = null;
/**
 * Bar (from `data`) closest in time to `tMs`. Ties favor the earlier bar
 * — the candle the trade actually falls within. Returns null when the
 * series is empty, `tMs` is non-finite, or the nearest close is not a
 * number.
 *
 * @param data - The OHLCV bar series to search.
 * @param tMs - The target time in milliseconds.
 * @returns The nearest bar's time (seconds) and close, or null.
 */
function snapMarkerToNearestBar(data, tMs) {
    if (!data.length || !Number.isFinite(tMs)) {
        return null;
    }
    let lo = 0;
    let hi = data.length - 1;
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (data[mid].time < tMs) {
            lo = mid + 1;
        }
        else {
            hi = mid;
        }
    }
    let best = lo;
    if (lo > 0) {
        const prevDiff = tMs - data[lo - 1].time;
        const curDiff = data[lo].time - tMs;
        if (prevDiff <= curDiff) {
            best = lo - 1;
        }
    }
    const close = Number(data[best].close);
    if (!Number.isFinite(close)) {
        return null;
    }
    return { timeSec: Math.floor(data[best].time / 1000), close };
}
function createTradeMarkerIcon(chart, timeSec, price, color, size) {
    return chart.createShape({ time: timeSec, price }, {
        shape: 'icon',
        icon: TRADE_MARKER_ICON,
        lock: true,
        overrides: { color, size },
        disableSelection: true,
        disableSave: true,
        disableUndo: true,
        showInObjectsTree: false,
        zOrder: 'top',
    });
}
function removeEntitySafe(chart, entityId) {
    if (!entityId) {
        return;
    }
    try {
        chart.removeEntity(entityId);
    }
    catch {
        // Shape may already be removed.
    }
}
function clearTradeMarkers() {
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    try {
        const chart = widget.activeChart();
        for (const id of getShapeIds()) {
            try {
                chart.removeEntity(id);
            }
            catch {
                // Already removed.
            }
        }
        clearShapes();
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
function handleSetTradeMarkers(payload) {
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        // Not ready yet — stash the markers and place them once the widget
        // reports ready via the ohlcvReset lifecycle event.
        setMarkers(payload?.markers?.length ? payload.markers : null);
        return;
    }
    setMarkers(payload?.markers?.length ? payload.markers : null);
    if (getMarkers() === null) {
        clearTradeMarkers();
        return;
    }
    placeTradeMarkers();
}
function resolveSnappedPrice(snapped, markerPrice) {
    if (snapped !== null) {
        return snapped.close;
    }
    if (markerPrice !== undefined && Number.isFinite(markerPrice)) {
        return markerPrice;
    }
    return null;
}
function collectDesiredMarkers(markers, data, theme) {
    if (!data.length) {
        return [];
    }
    const firstT = data[0].time;
    const lastBar = data.at(-1);
    if (!lastBar) {
        return [];
    }
    const lastT = lastBar.time;
    const eligible = markers.filter((marker) => marker?.id !== undefined &&
        marker?.id !== null &&
        Number.isFinite(marker.time) &&
        marker.time >= firstT &&
        marker.time <= lastT);
    const ordered = eligible.slice().sort((a, b) => a.time - b.time);
    const desired = [];
    for (const marker of ordered) {
        const snapped = snapMarkerToNearestBar(data, marker.time);
        const timeSec = snapped ? snapped.timeSec : Math.floor(marker.time / 1000);
        const rawPrice = resolveSnappedPrice(snapped, marker.price);
        if (rawPrice === null) {
            continue;
        }
        const color = marker.intent === 'exit' ? theme.errorColor : theme.successColor;
        desired.push({
            id: String(marker.id),
            timeSec,
            price: rawPrice,
            color,
        });
    }
    return desired;
}
function placeTradeMarkers() {
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    let chart;
    try {
        chart = widget.activeChart();
    }
    catch (error) {
        reportErrorToRN(error);
        return;
    }
    if (!chart) {
        return;
    }
    const markers = getMarkers() ?? [];
    const data = getOhlcvData();
    if (!data.length) {
        return;
    } // no candles loaded yet — re-runs after data / pan
    const theme = getTheme();
    if (!theme) {
        return;
    }
    const desired = collectDesiredMarkers(markers, data, theme);
    // Skip when the drawn set already matches — prevents pan flicker.
    const desiredKey = desired
        .map((desiredMarker) => desiredMarker.id)
        .sort((a, b) => a.localeCompare(b))
        .join('|');
    const drawnKey = Array.from(getShapesByMarkerId().keys())
        .sort((a, b) => a.localeCompare(b))
        .join('|');
    if (desiredKey === drawnKey) {
        return;
    }
    const gen = bumpPlacementGeneration();
    clearTradeMarkers();
    const paint = () => {
        if (gen !== getPlacementGeneration()) {
            return;
        }
        if (!getWidget() || !isChartReady()) {
            return;
        }
        let activeChart;
        try {
            activeChart = widget.activeChart();
        }
        catch (error) {
            reportErrorToRN(error);
            return;
        }
        if (!activeChart) {
            return;
        }
        // Draw ring1 → fill1 → ring2 → fill2 sequentially. Every new shape is
        // created at zOrder 'top', so the next ring lands ON TOP of the
        // previous fill — keeps a black seam between touching circles.
        const drawRingAndFill = async (marker) => {
            if (gen !== getPlacementGeneration()) {
                return;
            }
            const ringId = await createTradeMarkerIcon(activeChart, marker.timeSec, marker.price, TRADE_MARKER_RING_COLOR, TRADE_MARKER_RING_SIZE);
            if (gen !== getPlacementGeneration()) {
                removeEntitySafe(activeChart, ringId);
                return;
            }
            const fillId = await createTradeMarkerIcon(activeChart, marker.timeSec, marker.price, marker.color, TRADE_MARKER_SIZE);
            if (gen !== getPlacementGeneration()) {
                removeEntitySafe(activeChart, ringId);
                removeEntitySafe(activeChart, fillId);
                return;
            }
            if (ringId) {
                pushShapeId(ringId);
            }
            if (fillId) {
                pushShapeId(fillId);
            }
            setShapesForMarkerId(marker.id, {
                fill: fillId ?? null,
                ring: ringId ?? null,
            });
        };
        let chain = Promise.resolve();
        for (const marker of desired) {
            chain = chain.then(() => drawRingAndFill(marker));
        }
        chain.catch(() => {
            // Swallow — createShape failures are non-fatal for individual markers.
        });
    };
    // Defer to dataReady when available so createShape has bars to snap X to.
    try {
        if (typeof chart.dataReady === 'function') {
            chart.dataReady(paint);
        }
        else {
            paint();
        }
    }
    catch {
        paint();
    }
}
function scheduleTradeMarkerRefresh() {
    if (!getMarkers()) {
        return;
    }
    if (refreshDebounce) {
        clearTimeout(refreshDebounce);
    }
    refreshDebounce = setTimeout(() => {
        refreshDebounce = null;
        placeTradeMarkers();
    }, REFRESH_DEBOUNCE_MS);
}
/**
 * Wires the trade-marker message handlers and lifecycle subscriptions.
 * Called once from bootstrap. Idempotent registerHandler replaces prior
 * bindings — safe to call twice in tests without leaking listeners.
 */
function registerTradeMarkerOverlay() {
    registerHandler('SET_TRADE_MARKERS', (payload) => {
        handleSetTradeMarkers(payload);
    });
    // OHLCV reset drops every shape entity — clear our tracking (so
    // placeTradeMarkers doesn't skip a redraw with a matching id set) and
    // re-schedule a draw once the new data lands.
    onDataLifecycle('ohlcvReset', () => {
        clearShapes();
        scheduleTradeMarkerRefresh();
    });
    // Older history paginated in → draw any markers that now sit in range.
    onDataLifecycle('ohlcvPrepended', scheduleTradeMarkerRefresh);
    // Pan / zoom may bring previously off-screen markers into the loaded
    // range — re-place after the debounce settles.
    onDataLifecycle('visibleRangeChanged', scheduleTradeMarkerRefresh);
}
/** Test-only: clear any pending refresh so timers don't leak between cases. */
function _resetTradeMarkerRefreshForTests() {
    if (refreshDebounce) {
        clearTimeout(refreshDebounce);
    }
    refreshDebounce = null;
}
//# sourceMappingURL=index.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/overlays/tradeMarkers/animation.mjs
// Pulse animation for a specific trade marker.
//
// Ported from chartLogic.js `handlePulseTradeMarker` (~lines 2915-3001).
// Decaying |sin| envelope over ~1.1s, two humps that shrink back to the
// base size. A generation token cancels an in-flight pulse when a newer
// pulse (or a full marker rebuild) starts, so we never leave a shape
// stuck at the peak size.





/** Pulse duration (ms). */
const PULSE_MS = 1100;
/** Peak (colored-circle) size at the crest of a pulse. */
const PULSE_PEAK = 22;
/** Number of grow/shrink humps over the animation. */
const PULSE_CYCLES = 2;
function getShape(chart, id) {
    if (id === null || typeof chart.getShapeById !== 'function') {
        return null;
    }
    try {
        return chart.getShapeById(id);
    }
    catch {
        return null;
    }
}
function setSize(shape, size) {
    if (!shape) {
        return;
    }
    try {
        shape.setProperties({ size: Math.round(size) });
    }
    catch {
        // TV shape may have been destroyed between frames — swallow.
    }
}
function handlePulseTradeMarker(payload) {
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    if (payload?.id === null || payload?.id === undefined) {
        return;
    }
    const markerId = String(payload.id);
    const record = getShapesByMarkerId().get(markerId);
    if (!record) {
        return;
    }
    const { fill: fillId, ring: ringId } = record;
    if (fillId === null && ringId === null) {
        return;
    }
    let chart;
    try {
        chart = widget.activeChart();
    }
    catch (error) {
        reportErrorToRN(error);
        return;
    }
    const fillShape = getShape(chart, fillId);
    const ringShape = getShape(chart, ringId);
    if (!fillShape && !ringShape) {
        return;
    }
    const gen = bumpPulseGeneration();
    const startTs = Date.now();
    // Ring grows proportionally so the rim stays even.
    const ringRatio = TRADE_MARKER_RING_SIZE / TRADE_MARKER_SIZE;
    const applySize = (fillSize) => {
        setSize(fillShape, fillSize);
        setSize(ringShape, fillSize * ringRatio);
    };
    const step = () => {
        if (gen !== getPulseGeneration()) {
            return;
        }
        if (!getWidget() || !isChartReady()) {
            return;
        }
        // Abort if the markers were rebuilt — record ids now point elsewhere.
        const current = getShapesByMarkerId().get(markerId);
        if (current?.fill !== fillId || current?.ring !== ringId) {
            return;
        }
        const elapsed = (Date.now() - startTs) / PULSE_MS;
        if (elapsed >= 1) {
            applySize(TRADE_MARKER_SIZE);
            return;
        }
        const envelope = Math.abs(Math.sin(Math.PI * PULSE_CYCLES * elapsed)) * (1 - elapsed);
        applySize(TRADE_MARKER_SIZE + (PULSE_PEAK - TRADE_MARKER_SIZE) * envelope);
        try {
            requestAnimationFrame(step);
        }
        catch {
            setTimeout(step, 16);
        }
    };
    try {
        requestAnimationFrame(step);
    }
    catch {
        applySize(TRADE_MARKER_SIZE);
    }
}
/** Registers the PULSE_TRADE_MARKER message handler. Called from bootstrap. */
function registerTradeMarkerPulseHandler() {
    registerHandler('PULSE_TRADE_MARKER', (payload) => {
        handlePulseTradeMarker(payload);
    });
}
//# sourceMappingURL=animation.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/overlays/tradeMarkers/markerHitTest.mjs
// Marker tap detection — turns a chart press into a TRADE_MARKER_PRESSED
// message so the RN side can scroll the trades list to the pressed trade.
//
// Ported from chartLogic.js:
//   findTradeMarkerIdNearPoint (~lines 3007-3072),
//   crossHairMoved + mouse_up handlers (~lines 5692-5762).
//
// This owns its own crossHairMoved + mouse_up subscriptions rather than
// piggy-backing on interaction/crosshair.ts, so overlays/tradeMarkers
// stays self-contained and interaction/* has no knowledge of the
// overlay's data.





/** Pixel radius (Euclidean) for matching a tap to a marker. */
const TAP_RADIUS_PX = 26;
/** Max delay between last crosshair point and mouse_up to consider it a tap. */
const TAP_MAX_AGE_MS = 700;
let lastTapPoint = null;
/**
 * Extract a normalized time range from a TradingView bar/visible range result.
 * Returns the range or null if the values are missing or non-normalizable.
 *
 * @param raw - The raw TradingView range (`{ from, to }`) or nullish.
 * @returns The normalized `{ lo, hi }` range in seconds, or null.
 */
function normalizeRange(raw) {
    if (raw?.from === undefined || raw?.to === undefined) {
        return null;
    }
    const from = normalizeChartUnixSec(raw.from);
    const to = normalizeChartUnixSec(raw.to);
    if (from === null || to === null) {
        return null;
    }
    return { lo: Math.min(from, to), hi: Math.max(from, to) };
}
function getVisibleTimeRangeSec(chart) {
    try {
        if (typeof chart.getVisibleBarsRange === 'function') {
            const result = normalizeRange(chart.getVisibleBarsRange());
            if (result) {
                return result;
            }
        }
    }
    catch {
        // fall through to getVisibleRange
    }
    try {
        if (typeof chart.getVisibleRange === 'function') {
            return normalizeRange(chart.getVisibleRange());
        }
    }
    catch {
        return null;
    }
    return null;
}
/**
 * Compute the Y coordinate for a price given a linear price scale.
 * Returns null when the height is non-positive or the scale range is degenerate.
 *
 * @param lo - Lower bound of the visible price range.
 * @param hi - Upper bound of the visible price range.
 * @param price - The price to map to a Y coordinate.
 * @param height - The pane height in pixels.
 * @param inverted - Whether the price scale is inverted.
 * @returns The Y coordinate in pixels.
 */
function linearPriceToY(lo, hi, price, height, inverted) {
    if (inverted) {
        return ((price - lo) / (hi - lo)) * height;
    }
    return ((hi - price) / (hi - lo)) * height;
}
/**
 * Compute the Y coordinate for a price given a logarithmic price scale.
 * Returns null when any value is non-positive or the log range is degenerate.
 *
 * @param lo - Lower bound of the visible price range.
 * @param hi - Upper bound of the visible price range.
 * @param price - The price to map to a Y coordinate.
 * @param height - The pane height in pixels.
 * @param inverted - Whether the price scale is inverted.
 * @returns The Y coordinate in pixels.
 */
function logPriceToY(lo, hi, price, height, inverted) {
    const logLo = Math.log(lo);
    const logHi = Math.log(hi);
    const logP = Math.log(price);
    if (logHi === logLo) {
        return inverted ? 0 : height / 2;
    }
    const ratio = (logP - logLo) / (logHi - logLo);
    return inverted ? ratio * height : (1 - ratio) * height;
}
/**
 * Y coordinate (main-pane overlay pixels) for a price. Mirrors chartLogic.js
 * `getPriceYForLastCloseOverlay`. Returns null when the pane / scale /
 * range isn't available. Log-scale mode uses log mapping.
 *
 * @param chart - The active TradingView chart.
 * @param price - The price to map to a Y coordinate.
 * @returns The Y coordinate in main-pane overlay pixels, or null.
 */
function priceToY(chart, price) {
    if (!Number.isFinite(price)) {
        return null;
    }
    if (typeof chart.getPanes !== 'function') {
        return null;
    }
    try {
        const panes = chart.getPanes();
        if (!panes?.length) {
            return null;
        }
        const pane = panes[0];
        const scale = pane.getMainSourcePriceScale();
        if (!scale) {
            return null;
        }
        const range = scale.getVisiblePriceRange();
        if (range?.from === undefined || range?.to === undefined) {
            return null;
        }
        const lo = Math.min(range.from, range.to);
        const hi = Math.max(range.from, range.to);
        const height = pane.getHeight();
        if (!height || height <= 0) {
            return null;
        }
        const clamped = Math.min(hi, Math.max(lo, price));
        const inverted = typeof scale.isInverted === 'function' && scale.isInverted();
        const mode = typeof scale.getMode === 'function' ? scale.getMode() : 0;
        if (mode === 1 && lo > 0 && hi > 0 && clamped > 0) {
            return logPriceToY(lo, hi, clamped, height, inverted);
        }
        return linearPriceToY(lo, hi, clamped, height, inverted);
    }
    catch {
        return null;
    }
}
/**
 * Resolve the plot width (in pixels) from the chart's time scale.
 *
 * @param chart - The active TradingView chart.
 * @returns The plot width in pixels, or 0 when unavailable.
 */
function getPlotWidth(chart) {
    try {
        const ts = chart.getTimeScale();
        if (ts && typeof ts.width === 'function') {
            return ts.width();
        }
    }
    catch {
        // ignore — caller treats 0 as unavailable
    }
    return 0;
}
/**
 * Resolve the price to use for Y-distance calculation for a marker.
 * Returns null when no usable price is available.
 *
 * @param snapped - The snapped bar (`{ close }`) or null.
 * @param markerPrice - The marker's own price, if any.
 * @returns The resolved price, or null when none is usable.
 */
function resolveMarkerPrice(snapped, markerPrice) {
    if (snapped !== null) {
        return snapped.close;
    }
    if (markerPrice !== undefined &&
        markerPrice !== null &&
        Number.isFinite(markerPrice)) {
        return markerPrice;
    }
    return null;
}
/**
 * Compute the Y pixel distance between a marker and the tap point.
 * Returns 0 when Y cannot be determined (falls back to X-only matching).
 *
 * @param chart - The active TradingView chart.
 * @param offsetY - The tap Y offset in pixels, if any.
 * @param snapped - The snapped bar for the marker, or null.
 * @param markerPrice - The marker's own price, if any.
 * @returns The signed Y pixel distance, or 0 when undeterminable.
 */
function computeYDistance(chart, offsetY, snapped, markerPrice) {
    if (offsetY === undefined || !Number.isFinite(offsetY)) {
        return 0;
    }
    const price = resolveMarkerPrice(snapped, markerPrice);
    if (price === null) {
        return 0;
    }
    const markerY = priceToY(chart, price);
    if (markerY === null || !Number.isFinite(markerY)) {
        return 0;
    }
    return markerY - offsetY;
}
function computeMarkerDistance(ctx, marker) {
    if (marker?.id === undefined ||
        marker?.id === null ||
        !Number.isFinite(marker?.time)) {
        return null;
    }
    const markerKey = String(marker.id);
    if (!ctx.drawn.has(markerKey)) {
        return null;
    }
    const snapped = snapMarkerToNearestBar(ctx.data, marker.time);
    const mSec = snapped ? snapped.timeSec : marker.time / 1000;
    if (mSec < ctx.range.lo || mSec > ctx.range.hi) {
        return null;
    }
    const dxPx = (mSec - ctx.timeSec) * ctx.pxPerSec;
    const dyPx = computeYDistance(ctx.chart, ctx.offsetY, snapped, marker.price);
    return { key: markerKey, dist: Math.hypot(dxPx, dyPx) };
}
function findTradeMarkerIdNearPoint(timeSec, offsetY) {
    const markers = getMarkers();
    if (!markers?.length) {
        return null;
    }
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return null;
    }
    if (!Number.isFinite(timeSec)) {
        return null;
    }
    let chart;
    try {
        chart = widget.activeChart();
    }
    catch {
        return null;
    }
    if (!chart) {
        return null;
    }
    const range = getVisibleTimeRangeSec(chart);
    if (!range || range.hi <= range.lo) {
        return null;
    }
    const plotW = getPlotWidth(chart);
    if (plotW <= 0) {
        return null;
    }
    const drawn = getShapesByMarkerId();
    if (!drawn.size) {
        return null;
    }
    const ctx = {
        chart,
        range,
        pxPerSec: plotW / (range.hi - range.lo),
        drawn,
        data: getOhlcvData(),
        timeSec,
        offsetY,
    };
    let bestId = null;
    let bestDist = Infinity;
    for (const marker of markers) {
        const result = computeMarkerDistance(ctx, marker);
        if (result && result.dist < bestDist) {
            bestDist = result.dist;
            bestId = result.key;
        }
    }
    return bestDist <= TAP_RADIUS_PX ? bestId : null;
}
/**
 * Subscribes crossHairMoved (to capture the last tap point) and mouse_up
 * (to hit-test and emit TRADE_MARKER_PRESSED). The captured point is
 * consumed on release so a subsequent mouse_up without a fresh crosshair
 * update can't re-fire the same press.
 *
 * @param widget - The TradingView widget to subscribe to.
 * @param chart - The active TradingView chart.
 */
function attachMarkerHitTest(widget, chart) {
    try {
        chart.crossHairMoved().subscribe(null, (params) => {
            if (params?.price === undefined || params?.time === undefined) {
                return;
            }
            lastTapPoint = {
                timeSec: params.time,
                offsetY: params.offsetY,
                at: Date.now(),
            };
        });
    }
    catch (error) {
        reportErrorToRN(error);
    }
    try {
        widget.subscribe('mouse_up', () => {
            const tap = lastTapPoint;
            lastTapPoint = null;
            if (!tap) {
                return;
            }
            if (Date.now() - tap.at > TAP_MAX_AGE_MS) {
                return;
            }
            const pressedId = findTradeMarkerIdNearPoint(tap.timeSec, tap.offsetY);
            if (pressedId !== null) {
                postToRN('TRADE_MARKER_PRESSED', { id: pressedId });
            }
        });
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
/** Test-only: forget any captured tap between test cases. */
function _resetMarkerHitTestForTests() {
    lastTapPoint = null;
}
//# sourceMappingURL=markerHitTest.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/pagination/rnBacked.mjs
// RN-backed pagination: sends FETCH_OLDER_BARS_REQUEST to React Native and
// resolves the pending getBars callback when FETCH_OLDER_BARS_RESPONSE arrives.
//
// Used by Perps whose candle data comes from PerpsController (only accessible
// from RN, not from the WebView). Replaces the Price API direct-fetch path.
//
// Ported from chartLogic.js: pendingOlderBarsCallbacks, olderBarsRequestSeq,
// handleFetchOlderBarsResponse (~line 5149), resolveAllPendingOlderBarsNoData
// (~line 5131), and the RN-backed branch of getBars (~line 5412).



let pendingCallbacks = new Map();
let requestSeq = 0;
function requestOlderBarsFromRN(params) {
    const gen = getOhlcvGeneration();
    const all = getOhlcvData();
    const oldestAtDefer = all.length > 0 ? all[0].time : 0;
    requestSeq += 1;
    const requestId = `obr-${gen}-${requestSeq}`;
    pendingCallbacks.set(requestId, {
        onResult: params.onResult,
        oldestAtDefer,
        gen,
    });
    postToRN('FETCH_OLDER_BARS_REQUEST', {
        requestId,
        seriesGeneration: gen,
        symbol: getCurrentSymbol(),
        resolution: params.resolution,
        fromSec: params.fromSec,
        toSec: params.toSec,
        ...(params.countBack === undefined || params.countBack === null
            ? {}
            : { countBack: params.countBack }),
        oldestLoadedTimeMs: oldestAtDefer,
    });
}
function resolvePendingNoData(pending) {
    try {
        pending.onResult([], { noData: true });
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
function resolveAllPendingOlderBarsNoData() {
    pendingCallbacks.forEach((pending) => {
        resolvePendingNoData(pending);
    });
    pendingCallbacks = new Map();
}
function handleFetchOlderBarsResponse(payload) {
    if (!payload || typeof payload.requestId !== 'string') {
        return;
    }
    const pending = pendingCallbacks.get(payload.requestId);
    if (!pending) {
        return;
    }
    pendingCallbacks.delete(payload.requestId);
    if (payload.seriesGeneration !== pending.gen ||
        payload.seriesGeneration !== getOhlcvGeneration()) {
        resolvePendingNoData(pending);
        return;
    }
    if (payload.error ||
        payload.noData ||
        !Array.isArray(payload.bars) ||
        payload.bars.length === 0) {
        pending.onResult([], { noData: true });
        return;
    }
    const existingTimes = new Set();
    const allData = getOhlcvData();
    for (const bar of allData) {
        existingTimes.add(bar.time);
    }
    const olderBars = [];
    for (const bar of payload.bars) {
        if (bar.time < pending.oldestAtDefer && !existingTimes.has(bar.time)) {
            existingTimes.add(bar.time);
            olderBars.push(bar);
        }
    }
    if (olderBars.length > 0) {
        prependOhlcvBars(olderBars);
    }
    pending.onResult(olderBars, { noData: olderBars.length === 0 });
}
function registerRnBackedPaginationHandler() {
    registerHandler('FETCH_OLDER_BARS_RESPONSE', (payload) => {
        handleFetchOlderBarsResponse(payload);
    });
}
function _resetRnBackedPaginationForTests() {
    pendingCallbacks = new Map();
    requestSeq = 0;
}
//# sourceMappingURL=rnBacked.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/widget/scaleLayout.mjs
// Centralised price-scale + pane-layout overrides.
//
// Ported from chartLogic.js `applyChartScaleLayout` (~line 1270). Applied on
// every chart-type switch and once on chart-ready so candle and line charts
// share the same visible Y range. Without paneProperties.topMargin /
// bottomMargin, TV auto-fits the line series tighter than the candle series
// (close-only vs high/low) and the line chart looks zoomed in.
//
// Phase 2 simplifications vs legacy:
// - Drops chrome-related toggles (showSeriesLastValue/CrosshairLabel
//   conditionals — TV built-in always on now)
// - Drops DOM overflow unclip / hide-price-scale-buttons (no chrome to hide)



const PANE_TOP_MARGIN = 12;
const PANE_BOTTOM_MARGIN = 8;
function buildScaleLayoutOverrides() {
    const theme = getTheme();
    if (!theme) {
        return {};
    }
    const gridLineColor = theme.gridLineColor ?? 'transparent';
    const hidePaneSeparator = window.CONFIG?.features?.hidePaneSeparator === true;
    const separatorColor = hidePaneSeparator
        ? theme.backgroundColor
        : theme.borderColor;
    return {
        'scalesProperties.showRightScale': true,
        'scalesProperties.showLeftScale': false,
        'scalesProperties.showSeriesLastValue': true,
        'scalesProperties.showStudyLastValue': false,
        'scalesProperties.showSymbolLabels': false,
        'scalesProperties.showPriceScaleCrosshairLabel': true,
        'scalesProperties.showTimeScaleCrosshairLabel': true,
        'mainSeriesProperties.showPriceLine': !getHasExplicitCurrentPriceLine(),
        'paneProperties.vertGridProperties.color': gridLineColor,
        'paneProperties.horzGridProperties.color': gridLineColor,
        'paneProperties.topMargin': PANE_TOP_MARGIN,
        'paneProperties.bottomMargin': PANE_BOTTOM_MARGIN,
        ...(theme?.backgroundColor
            ? {
                'timeScale.borderColor': theme.backgroundColor,
                'scalesProperties.lineColor': theme.backgroundColor,
            }
            : {}),
        ...(separatorColor
            ? { 'paneProperties.separatorColor': separatorColor }
            : {}),
        ...(theme
            ? {
                'mainSeriesProperties.priceLineColor': getThemeLastPriceLineColor(theme),
            }
            : {}),
    };
}
/**
 * Apply the scale-layout overrides plus re-attach the main series to the
 * right price scale. Safe to call multiple times. Errors are forwarded to RN.
 *
 * @param _type - Reserved for the chart type; currently unused.
 */
function applyScaleLayout(_type) {
    const widget = getWidget();
    if (!widget || !isChartReady()) {
        return;
    }
    try {
        widget.applyOverrides(buildScaleLayoutOverrides());
    }
    catch (error) {
        reportErrorToRN(error);
        return;
    }
    syncMainSeriesToRightScale(widget);
}
function syncMainSeriesToRightScale(widget) {
    try {
        widget.activeChart().getSeries().detachToRight();
    }
    catch {
        // detachToRight can fail mid-teardown; safe to ignore.
    }
}
//# sourceMappingURL=scaleLayout.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/widget/chartType.mjs
// SET_CHART_TYPE handler — switches between candle (1) and line (2) types.
//
// Ported from chartLogic.js handleSetChartType (~line 2457). After
// setChartType, the legacy code calls applyChartScaleLayout to re-apply
// pane margins + right-scale binding; without it the line chart auto-fits
// to close-only and looks "zoomed in" vs the candle chart's high/low range.



function handleSetChartType(payload) {
    const widget = getWidget();
    if (!widget) {
        // Widget not built yet; persist the desired type so initChart picks it up.
        setCurrentChartType(payload.type);
        return;
    }
    setCurrentChartType(payload.type);
    if (!isChartReady()) {
        return;
    }
    try {
        widget.activeChart().setChartType(payload.type);
        applyScaleLayout(payload.type);
        // TradingView may rebind scales asynchronously after a type switch; the
        // legacy code re-applies on the next animation frame for the line chart.
        // Doing it for both types is safe.
        requestAnimationFrame(() => applyScaleLayout(payload.type));
    }
    catch (error) {
        reportErrorToRN(error);
    }
}

//# sourceMappingURL=chartType.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/pagination/priceApi.mjs
// Default OHLCV paginator — fetches older bars from the MetaMask Price API.
//
// Used by widget/datafeed.ts when state.ohlcvPagination has a cursor. Phase 6
// adds pagination/rnBacked.ts as an alternative strategy (consumer-supplied
// fetchOlderBars callback for Perps' RN-backed candle source).
//
// Ported from chartLogic.js `fetchOlderBars` (lines ~4991-5072), trimmed of
// the layout-settle pending machinery and trade-marker refresh hook (those
// belong to later phases / are gone after Phase 4).



const OHLCV_BASE_URL = 'https://price.api.cx.metamask.io/v3/ohlcv-chart';
/**
 * Fetches the next page from the Price API and merges new bars into state.
 * Resolves with the slice strictly older than `oldestAtDefer` (TV's getBars
 * wants only bars before its current visible window). Returns `noData: true`
 * when the cursor is exhausted or the response yields no older bars.
 *
 * Aborts with `noData: true` when ohlcvGeneration changes mid-flight (a newer
 * SET_OHLCV_DATA has invalidated this fetch).
 *
 * @param request - The pagination request describing the cursor and window.
 * @returns The older-bars slice plus a `noData` flag.
 */
async function fetchOlderBarsFromPriceApi(request) {
    const pag = getOhlcvPagination();
    if (!pag.nextCursor || !pag.hasMore || !pag.assetId) {
        return { olderBars: [], noData: true };
    }
    const generation = getOhlcvGeneration();
    const params = [];
    params.push(`nextCursor=${encodeURIComponent(pag.nextCursor)}`);
    if (pag.vsCurrency) {
        params.push(`vsCurrency=${encodeURIComponent(pag.vsCurrency)}`);
    }
    const url = `${OHLCV_BASE_URL}/${pag.assetId}?${params.join('&')}`;
    let response;
    try {
        response = await fetch(url);
    }
    catch (error) {
        if (generation !== getOhlcvGeneration()) {
            return { olderBars: [], noData: true };
        }
        reportErrorToRN(error);
        return { olderBars: [], noData: true };
    }
    if (!response.ok) {
        if (generation !== getOhlcvGeneration()) {
            return { olderBars: [], noData: true };
        }
        reportErrorToRN(new Error(`OHLCV API error: ${response.status}`));
        return { olderBars: [], noData: true };
    }
    let parsed;
    try {
        parsed = (await response.json());
    }
    catch (error) {
        reportErrorToRN(error);
        return { olderBars: [], noData: true };
    }
    if (generation !== getOhlcvGeneration()) {
        return { olderBars: [], noData: true };
    }
    if (!parsed || !Array.isArray(parsed.data)) {
        reportErrorToRN(new Error('OHLCV API response: invalid payload'));
        return { olderBars: [], noData: true };
    }
    const newBars = parsed.data.map((candle) => ({
        time: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
    }));
    setOhlcvPagination({
        ...pag,
        nextCursor: parsed.nextCursor ?? null,
        hasMore: Boolean(parsed.hasNext),
    });
    if (newBars.length > 0) {
        prependOhlcvBars(newBars);
        notifyDataLifecycle('ohlcvPrepended');
    }
    const olderBars = newBars.filter((b) => b.time < request.oldestAtDefer);
    return { olderBars, noData: olderBars.length === 0 };
}
/**
 * Test-only helper: invalidates any in-flight fetches by bumping the generation.
 */
function invalidateInFlightFetches() {
    bumpOhlcvGeneration();
}
//# sourceMappingURL=priceApi.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/widget/priceFormatter.mjs
// Price formatting for TradingView's `custom_formatters.priceFormatterFactory`.
//
// Ported from chartLogic.js: SUBSCRIPT_DIGITS_CROSSHAIR / toSubscriptDigitsCrosshair
// (~line 1328), formatSubscriptNotationCrosshair (~1350), formatCrosshairPrice
// (~1373), advancedChartPriceFormatterFactory (~1397).
//
// This is a TV widget option, not a message handler — the factory returns a
// { format(price) } object that TV uses to render the price scale + last-value
// pill. Without it, TV falls back to a plain `x.xx` format that ignores our
// `useSubscriptPriceFormat` config.
const SUBSCRIPT_DIGITS = [
    '₀',
    '₁',
    '₂',
    '₃',
    '₄',
    '₅',
    '₆',
    '₇',
    '₈',
    '₉',
];
function toSubscriptDigits(value) {
    return String(value)
        .split('')
        .map((digit) => SUBSCRIPT_DIGITS[Number.parseInt(digit, 10)] ?? digit)
        .join('');
}
/**
 * For values strictly between 0 and 0.0001, produces the compact
 * `0.0₆12345` notation. Returns `null` when the value doesn't qualify so
 * callers can fall through to Intl formatting.
 *
 * @param abs - The absolute price value to format.
 * @returns The subscript-notation string, or null when it doesn't qualify.
 */
function formatSubscriptNotation(abs) {
    if (!(abs > 0 && abs < 0.0001)) {
        return null;
    }
    const priceStr = abs.toFixed(20);
    const match = /^0\.0*([1-9]\d*)/u.exec(priceStr);
    if (!match) {
        return null;
    }
    const leadingZeros = priceStr.indexOf(match[1]) - 2;
    if (leadingZeros < 4) {
        return null;
    }
    const significant = match[1];
    const significantDigits = significant.slice(0, 4).replace(/0{1,4}$/u, '') || significant.slice(0, 2);
    return `0.0${toSubscriptDigits(leadingZeros)}${significantDigits}`;
}
function getConfiguredPriceDecimals() {
    const decimals = window.CONFIG?.priceDecimals;
    if (typeof decimals !== 'number' || !Number.isFinite(decimals)) {
        return null;
    }
    return Math.max(0, Math.floor(decimals));
}
function formatPriceWithConfiguredDecimals(price, maxDecimals) {
    const numericPrice = Number(price);
    if (numericPrice === 0) {
        return '0';
    }
    const abs = Math.abs(numericPrice);
    let decimals = maxDecimals;
    if (abs >= 1) {
        const integerDigits = Math.floor(Math.log10(abs)) + 1;
        decimals = Math.min(maxDecimals, Math.max(0, 5 - integerDigits));
    }
    const rounded = Number(numericPrice.toFixed(decimals));
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(rounded);
}
/**
 * Formats a price for the TV built-in price scale + crosshair label. Zero-
 * safe. Numbers below 0.0001 use subscript notation; others use Intl decimal.
 *
 * @param price - The raw price value from TradingView.
 * @returns The formatted price string (empty string for invalid input).
 */
function formatCrosshairPrice(price) {
    if (price === undefined || price === null || Number.isNaN(Number(price))) {
        return '';
    }
    const numericPrice = Number(price);
    if (numericPrice === 0) {
        return '0.00';
    }
    const abs = Math.abs(numericPrice);
    const sub = formatSubscriptNotation(abs);
    if (sub) {
        return numericPrice < 0 ? `-${sub}` : sub;
    }
    const configuredPriceDecimals = getConfiguredPriceDecimals();
    if (configuredPriceDecimals !== null) {
        return formatPriceWithConfiguredDecimals(numericPrice, configuredPriceDecimals);
    }
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: abs >= 1 ? 2 : 4,
    }).format(numericPrice);
}
/**
 * TradingView `custom_formatters.priceFormatterFactory`. Returns null (letting
 * TV fall back to its default) when subscript formatting is disabled or when
 * the symbol is a volume series. Otherwise returns a formatter that routes
 * through `formatCrosshairPrice`.
 *
 * @param symbolInfo - The TradingView symbol info (or null).
 * @param _minTick - The minimum tick size; currently unused.
 * @returns A price formatter, or null to use TradingView's default.
 */
function advancedChartPriceFormatterFactory(symbolInfo, _minTick) {
    if (symbolInfo === null || symbolInfo.format === 'volume') {
        return null;
    }
    if (!window.CONFIG ||
        (!window.CONFIG.useSubscriptPriceFormat &&
            getConfiguredPriceDecimals() === null)) {
        return null;
    }
    return {
        format(price) {
            return formatCrosshairPrice(price);
        },
    };
}
//# sourceMappingURL=priceFormatter.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/widget/datafeed.mjs
// TradingView UDF datafeed object passed into the widget constructor.
//
// Ported from chartLogic.js `customDatafeed` (lines ~5074-5203) and its
// helpers `filterBarsForRange` (~4944), `fetchOlderBars` (~4991).
// Phase 2 wires the default Price API paginator; Phase 6 swaps in
// pagination/rnBacked.ts when consumers opt into the custom strategy.






const SUPPORTED_RESOLUTIONS = [
    '1',
    '3',
    '5',
    '15',
    '30',
    '60',
    '120',
    '240',
    '480',
    '720',
    '1D',
    '3D',
    '1W',
    '1M',
];
const DEFAULT_VARIABLE_TICK_SIZE = [
    '0.0000000001',
    '0.000001',
    '0.00000001',
    '0.0001',
    '0.000001',
    '0.01',
    '0.0001',
    '1',
    '0.01',
    '10000',
    '0.1',
].join(' ');
const PERPS_VARIABLE_TICK_SIZE = [
    '0.0000000001',
    '0.000001',
    '0.00000001',
    '0.0001',
    '0.000001',
    '0.01',
    '0.0001',
    '10000',
    '1',
].join(' ');
function getVariableTickSize() {
    return getConfiguredPriceDecimals() === null
        ? DEFAULT_VARIABLE_TICK_SIZE
        : PERPS_VARIABLE_TICK_SIZE;
}
function getPriceScale() {
    return getConfiguredPriceDecimals() === null ? 100 : 10000000000;
}
/**
 * Strips internal fields from an OHLCVBar to the shape TV expects.
 *
 * @param bar - The internal OHLCV bar.
 * @returns The bar in the shape TradingView expects.
 */
function toTVBar(bar) {
    return {
        time: bar.time,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
    };
}
/**
 * Filters the in-memory OHLCV array to the requested time window.
 * Mirrors legacy `filterBarsForRange`: returns bars in [fromMs, toMs); if
 * fewer than countBack bars match, falls back to the last countBack bars
 * before toMs.
 *
 * @param fromMs - Inclusive start of the window, in milliseconds.
 * @param toMs - Exclusive end of the window, in milliseconds.
 * @param countBack - Minimum number of bars TradingView expects.
 * @returns The matching bars in the requested window.
 */
function filterBarsForRange(fromMs, toMs, countBack) {
    const all = getOhlcvData();
    const inRange = [];
    for (const bar of all) {
        if (bar.time >= fromMs && bar.time < toMs) {
            inRange.push(toTVBar(bar));
        }
    }
    if (inRange.length >= countBack) {
        return inRange;
    }
    const beforeTo = all.filter((b) => b.time < toMs);
    const startIdx = Math.max(0, beforeTo.length - countBack);
    return beforeTo.slice(startIdx).map(toTVBar);
}
const customDatafeed = {
    onReady(callback) {
        setTimeout(() => {
            callback({
                supported_resolutions: SUPPORTED_RESOLUTIONS,
                supports_marks: false,
                supports_timescale_marks: false,
                supports_time: true,
            });
        }, 0);
    },
    searchSymbols(_userInput, _exchange, _symbolType, onResult) {
        onResult([]);
    },
    resolveSymbol(symbolName, onResolve, _onError) {
        const info = {
            name: symbolName,
            ticker: symbolName,
            description: symbolName,
            type: 'crypto',
            session: '24x7',
            timezone: 'Etc/UTC',
            exchange: '',
            minmov: 1,
            pricescale: getPriceScale(),
            variable_tick_size: getVariableTickSize(),
            has_intraday: true,
            has_daily: true,
            has_weekly_and_monthly: true,
            supported_resolutions: SUPPORTED_RESOLUTIONS,
            volume_precision: 0,
            data_status: 'endofday',
        };
        setTimeout(() => onResolve(info), 0);
    },
    getBars(_symbolInfo, resolution, periodParams, onResult, onError) {
        try {
            const fromMs = periodParams.from * 1000;
            const toMs = periodParams.to * 1000;
            const { countBack, firstDataRequest } = periodParams;
            const bars = filterBarsForRange(fromMs, toMs, countBack);
            if (bars.length > 0) {
                onResult(bars, { noData: false });
                return;
            }
            const all = getOhlcvData();
            if (firstDataRequest || all.length === 0) {
                onResult([], { noData: true });
                return;
            }
            const oldestAtDefer = all[0].time;
            const pag = getOhlcvPagination();
            // Strategy C (SLB): all data is pre-loaded by RN — no pagination.
            if (slbHandleGetBars(onResult)) {
                return;
            }
            // Strategy A (Price API / Token Details):
            if (pag.assetId) {
                fetchOlderBarsFromPriceApi({ oldestAtDefer })
                    .then(({ olderBars, noData }) => {
                    onResult(olderBars, { noData });
                    return undefined;
                })
                    .catch((error) => {
                    reportErrorToRN(error);
                    onResult([], { noData: true });
                });
                // Strategy B (RN-backed / Perps):
            }
            else if (getRnBackedPagination().enabled) {
                requestOlderBarsFromRN({
                    resolution,
                    fromSec: periodParams.from,
                    toSec: periodParams.to,
                    countBack: periodParams.countBack,
                    onResult,
                });
            }
            else {
                onResult([], { noData: true });
            }
        }
        catch (error) {
            let errMsg;
            if (error instanceof Error) {
                errMsg = error.message;
            }
            else if (typeof error === 'string') {
                errMsg = error;
            }
            else {
                errMsg = safeStringify(error);
            }
            onError(errMsg);
        }
    },
    subscribeBars(_symbolInfo, _resolution, onTick, listenerGuid) {
        registerRealtimeCallback(listenerGuid, onTick);
    },
    unsubscribeBars(listenerGuid) {
        unregisterRealtimeCallback(listenerGuid);
    },
};
/**
 * Forward a realtime tick to every TradingView subscribeBars listener.
 * Called from widget/ohlcvIngestion.ts on REALTIME_UPDATE.
 *
 * @param tick - The realtime bar to forward to listeners.
 */
function forwardRealtimeTick(tick) {
    const callbacks = getRealtimeCallbacks();
    for (const guid of Object.keys(callbacks)) {
        try {
            callbacks[guid](tick);
        }
        catch (error) {
            reportErrorToRN(error);
        }
    }
}
//# sourceMappingURL=datafeed.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/core/timezone.mjs
// User-timezone resolution for TradingView's `timezone` widget option.
//
// Ported from chartLogic.js (~line 5299-5417). TradingView only accepts a
// fixed set of IANA timezone IDs. `Intl.DateTimeFormat().resolvedOptions()`
// on device returns the canonical zone; we map a small set of legacy
// aliases and fall back to Etc/UTC when the zone isn't in TV's list.
/** IANA identifiers TradingView's Advanced Charts library accepts. */
const TV_SUPPORTED_TIMEZONES = [
    'Etc/UTC',
    'Africa/Cairo',
    'Africa/Casablanca',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'Africa/Nairobi',
    'Africa/Tunis',
    'America/Anchorage',
    'America/Argentina/Buenos_Aires',
    'America/Bogota',
    'America/Caracas',
    'America/Chicago',
    'America/El_Salvador',
    'America/Halifax',
    'America/Juneau',
    'America/Lima',
    'America/Los_Angeles',
    'America/Mexico_City',
    'America/New_York',
    'America/Phoenix',
    'America/Santiago',
    'America/Sao_Paulo',
    'America/Toronto',
    'America/Vancouver',
    'Asia/Astana',
    'Asia/Ashkhabad',
    'Asia/Bahrain',
    'Asia/Bangkok',
    'Asia/Chongqing',
    'Asia/Colombo',
    'Asia/Dhaka',
    'Asia/Dubai',
    'Asia/Ho_Chi_Minh',
    'Asia/Hong_Kong',
    'Asia/Jakarta',
    'Asia/Jerusalem',
    'Asia/Karachi',
    'Asia/Kabul',
    'Asia/Kathmandu',
    'Asia/Kolkata',
    'Asia/Kuala_Lumpur',
    'Asia/Kuwait',
    'Asia/Manila',
    'Asia/Muscat',
    'Asia/Nicosia',
    'Asia/Qatar',
    'Asia/Riyadh',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Asia/Taipei',
    'Asia/Tehran',
    'Asia/Tel_Aviv',
    'Asia/Tokyo',
    'Asia/Yangon',
    'Atlantic/Azores',
    'Atlantic/Reykjavik',
    'Australia/Adelaide',
    'Australia/Brisbane',
    'Australia/Perth',
    'Australia/Sydney',
    'Europe/Amsterdam',
    'Europe/Athens',
    'Europe/Belgrade',
    'Europe/Berlin',
    'Europe/Bratislava',
    'Europe/Brussels',
    'Europe/Bucharest',
    'Europe/Budapest',
    'Europe/Copenhagen',
    'Europe/Dublin',
    'Europe/Helsinki',
    'Europe/Istanbul',
    'Europe/Lisbon',
    'Europe/London',
    'Europe/Luxembourg',
    'Europe/Madrid',
    'Europe/Malta',
    'Europe/Moscow',
    'Europe/Oslo',
    'Europe/Paris',
    'Europe/Riga',
    'Europe/Rome',
    'Europe/Stockholm',
    'Europe/Tallinn',
    'Europe/Vienna',
    'Europe/Vilnius',
    'Europe/Warsaw',
    'Europe/Zurich',
    'Pacific/Auckland',
    'Pacific/Chatham',
    'Pacific/Fakaofo',
    'Pacific/Honolulu',
    'Pacific/Norfolk',
    'US/Mountain',
];
/**
 * Intl canonical names → TradingView legacy aliases. Intl returns
 * `America/Denver` but TradingView expects `US/Mountain`. Add here as
 * new devices report unmapped canonicals.
 */
const CANONICAL_TO_TV = {
    'America/Denver': 'US/Mountain',
    'Asia/Ashgabat': 'Asia/Ashkhabad',
    'Asia/Almaty': 'Asia/Astana',
};
/**
 * Resolves the device timezone to a TV-supported IANA identifier. Falls back
 * to `Etc/UTC` when Intl fails or the resolved zone isn't in TV's list.
 *
 * @returns A TradingView-supported IANA timezone identifier.
 */
function resolveUserTimezone() {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC';
        const mapped = CANONICAL_TO_TV[tz] ?? tz;
        return TV_SUPPORTED_TIMEZONES.includes(mapped) ? mapped : 'Etc/UTC';
    }
    catch {
        return 'Etc/UTC';
    }
}
//# sourceMappingURL=timezone.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/core/types.mjs
// Property names mirror external contracts (TradingView `LibrarySymbolInfo`,
// injected `window` globals, RN indicator-color maps), so they intentionally
// use non-camelCase keys — matching the core convention for external API type
// files (see `transaction-controller/src/types.ts`).
/* eslint-disable @typescript-eslint/naming-convention */
// Shared types for the AdvancedChart WebView modules.
//
// These types are local to the WebView bundle. Cross-bridge payload shapes that
// must match the RN side live in messages/contract.ts and mirror the unions in
// app/components/UI/Charts/AdvancedChart/AdvancedChart.types.ts.
/** Chart type integers used by TradingView's setChartType / currentChartType. */
var ChartType;
(function (ChartType) {
    ChartType[ChartType["Candles"] = 1] = "Candles";
    ChartType[ChartType["Line"] = 2] = "Line";
})(ChartType || (ChartType = {}));
//# sourceMappingURL=types.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/widget/externalLinkBridge.mjs
// Intercepts in-iframe TradingView link clicks and forwards them to React
// Native via CHART_TRADINGVIEW_CLICKED, so the user opens links in the
// system browser instead of letting the iframe navigate.
//
// Ported from chartLogic.js: TV_EXTERNAL_BRIDGE_DEBOUNCE_MS,
// isTradingViewExternalHostname, isTradingViewExternalHref,
// installTradingViewExternalOpenBridge (lines ~2016-2122).


const TV_EXTERNAL_BRIDGE_DEBOUNCE_MS = 600;
// Module-local debounce timestamp; replaces window.__mmLastTvExternalBridgeAt.
let lastBridgeAt = 0;
function isTradingViewExternalHostname(hostname) {
    if (!hostname) {
        return false;
    }
    const host = String(hostname).toLowerCase();
    return (host === 'tradingview.com' ||
        host === 'www.tradingview.com' ||
        host.endsWith('.tradingview.com'));
}
function isTradingViewExternalHref(href) {
    if (!href) {
        return false;
    }
    try {
        const base = window.location?.href ?? 'https://localhost/';
        const parsed = new URL(href, base);
        return isTradingViewExternalHostname(parsed.hostname);
    }
    catch {
        return false;
    }
}
function sendTradingViewClicked(url) {
    postToRN('CHART_TRADINGVIEW_CLICKED', url ? { url } : {});
}
function handleTradingViewLinkCapture(ev) {
    const target = ev.target;
    if (!target || typeof target.closest !== 'function') {
        return;
    }
    const anchor = target.closest('a');
    if (!anchor?.href || !isTradingViewExternalHref(anchor.href)) {
        return;
    }
    const now = Date.now();
    if (now - lastBridgeAt < TV_EXTERNAL_BRIDGE_DEBOUNCE_MS) {
        return;
    }
    lastBridgeAt = now;
    try {
        ev.preventDefault();
        ev.stopPropagation();
    }
    catch {
        // preventDefault on a passive listener throws; safe to ignore.
    }
    sendTradingViewClicked(anchor.href);
}
function patchWindowOpen(win) {
    if (!win?.open || win.__mmTvOpenPatched) {
        return;
    }
    win.__mmTvOpenPatched = true;
    const origOpen = win.open.bind(win);
    win.open = (url, target, features) => {
        if (url !== null &&
            url !== undefined &&
            url !== '' &&
            isTradingViewExternalHref(String(url))) {
            const now = Date.now();
            if (now - lastBridgeAt < TV_EXTERNAL_BRIDGE_DEBOUNCE_MS) {
                return null;
            }
            lastBridgeAt = now;
            sendTradingViewClicked(String(url));
            return null;
        }
        return origOpen(url, target, features);
    };
}
function applyAllOnce() {
    patchWindowOpen(window);
    eachChartDocument((doc) => {
        try {
            patchWindowOpen(doc.defaultView);
        }
        catch {
            // defaultView access can fail in detached iframes.
        }
        const flagged = doc;
        if (doc?.addEventListener && !flagged.__mmTvLinkCaptureInstalled) {
            flagged.__mmTvLinkCaptureInstalled = true;
            doc.addEventListener('click', handleTradingViewLinkCapture, true);
        }
    });
}
/**
 * Installs the bridge. Safe to call multiple times — each document is
 * tagged with __mmTvLinkCaptureInstalled to avoid duplicate listeners.
 *
 * Reapplies on the iframe `load` event and after 200ms / 800ms / 2000ms
 * because TradingView creates the iframe asynchronously and may swap its
 * contentDocument; we don't have a reliable single signal for "fully loaded".
 */
function installTradingViewExternalOpenBridge() {
    applyAllOnce();
    try {
        const container = document.getElementById('tv_chart_container');
        const iframe = container?.querySelector('iframe');
        if (iframe) {
            iframe.addEventListener('load', applyAllOnce);
        }
    }
    catch {
        // No-op — container/iframe may not exist yet on early calls.
    }
    setTimeout(applyAllOnce, 200);
    setTimeout(applyAllOnce, 800);
    setTimeout(applyAllOnce, 2000);
}
/** Test-only: reset module state between tests. */
function _resetExternalLinkBridgeForTests() {
    lastBridgeAt = 0;
}
//# sourceMappingURL=externalLinkBridge.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/widget/initChart.mjs
// TradingView widget creation and onChartReady orchestration.
//
// Ported from chartLogic.js initChart() / onChartReady (lines ~5242-5601),
// stripped of:
//   - chrome-related branches (useCustomLabels / useCustomDashed) — Phase 4
//   - data-dependent gating (`window.ohlcvData.length === 0`) — Phase 2 calls
//     this function only once data is in
//   - custom crosshair listener + chart-interaction analytics — Phase 2
//     (interaction/) will own this
//   - line-end overlays / last-price overlays / legend overlay refresh —
//     Phase 4 deletes the first two; Phase 3 owns the legend
//
// Phase 1's job is the constructor call + onChartReady hook + library load
// orchestration. Phase 2 wires the datafeed.







/**
 * Generates a 19-shade palette from a base hex color, light→base→dark.
 * Used for TradingView `custom_themes.dark.color{1,3}`. Ported verbatim
 * from chartLogic.js `generatePaletteShades` (~line 999).
 *
 * @param hexColor - The base color as a `#rrggbb` hex string.
 * @returns An array of 19 `#rrggbb` shades from light to dark.
 */
function generatePaletteShades(hexColor) {
    const red = Number.parseInt(hexColor.slice(1, 3), 16);
    const green = Number.parseInt(hexColor.slice(3, 5), 16);
    const blue = Number.parseInt(hexColor.slice(5, 7), 16);
    const shades = [];
    for (let i = 0; i < 19; i++) {
        const ratio = i / 18;
        let shadeRed;
        let shadeGreen;
        let shadeBlue;
        if (ratio < 0.5) {
            const factor = 1 - ratio * 2;
            shadeRed = Math.round(red + (255 - red) * factor);
            shadeGreen = Math.round(green + (255 - green) * factor);
            shadeBlue = Math.round(blue + (255 - blue) * factor);
        }
        else {
            const factor = (ratio - 0.5) * 2;
            shadeRed = Math.round(red * (1 - factor));
            shadeGreen = Math.round(green * (1 - factor));
            shadeBlue = Math.round(blue * (1 - factor));
        }
        const packed = 16777216 + shadeRed * 65536 + shadeGreen * 0x100 + shadeBlue;
        shades.push(`#${packed.toString(16).slice(1)}`);
    }
    return shades;
}
const BASE_ENABLED_FEATURES = [
    'study_templates',
    'iframe_loading_same_origin',
];
function resolveEnabledFeatures(features) {
    const list = [...BASE_ENABLED_FEATURES];
    if (features.showBuiltInLegend) {
        list.push('always_show_legend_values_on_mobile');
    }
    return list;
}
function resolveDisabledFeatures(features) {
    const list = (features.disabledFeatures ?? []).slice();
    if (!features.enableDrawingTools) {
        list.push('left_toolbar', 'context_menus');
    }
    if (!features.showBuiltInLegend) {
        list.push('legend_widget');
    }
    list.push('use_localstorage_for_settings');
    return list;
}
function buildWidgetOverrides(theme, features) {
    const gridLineColor = theme.gridLineColor ?? 'transparent';
    const showLegend = features?.showBuiltInLegend === true;
    return {
        'paneProperties.background': theme.backgroundColor,
        'paneProperties.backgroundType': 'solid',
        'paneProperties.vertGridProperties.color': gridLineColor,
        'paneProperties.horzGridProperties.color': gridLineColor,
        'scalesProperties.lineColor': theme.backgroundColor,
        'scalesProperties.textColor': theme.textColor,
        'timeScale.borderColor': theme.backgroundColor,
        'scalesProperties.fontSize': 12,
        'scalesProperties.showStudyLastValue': false,
        'scalesProperties.showSeriesLastValue': true,
        'scalesProperties.showSymbolLabels': false,
        'scalesProperties.showRightScale': true,
        'scalesProperties.showLeftScale': false,
        'scalesProperties.showPriceScaleCrosshairLabel': true,
        'scalesProperties.showTimeScaleCrosshairLabel': true,
        'paneProperties.legendProperties.showSeriesTitle': false,
        'paneProperties.legendProperties.showSeriesOHLC': showLegend,
        'paneProperties.legendProperties.showBarChange': showLegend,
        'paneProperties.legendProperties.showVolume': showLegend,
        'paneProperties.legendProperties.showBackground': false,
        'paneProperties.legendProperties.showStudyTitles': showLegend,
        'paneProperties.legendProperties.showStudyArguments': showLegend,
        'paneProperties.legendProperties.showStudyValues': showLegend,
        'mainSeriesProperties.showPriceLine': !getHasExplicitCurrentPriceLine(),
        'mainSeriesProperties.priceLineColor': getThemeLastPriceLineColor(theme),
        // Pane margins keep candle (high/low fit) and line (close-only fit) charts
        // visually consistent. Without them, line auto-fits tighter and looks
        // zoomed in vs the candle chart for the same OHLCV.
        'paneProperties.topMargin': 12,
        'paneProperties.bottomMargin': 8,
        ...getCandleStyleOverrides(theme),
        ...getSeriesColorOverrides(getThemeLineColor(theme), getThemeLastPriceLineColor(theme)),
        ...getBuiltInScaleLabelOverrides(theme),
    };
}
/**
 * Builds the TradingView widget. Returns the widget; the caller is expected
 * to store it via setWidget(). Emits CHART_READY + CHART_LAYOUT_SETTLED to
 * RN when the widget reports onChartReady.
 *
 * @param config - The resolved chart configuration.
 * @param options - Widget construction options (datafeed, formatters, etc.).
 * @returns The constructed TradingView widget.
 */
function createChartWidget(config, options) {
    const { TradingView } = window;
    if (!TradingView) {
        throw new Error('TradingView library not loaded');
    }
    const theme = getTheme();
    if (!theme) {
        throw new Error('Theme not initialised — call initThemeFromConfig first');
    }
    const features = config.features ?? {};
    const disabledFeatures = resolveDisabledFeatures(features);
    const TvWidget = TradingView.widget;
    const widget = new TvWidget({
        symbol: getCurrentSymbol(),
        interval: getCurrentResolution(),
        timeframe: options.timeframe,
        container: 'tv_chart_container',
        datafeed: options.datafeed,
        library_path: config.libraryUrl,
        locale: 'en',
        custom_formatters: options.customFormatters,
        timezone: options.timezone ?? resolveUserTimezone(),
        fullscreen: false,
        autosize: true,
        theme: 'Dark',
        disabled_features: disabledFeatures,
        enabled_features: resolveEnabledFeatures(features),
        custom_themes: {
            dark: {
                color1: generatePaletteShades(theme.successColor),
                color3: generatePaletteShades(theme.errorColor),
            },
        },
        overrides: buildWidgetOverrides(theme, features),
        loading_screen: {
            backgroundColor: theme.backgroundColor,
            foregroundColor: theme.successColor,
        },
    });
    setWidget(widget);
    widget.onChartReady(() => {
        setChartReady(true);
        // Apply the stored chart type before revealing the chart. RN sends
        // SET_CHART_TYPE before SET_OHLCV_DATA, so the state already holds
        // the user's selection by the time onChartReady fires. Applying it
        // here prevents the brief candlestick flash for line-chart users.
        const storedType = getCurrentChartType();
        if (storedType !== ChartType.Candles) {
            try {
                widget.activeChart().setChartType(storedType);
            }
            catch (error) {
                reportErrorToRN(error);
            }
        }
        hideLoadingOverlay();
        installTradingViewExternalOpenBridge();
        postToRN('CHART_READY', {});
        scheduleChartLayoutSettledNotify();
        if (options.onReady) {
            try {
                options.onReady(widget);
            }
            catch (error) {
                reportErrorToRN(error);
            }
        }
    });
    return widget;
}
function hideLoadingOverlay() {
    try {
        const el = document.getElementById('loading-overlay');
        el?.classList.add('hidden');
    }
    catch {
        // Loading overlay may be absent in non-template contexts (e.g. tests).
    }
}
/**
 * Posts CHART_LAYOUT_SETTLED after two rAF ticks so RN's skeleton overlay
 * can hide once TradingView has actually laid out. Mirrors legacy
 * scheduleChartLayoutSettledNotify (~line 118).
 */
function scheduleChartLayoutSettledNotify() {
    const send = () => {
        if (getWidget()) {
            postToRN('CHART_LAYOUT_SETTLED', {});
        }
    };
    try {
        requestAnimationFrame(() => {
            requestAnimationFrame(send);
        });
    }
    catch {
        setTimeout(send, 48);
    }
}
/**
 * Ensures library is loaded, then awaits caller-provided pre-widget setup.
 * Phase 2's ohlcvIngestion calls this once SET_OHLCV_DATA arrives.
 *
 * @param libraryUrl - Base URL to load the TradingView library from.
 */
async function ensureLibraryLoaded(libraryUrl) {
    await loadTradingViewLibrary(libraryUrl);
}
//# sourceMappingURL=initChart.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/core/resolution.mjs
// Maps OHLCV bar intervals (milliseconds) to TradingView resolution strings.
//
// Ported verbatim from chartLogic.js INTERVAL_MS_TO_TV + detectResolution
// (lines ~463-505). Phase 2 consumes this from widget/ohlcvIngestion.ts.
/** OHLCV bar interval in milliseconds → TradingView resolution code. */
const INTERVAL_MS_TO_TV = {
    60000: '1',
    180000: '3',
    300000: '5',
    900000: '15',
    1800000: '30',
    3600000: '60',
    7200000: '120',
    14400000: '240',
    28800000: '480',
    43200000: '720',
    86400000: '1D',
    259200000: '3D',
    604800000: '1W',
    2592000000: '1M',
};
const DEFAULT_RESOLUTION = '5';
/**
 * Picks the closest matching TV resolution for an OHLCV bar series.
 * Uses the median diff over the first few bars so a single gap doesn't skew
 * the result (matches legacy chartLogic.js detectResolution semantics).
 *
 * @param data - The OHLCV bar series (each bar carries a `time` in ms).
 * @returns The closest matching TradingView resolution.
 */
function detectResolution(data) {
    if (data.length < 2) {
        return DEFAULT_RESOLUTION;
    }
    const sampleCount = Math.min(data.length - 1, 10);
    const diffs = [];
    for (let i = 0; i < sampleCount; i++) {
        diffs.push(data[i + 1].time - data[i].time);
    }
    diffs.sort((a, b) => a - b);
    const median = diffs[Math.floor(diffs.length / 2)];
    let best = DEFAULT_RESOLUTION;
    let bestDist = Infinity;
    for (const key of Object.keys(INTERVAL_MS_TO_TV)) {
        const intervalMs = Number(key);
        const distance = Math.abs(intervalMs - median);
        if (distance < bestDist) {
            bestDist = distance;
            best = INTERVAL_MS_TO_TV[intervalMs];
        }
    }
    return best;
}
//# sourceMappingURL=resolution.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/widget/ohlcvIngestion.mjs
// SET_OHLCV_DATA and REALTIME_UPDATE inbound handlers.
//
// Ported from chartLogic.js: handleSetOHLCVData (~line 507) and
// handleRealtimeUpdate (~line 658).
//
// Phase 2 simplifications vs legacy:
// - No `__mmLayoutSettlePending` / `beginDeferredLayoutSettleAfterOhlcvReload`
//   plumbing — CHART_LAYOUT_SETTLED is emitted on chart ready and on each
//   data load directly.
// - No chrome-related branches (`refreshLineChartOverlays`, line-end-dot,
//   custom dashed price line) — those features are deleted in Phase 4.
// - No trade-marker / indicator-state clear paths — Phase 5 / Phase 3 own
//   those overlays and they hook into their own message types, not into
//   SET_OHLCV_DATA's reset path.








let firstDataCallback = null;
let firstDataDelivered = false;
/**
 * When active indicators exist, defers the CHART_LAYOUT_SETTLED signal to the
 * legend module so it fires after the first successful legend render — not on
 * the premature 2-rAF timer in emitLayoutSettled.
 */
function claimLegendSettleOwnership() {
    if (getActiveStudies().size > 0 || getMaStudies().size > 0) {
        setLegendOwnsLayoutSettle(true);
    }
}
/**
 * Registers the callback invoked the first time SET_OHLCV_DATA arrives.
 * Bootstrap wires this to widget creation (loads the TV library if needed,
 * then calls createChartWidget).
 *
 * @param callback - Invoked once when the first OHLCV data arrives.
 */
function onFirstOhlcvData(callback) {
    firstDataCallback = callback;
}
function handleSetOHLCVData(payload) {
    if (!payload?.data || payload.data.length === 0) {
        return;
    }
    resolveAllPendingOlderBarsNoData();
    setOhlcvData(payload.data);
    state_bumpOhlcvGeneration();
    if (payload.rnBackedPagination) {
        setRnBackedPagination(payload.rnBackedPagination);
    }
    const slb = Boolean(payload.slbMode);
    setSlbMode(slb);
    if (slb) {
        setSlbCenteringPending(true);
    }
    if (payload.pagination) {
        setOhlcvPagination({
            nextCursor: payload.pagination.nextCursor ?? null,
            hasMore: Boolean(payload.pagination.hasMore),
            assetId: payload.pagination.assetId ?? null,
            vsCurrency: payload.pagination.vsCurrency ?? null,
        });
    }
    else {
        clearOhlcvPagination();
    }
    setVisibleFromMs(payload.visibleFromMs ?? null);
    setVisibleToMs(payload.visibleToMs ?? null);
    const newResolution = detectResolution(payload.data);
    const previousResolution = getCurrentResolution();
    setCurrentResolution(newResolution);
    const widget = getWidget();
    if (widget && isChartReady()) {
        try {
            const chart = widget.activeChart();
            if (previousResolution === newResolution) {
                // Same resolution — TV won't re-fetch via getBars, so we must
                // resetData to force it to pick up the new bars from the datafeed.
                resetDatafeedCacheBeforeHotReload(widget);
                chart.resetData();
                resetMainPriceScaleAutoScale(chart);
                notifyDataLifecycle('ohlcvReset');
                applyVisibleRange(chart);
                emitLayoutSettled();
            }
            else {
                // Different resolution — let setResolution handle the transition
                // naturally. TV calls getBars internally, the datafeed returns the
                // new bars (already stored via setOhlcvData above), and TV renders
                // them smoothly without a blank frame. No resetData needed.
                claimLegendSettleOwnership();
                const seq = bumpHotReloadSeq();
                chart.setResolution(newResolution, () => {
                    if (getHotReloadSeq() !== seq) {
                        return;
                    }
                    resetMainPriceScaleAutoScale(chart);
                    applyVisibleRange(chart, { dataAlreadyLoaded: true });
                    emitLayoutSettled();
                });
            }
        }
        catch (error) {
            reportErrorToRN(error);
        }
        return;
    }
    if (!widget && firstDataCallback && !firstDataDelivered) {
        firstDataDelivered = true;
        try {
            firstDataCallback();
        }
        catch (error) {
            firstDataDelivered = false;
            reportErrorToRN(error);
        }
    }
}
function handleRealtimeUpdate(payload) {
    if (!payload?.bar) {
        return;
    }
    const { bar } = payload;
    appendOrReplaceLastBar(bar);
    forwardRealtimeTick({
        time: bar.time,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
    });
}
function applyVisibleRange(chart, options) {
    // Strategy C (SLB): center the viewport on the trade window using both
    // visibleFromMs and visibleToMs. Handled by the socialLeaderboard overlay
    // which subscribes to onDataLoaded and frames the exact trade window.
    if (getSlbMode()) {
        slbCenterViewport(chart, { immediate: options?.dataAlreadyLoaded });
        return;
    }
    const fromMs = getVisibleFromMs();
    if (fromMs === null) {
        try {
            chart.getTimeScale().setRightOffset(2);
        }
        catch (error) {
            reportErrorToRN(error);
        }
        return;
    }
    // Strategy A / B: anchor the visible range from `visibleFromMs` to the
    // last bar + 2-bar padding. This one-sided framing works because Token
    // Details and Perps always want the right edge near the latest candle.
    const capturedGeneration = getOhlcvGeneration();
    const subscription = chart.onDataLoaded();
    const onLoaded = () => {
        subscription.unsubscribe(null, onLoaded);
        if (capturedGeneration !== getOhlcvGeneration()) {
            return;
        }
        const data = getOhlcvData();
        const lastBar = data.at(-1);
        const toSec = lastBar
            ? Math.ceil(lastBar.time / 1000)
            : Math.ceil(Date.now() / 1000);
        const barPadSec = getApproxBarDurationSec(data) * 2;
        try {
            chart.setVisibleRange({ from: Math.floor(fromMs / 1000), to: toSec + barPadSec }, { percentRightMargin: 0 });
        }
        catch (error) {
            reportErrorToRN(error);
        }
    };
    subscription.subscribe(null, onLoaded);
}
function emitLayoutSettled() {
    if (doesLegendOwnLayoutSettle()) {
        return;
    }
    const send = () => {
        if (getWidget() && isChartReady()) {
            postToRN('CHART_LAYOUT_SETTLED', {});
        }
    };
    try {
        requestAnimationFrame(() => {
            requestAnimationFrame(send);
        });
    }
    catch {
        setTimeout(send, 48);
    }
}
function resetMainPriceScaleAutoScale(chart) {
    try {
        if (typeof chart.getPanes !== 'function') {
            return;
        }
        const panes = chart.getPanes?.();
        const mainPane = panes?.[0];
        if (!mainPane || typeof mainPane.getMainSourcePriceScale !== 'function') {
            return;
        }
        const priceScale = mainPane.getMainSourcePriceScale();
        if (typeof priceScale?.setAutoScale === 'function') {
            priceScale.setAutoScale(true);
        }
    }
    catch {
        // Best-effort; failures are non-critical
    }
}
function resetDatafeedCacheBeforeHotReload(widget) {
    try {
        if (typeof widget.resetCache === 'function') {
            widget.resetCache();
        }
    }
    catch {
        // Best-effort; failures are non-critical
    }
}
/** Test-only: clear the first-data trigger and the delivery flag. */
function _resetOhlcvIngestionForTests() {
    firstDataCallback = null;
    firstDataDelivered = false;
}
//# sourceMappingURL=ohlcvIngestion.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/widget/visualOverrides.mjs
// Visual override application — grid colour, pane separator, current-price
// line colour. Driven from CONFIG.visualOverrides (set by the consumer's
// `visualOverrides` prop on the RN side).
//
// New module in Phase 2 — there was no single legacy equivalent; the legacy
// code spread these overrides across init + theme + series style branches.
// Centralising here lets Perps (Phase 6) feed surface-specific overrides via
// the same path.


/**
 * Builds the TradingView override object from a VisualOverridesConfig.
 * Returned shape is suitable for passing into TradingView's `applyOverrides`.
 *
 * @param config - The visual overrides configuration, or undefined.
 * @returns A TradingView overrides object (empty when no config is given).
 */
function buildVisualOverrides(config) {
    if (!config) {
        return {};
    }
    const overrides = {};
    if (config.gridLineColor !== undefined) {
        overrides['paneProperties.vertGridProperties.color'] = config.gridLineColor;
        overrides['paneProperties.horzGridProperties.color'] = config.gridLineColor;
    }
    if (config.hidePaneSeparator) {
        overrides['paneProperties.separatorColor'] = 'rgba(0,0,0,0)';
    }
    if (config.currentPriceLineColor !== undefined) {
        overrides['mainSeriesProperties.priceLineColor'] =
            config.currentPriceLineColor;
    }
    return overrides;
}
/**
 * Apply visual overrides to a live widget. Safe to call before chart-ready —
 * TradingView queues overrides internally. Errors are forwarded to RN.
 *
 * @param config - The visual overrides configuration, or undefined.
 */
function applyVisualOverrides(config) {
    const widget = getWidget();
    if (!widget) {
        return;
    }
    const overrides = buildVisualOverrides(config);
    if (Object.keys(overrides).length === 0) {
        return;
    }
    try {
        widget.applyOverrides(overrides);
    }
    catch (error) {
        reportErrorToRN(error);
    }
}
//# sourceMappingURL=visualOverrides.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/core/loadLibrary.mjs
// Loads the TradingView Advanced Charts library from window.CONFIG.libraryUrl
// by injecting a <script> tag into the document head.
//
// Mirrors legacy chartLogic.js `loadLibrary()` (lines ~5211-5237) but returns
// a Promise so callers can `await` library readiness in bootstrap.ts.


const CHARTING_LIBRARY_FILE = 'charting_library.js';
let inflightPromise = null;
/**
 * Loads the TradingView library script. Subsequent calls resolve immediately
 * if the library is already loaded; rejected if a previous load failed.
 * Concurrent calls while the script is still loading share the same promise.
 *
 * @param libraryUrl - Base URL that the `charting_library.js` file is appended to.
 * @returns A promise that resolves once the library script has loaded.
 */
function loadLibrary_loadTradingViewLibrary(libraryUrl) {
    if (isLibraryLoaded()) {
        return Promise.resolve();
    }
    const existingError = getLibraryError();
    if (existingError) {
        return Promise.reject(new Error(existingError));
    }
    if (inflightPromise) {
        return inflightPromise;
    }
    inflightPromise = new Promise((resolve, reject) => {
        const scriptUrl = libraryUrl + CHARTING_LIBRARY_FILE;
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = scriptUrl;
        script.onload = () => {
            setLibraryLoaded(true);
            inflightPromise = null;
            resolve();
        };
        script.onerror = () => {
            const message = `Failed to load TradingView library. URL: ${scriptUrl}`;
            setLibraryError(message);
            inflightPromise = null;
            reportErrorToRN(message);
            reject(new Error(message));
        };
        document.head.appendChild(script);
    });
    return inflightPromise;
}
/**
 * Resets the cached in-flight library-load promise.
 *
 * @internal
 */
function _resetLoadLibraryForTests() {
    inflightPromise = null;
}
//# sourceMappingURL=loadLibrary.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/core/bootstrap.mjs
// Entry orchestration. Called once from src/index.ts when the IIFE evaluates
// inside the WebView.
//
// Responsibilities (Phase 1 + 2):
// 1. Read window.CONFIG (must be inlined by AdvancedChartTemplate before this
//    script runs).
// 2. Seed core state with the symbol / resolution / theme from CONFIG.
// 3. Wire the RN→WV bridge to the message dispatcher.
// 4. Register Phase 1 + 2 message handlers:
//      SET_THEME_COLORS (Phase 1), SET_OHLCV_DATA, REALTIME_UPDATE,
//      SET_CHART_TYPE (Phase 2).
// 5. Begin loading the TradingView library so it's ready when the first
//    SET_OHLCV_DATA arrives.
// 6. On first SET_OHLCV_DATA: createChartWidget with the default datafeed,
//    apply visual overrides, attach crosshair + visible-range listeners.


























/**
 * When RN passes an explicit visible-range start (e.g. a specific period like
 * 1D/1W/1M), build a `{ type: 'time-range', from, to }` timeframe so the
 * initial view snaps to that window instead of defaulting to `Date.now()`.
 * Padded by 2 bar durations so the last bar isn't glued to the right edge.
 * Ported from chartLogic.js initChart's `tfOption` computation (~line 5284).
 *
 * @returns A `time-range` timeframe pinned to the requested window, or
 * `undefined` when RN did not pass an explicit visible-range start.
 */
function buildInitialTimeframe() {
    const visibleFromMs = getVisibleFromMs();
    if (visibleFromMs === null) {
        return undefined;
    }
    const visibleToMs = getVisibleToMs() ?? Date.now();
    const initBarPadSec = getApproxBarDurationSec(getOhlcvData()) * 2;
    return {
        type: 'time-range',
        from: Math.floor(visibleFromMs / 1000),
        to: Math.ceil(visibleToMs / 1000) + initBarPadSec,
    };
}
function readConfig() {
    const config = window.CONFIG;
    if (!config) {
        throw new Error('window.CONFIG is missing — AdvancedChartTemplate must inline ' +
            'CONFIG before chartLogic runs.');
    }
    return config;
}
/**
 * Phase 1 + 2 bootstrap. Returns the resolved CONFIG so callers (and tests)
 * can inspect what booted. Idempotent on its inbound subscription — the
 * WebView is not expected to bootstrap twice.
 *
 * @returns The resolved chart configuration read from `window.CONFIG`.
 */
function bootstrap() {
    const config = readConfig();
    initThemeFromConfig(config.theme);
    if (typeof config.subPaneHeightRatio === 'number') {
        setSubPaneHeightRatio(config.subPaneHeightRatio);
    }
    registerHandler('SET_THEME_COLORS', (payload) => {
        applyThemeColors(payload);
    });
    registerHandler('SET_OHLCV_DATA', (payload) => {
        handleSetOHLCVData(payload);
    });
    registerHandler('REALTIME_UPDATE', (payload) => {
        handleRealtimeUpdate(payload);
    });
    registerHandler('SET_CHART_TYPE', (payload) => {
        handleSetChartType(payload);
    });
    registerHandler('ADD_INDICATOR', (payload) => {
        handleAddIndicator(payload, config);
    });
    registerHandler('REMOVE_INDICATOR', (payload) => {
        handleRemoveIndicator(payload);
    });
    registerHandler('SET_MA_VISIBILITY', (payload) => {
        handleSetMAVisibility(payload, config);
    });
    registerHandler('TOGGLE_VOLUME', (payload) => {
        handleToggleVolume(payload);
    });
    registerHandler('SET_SUB_PANE_LAYOUT', (payload) => {
        handleSetSubPaneLayout(payload);
    });
    registerTradeMarkerOverlay();
    registerTradeMarkerPulseHandler();
    registerFocusTimeOverlay();
    registerPositionLinesOverlay();
    registerRnBackedPaginationHandler();
    registerVolumeThemeSync();
    onFromRN((message) => {
        dispatchInboundMessage(message);
    });
    // Library load is fire-and-forget; the first-data handler awaits readiness
    // again before constructing the widget, so this is purely a head-start.
    loadLibrary_loadTradingViewLibrary(config.libraryUrl).catch((error) => {
        reportErrorToRN(error);
    });
    onFirstOhlcvData(() => {
        loadLibrary_loadTradingViewLibrary(config.libraryUrl)
            .then(() => {
            return createChartWidget(config, {
                datafeed: customDatafeed,
                customFormatters: {
                    priceFormatterFactory: advancedChartPriceFormatterFactory,
                },
                timeframe: buildInitialTimeframe(),
                onReady: (widget) => {
                    try {
                        flushPendingTheme();
                        applyScaleLayout();
                        applyVisualOverrides(config.visualOverrides);
                        setupLegendOverlay(config.legendOverlay);
                        const chart = widget.activeChart();
                        // Match legacy onChartReady: when no explicit visible range
                        // was passed, pin a 2-bar gap on the right. TV's default is
                        // wider, leaving the chart visibly offset left.
                        if (getVisibleFromMs() === null) {
                            try {
                                chart.getTimeScale().setRightOffset(2);
                            }
                            catch (rightOffsetError) {
                                reportErrorToRN(rightOffsetError);
                            }
                        }
                        attachCrosshairListener(chart);
                        attachTapDismiss(widget);
                        attachMarkerHitTest(widget, chart);
                        attachVisibleRangeListeners(chart);
                        chart
                            .selection()
                            .onChanged()
                            .subscribe(null, () => {
                            chart.selection().clear();
                        });
                        attachLegendResizeListener(widget);
                        slbScheduleInitialCentering();
                        scheduleChartLayoutSettledNotify();
                    }
                    catch (error) {
                        reportErrorToRN(error);
                    }
                },
            });
        })
            .catch((error) => {
            reportErrorToRN(error);
        });
    });
    postToRN('DEBUG', { message: 'modular-bootstrap-ready' });
    return config;
}
//# sourceMappingURL=bootstrap.mjs.map
;// CONCATENATED MODULE: ./node_modules/@metamask/advanced-chart-core/dist/index.mjs
// AdvancedChart WebView IIFE entry point.
//
// Evaluated at runtime inside the WebView after AdvancedChartTemplate has
// inlined window.CONFIG via a preceding <script> block. Calls bootstrap()
// to seed state, wire the RN bridge, register Phase 1 handlers, and begin
// loading the TradingView library.
//
// Future phases register their handlers / overlays / features inside their
// own modules; this file stays a thin entry point.


try {
    bootstrap();
}
catch (error) {
    reportErrorToRN(error);
}
//# sourceMappingURL=index.mjs.map
var __webpack_export_target__ = self;
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;
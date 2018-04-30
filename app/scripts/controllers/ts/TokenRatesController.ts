import BaseController, { BaseConfig, BaseState } from './BaseController';
import PreferencesController, { PreferencesState, TokenList } from './PreferencesController';

const DEFAULT_UPDATE_INTERVAL = 1000;

interface TokenRatesConfig extends BaseConfig {
	interval?: number;
	preferencesController: PreferencesController;
}

/**
 * @type TokenRatesState
 *
 * TokenRatesController state
 *
 * @property contractExchangeRates - Hash of token contract addresses to exchange rates
 */
export interface TokenRatesState extends BaseState {
	contractExchangeRates: {[key: string]: number};
}

/**
 * Controller class that polls for token exchange
 * rates based on the current account's token list
 */
export class TokenRatesController extends BaseController<TokenRatesConfig, TokenRatesState> {
	private handle: number;
	private preferences: PreferencesController;
	private tokenList: TokenList;

	/**
	 * Creates a TokenRatesController
	 *
	 * @param config - Options to configure this controller
	 */
	constructor(config: TokenRatesConfig, initialState?: TokenRatesState) {
		super(config, initialState);
		const { interval = DEFAULT_UPDATE_INTERVAL, preferencesController } = config;
		this.onPreferencesUpdate = this.onPreferencesUpdate.bind(this);
		this.interval = interval;
		this.preferencesController = preferencesController;
	}

	private onPreferencesUpdate({ tokens = [] }: PreferencesState) {
		this.tokens = tokens;
	}

	/**
	 * @param interval - Polling interval used to fetch new token rates
	 */
	set interval(interval: number) {
		this.handle && clearInterval(this.handle);
		this.handle = window.setInterval(() => { this.updateExchangeRates() }, interval);
	}

	/**
	 * @param preferencesController - PreferencesControllers used to retrieve account tokens
	 */
	set preferencesController(preferences: PreferencesController) {
		this.preferences && this.preferences.unsubscribe(this.onPreferencesUpdate);
		this.preferences = preferences;
		this.tokens = preferences.state.tokens;
		preferences.subscribe(this.onPreferencesUpdate);
	}

	/**
	 * @param tokens - List of tokens to track exchange rates for
	 */
	set tokens(tokens: TokenList) {
		this.tokenList = tokens;
		this.updateExchangeRates()
	}

	/**
	 * Fetches a token exchange rate by address
	 *
	 * @param address - Token contract address
	 * @returns - Promise resolving to exchange rate for given contract address
	 */
	async fetchExchangeRate(address: string): Promise<number> {
		try {
			const response = await fetch(`https://metamask.balanc3.net/prices?from=${address}&to=ETH&autoConversion=false&summaryOnly=true`)
			const json = await response.json()
			return json && json.length ? json[0].averagePrice : 0
		} catch (error) {
			return 0;
		}
	}

	/**
	 * Updates exchange rates for all tokens
	 */
	async updateExchangeRates() {
		if (this.disabled) { return; }
		const contractExchangeRates: {[key: string]: number} = {};
		for (const i in this.tokenList) {
			const address = this.tokenList[i].address;
			contractExchangeRates[address] = await this.fetchExchangeRate(address);
		}
		this.updateState({ contractExchangeRates });
	}
}

export default TokenRatesController;

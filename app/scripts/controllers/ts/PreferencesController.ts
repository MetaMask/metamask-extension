import BaseController, { BaseConfig, BaseState } from './BaseController';
const normalize = require('eth-sig-util').normalize;

/**
 * @type Token
 *
 * Token representation
 *
 * @property address - Hex address of the token contract
 * @property decimals - Number of decimals the token uses
 * @property symbol - Symbol of the token
 */
export interface Token {
	address: string;
	decimals: number;
	symbol: string;
}

/**
 * @type TokenList
 *
 * List of tokens
 */
export type TokenList = Array<Token>;

/**
 * @type TokenRatesState
 *
 * Internal TokenRatesController state
 *
 * @property currentAccountTab - Indicates the selected tab in the ui
 * @property currentLocale - Preferred language locale key
 * @property featureFlags - Key-boolean map with keys as boolean features flags
 * @property frequentRpcList - List of custom rpcs to provide the user
 * @property selectedAddress - Hex string that matches the currently selected address in the app
 * @property tokens - Tokens the user wants display in their token lists
 * @property useBlockie - Users preference for blockie identicons within the UI
 */
export interface PreferencesState extends BaseState {
	currentAccountTab?: string;
	currentLocale?: string;
	featureFlags?: {[key: string]: boolean};
	frequentRpcList?: Array<string>;
	selectedAddress?: string;
	tokens?: TokenList;
	useBlockie?: boolean;
}

/**
 * Controller that maintains account preferences
 */
export class PreferencesController extends BaseController<BaseConfig, PreferencesState> {
	/**
	 * Creates a TokenRatesController
	 *
	 * @param config - Options to configure this controller
	 */
	constructor(config: BaseConfig, initialState?: PreferencesState) {
		super({}, { ...initialState, ...{
			currentAccountTab: 'history',
			featureFlags: {},
			frequentRpcList: [],
			tokens: [],
			useBlockie: false
		}});
	}

	/**
	 * Adds a new token to the token list or updates the token if
	 * associated contract is an address that already exists
	 *
	 * @param rawAddress - Hex address of the token contract, potentially checksummed
	 * @param symbol - Symbol of the token
	 * @param decimals - Number of decimals the token uses
	 * @returns - New token list
	 */
	addToken(rawAddress: string, symbol: string, decimals: number): TokenList {
		const address = normalize(rawAddress);
		const tokens = this.state.tokens;
		const newToken = { address, symbol, decimals };
		const existingToken = tokens.find(token => token.address === address);
		const existingIndex = tokens.indexOf(existingToken);

		if (existingToken) {
			tokens[existingIndex] = newToken;
		}
		else {
			tokens.push(newToken);
		}

		this.updateState({ tokens });
		return tokens;
	}

	/**
	 * Removes a specified token from the token list
	 *
	 * @param rawAddress - Hex address of the token contract to remove
	 * @returns - New token list
	 */
	removeToken(rawAddress: string) {
		const address = normalize(rawAddress);
		const tokens = this.state.tokens;
		const newTokens = tokens.filter(token => token.address !== address);
		this.updateState({ tokens: newTokens });
		return newTokens;
	}

	/**
	 * Updates a boolean property on the internal featureFlags state object.
	 *
	 * @param feature - Key that corresponds to a UI feature.
	 * @param activated - Indicates whether or not the UI feature should be displayed
	 * @returns - Updated featureFlags object
	 */
	setFeatureFlag(feature: string, activated: boolean) {
		const updatedFeatureFlags = {
			...this.state.featureFlags,
			[feature]: activated
		};

		this.updateState({
			featureFlags: {
				...this.state.featureFlags,
				[feature]: activated
			}
		});

		return this.state.featureFlags;
	}

	/**
	 * Returns an updated rpcList based on the passed url and the current list.
	 * The returned list will have a max length of 2. If the _url currently
	 * exists in the list, it will be moved to the end of the list. The current
	 * list is modified and returned.
	 *
	 * @param url - Rpc url to add to the frequentRpcList.
	 * @returns - New frequentRpcList
	 */
	updateFrequentRpcList (url: string) {
		const rpcList = this.state.frequentRpcList;
		const index = rpcList.findIndex(rpcUrl => rpcUrl === url);
		(index !== -1) && rpcList.splice(index, 1);
		(url !== 'http://localhost:8545') && rpcList.push(url);
		(rpcList.length > 2) && rpcList.shift();
		return rpcList;
	}
}

export default PreferencesController;

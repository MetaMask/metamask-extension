type Listener<T> = (state: T) => void;

/**
 * Base controller configuration
 */
export type BaseConfig = {
	disabled?: boolean;
}

/**
 * Base state representation
 */
export type BaseState = { }

/**
 * Controller class that provides subscription capabilities and
 * defines a standard interface other controllers must implement
 */
export class BaseController<C extends BaseConfig, S extends BaseState> {
	private internalState: S;
	private listeners: Array<Listener<S>> = [];

	/**
	 * Determines if listeners are notified of state changes
	 */
	disabled: boolean;

	/**
	 * Creates a BaseController
	 *
	 * @param - Initial state to set on this controller
	 */
	constructor(config: C, initialState?: S) {
		this.disabled = config.disabled;
		this.state = initialState;
	}

	/**
	 * Retrieves internal state
	 *
	 * @returns - Current internal state
	 */
	get state(): S {
		return this.internalState;
	}

	/**
	 * Updates internal state
	 *
	 * @param state - New state to store
	 */
	set state(state: S) {
		this.internalState = Object.assign({}, state) || {} as S;
		this.notify();
	}

	/**
	 * Notifies all subscribed listeners of current state
	 */
	notify() {
		!this.disabled && this.listeners.forEach(listener => { listener(this.internalState); });
	}

	/**
	 * Adds new listener to be notified of state changes
	 *
	 * @param listener - Callback triggered when state changes
	 */
	subscribe(listener: Listener<S>) {
		this.listeners.push(listener);
	}

	/**
	 * Removes existing listener from receiving state changes
	 *
	 * @param listener - Callback to remove
	 * @returns - True if a listener is found and unsubscribed
	 */
	unsubscribe(listener: Listener<S>): boolean {
		const index = this.listeners.findIndex(cachedListener => listener === cachedListener);
		index > -1 && this.listeners.splice(index, 1);
		return index > -1 ? true : false;
	}

	/**
	 * Merges new state on top of existing state
	 */
	updateState(data: S) {
		this.state = Object.assign(this.internalState, data);
	}
}

export default BaseController;

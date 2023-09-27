/** The name types supported by the NameController. */
export declare enum NameType {
    /** The address of an Ethereum account. */
    ETHEREUM_ADDRESS = "ethereumAddress"
}
/** The metadata for a name provider. */
export declare type NameProviderMetadata = {
    /**
     * IDs for each alternate source of proposed names.
     * Keyed by the name type.
     */
    sourceIds: Record<NameType, string[]>;
    /**
     * Friendly labels to describe each source of proposed names.
     * Keyed by the source ID.
     */
    sourceLabels: Record<string, string>;
};
/** The request data to get proposed names from a name provider. */
export declare type NameProviderRequest = {
    /** The optional list of source IDs to get proposed names from. */
    sourceIds?: string[];
    /** The type of name being requested. */
    type: NameType;
    /** The raw value to get proposed names for. */
    value: string;
    /**
     * The variation of the raw value to get proposed names for.
     * For example, the chain ID if the raw value is an Ethereum address.
     */
    variation: string;
};
/** The resulting data after requesting proposed names from a name provider, for a single source. */
export declare type NameProviderSourceResult = {
    /**
     * The array of proposed names from the source.
     * Undefined if there is an error.
     */
    proposedNames?: string[];
    /**
     * The delay in seconds before the next request to the source should be made.
     * Can be used to avoid rate limiting for example.
     */
    updateDelay?: number;
    /**
     * An error that occurred while fetching the proposed names from the source.
     * Undefined if there was no error.
     */
    error?: unknown;
};
/** The resulting data after requesting proposed names from a name provider. */
export declare type NameProviderResult = {
    /**
     * The resulting data from each alternate source of proposed names supported by the name provider.
     * Keyed by the source ID.
     */
    results: Record<string, NameProviderSourceResult>;
    /**
     * An error that occurred while fetching the proposed names that was not specific to a single source.
     * Undefined if there was no error.
     */
    error?: unknown;
};
/** An object capable of proposing friendly names for a raw value of a given type. */
export declare type NameProvider = {
    /**
     * Returns metadata about the name provider.
     */
    getMetadata(): NameProviderMetadata;
    /**
     * Returns proposed names for the given value and request data.
     *
     * @param request - The request data including the value to propose names for.
     */
    getProposedNames(request: NameProviderRequest): Promise<NameProviderResult>;
};
//# sourceMappingURL=types.d.ts.map
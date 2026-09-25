export declare class Variables {
    #private;
    /** @param declarations - Env variable names declared in builds.yml. */
    constructor(declarations: Iterable<string>);
    /**
     * @param key - The name of the variable
     * @throws {TypeError} If there is no definition of a variable.
     */
    get(key: string): unknown;
    /**
     * Returns a declared, but maybe not defined variable.
     *
     * @param key - The name of the variable
     * @throws {TypeError} If there was no declaration of the variable.
     * @returns The value, or undefined if the variables wasn't defined.
     */
    getMaybe(key: string): unknown;
    /** Sets one declared variable. */
    set(key: string, value: unknown): void;
    /** Sets many declared variables from a key-value object. */
    set(records: Record<string, unknown>): void;
    isDeclared(key: string): boolean;
    isDefined(key: string): boolean;
    [Symbol.iterator]: () => Generator<string>;
    declarations(): Generator<string>;
    definitions(): Generator<[string, unknown]>;
}

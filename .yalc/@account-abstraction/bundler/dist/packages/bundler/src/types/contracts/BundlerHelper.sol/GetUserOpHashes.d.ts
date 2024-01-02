import type { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "../../common";
export type UserOperationStruct = {
    sender: PromiseOrValue<string>;
    nonce: PromiseOrValue<BigNumberish>;
    initCode: PromiseOrValue<BytesLike>;
    callData: PromiseOrValue<BytesLike>;
    callGasLimit: PromiseOrValue<BigNumberish>;
    verificationGasLimit: PromiseOrValue<BigNumberish>;
    preVerificationGas: PromiseOrValue<BigNumberish>;
    maxFeePerGas: PromiseOrValue<BigNumberish>;
    maxPriorityFeePerGas: PromiseOrValue<BigNumberish>;
    paymasterAndData: PromiseOrValue<BytesLike>;
    signature: PromiseOrValue<BytesLike>;
};
export type UserOperationStructOutput = [
    string,
    BigNumber,
    string,
    string,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    string,
    string
] & {
    sender: string;
    nonce: BigNumber;
    initCode: string;
    callData: string;
    callGasLimit: BigNumber;
    verificationGasLimit: BigNumber;
    preVerificationGas: BigNumber;
    maxFeePerGas: BigNumber;
    maxPriorityFeePerGas: BigNumber;
    paymasterAndData: string;
    signature: string;
};
export interface GetUserOpHashesInterface extends utils.Interface {
    functions: {
        "getUserOpHashes(address,(address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])": FunctionFragment;
    };
    getFunction(nameOrSignatureOrTopic: "getUserOpHashes"): FunctionFragment;
    encodeFunctionData(functionFragment: "getUserOpHashes", values: [PromiseOrValue<string>, UserOperationStruct[]]): string;
    decodeFunctionResult(functionFragment: "getUserOpHashes", data: BytesLike): Result;
    events: {};
}
export interface GetUserOpHashes extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: GetUserOpHashesInterface;
    queryFilter<TEvent extends TypedEvent>(event: TypedEventFilter<TEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TEvent>>;
    listeners<TEvent extends TypedEvent>(eventFilter?: TypedEventFilter<TEvent>): Array<TypedListener<TEvent>>;
    listeners(eventName?: string): Array<Listener>;
    removeAllListeners<TEvent extends TypedEvent>(eventFilter: TypedEventFilter<TEvent>): this;
    removeAllListeners(eventName?: string): this;
    off: OnEvent<this>;
    on: OnEvent<this>;
    once: OnEvent<this>;
    removeListener: OnEvent<this>;
    functions: {
        getUserOpHashes(entryPoint: PromiseOrValue<string>, userOps: UserOperationStruct[], overrides?: CallOverrides): Promise<[string[]] & {
            ret: string[];
        }>;
    };
    getUserOpHashes(entryPoint: PromiseOrValue<string>, userOps: UserOperationStruct[], overrides?: CallOverrides): Promise<string[]>;
    callStatic: {
        getUserOpHashes(entryPoint: PromiseOrValue<string>, userOps: UserOperationStruct[], overrides?: CallOverrides): Promise<string[]>;
    };
    filters: {};
    estimateGas: {
        getUserOpHashes(entryPoint: PromiseOrValue<string>, userOps: UserOperationStruct[], overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        getUserOpHashes(entryPoint: PromiseOrValue<string>, userOps: UserOperationStruct[], overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}

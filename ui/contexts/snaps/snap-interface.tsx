import {
  File as FileObject,
  FormState,
  InterfaceState,
  State,
  UserInputEventType,
} from '@metamask/snaps-sdk';
import { encodeBase64 } from '@metamask/snaps-utils';
import { Json } from '@metamask/utils';
import React, {
  FunctionComponent,
  createContext,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useDispatch } from 'react-redux';
import {
  handleSnapRequest as handleSnapRequestFunction,
  updateInterfaceState,
  forceUpdateMetamaskState,
} from '../../store/actions';
import { mergeValue } from './utils';

export type HandleEvent = <Type extends State>(args: {
  event: UserInputEventType;
  name?: string;
  value?: Type | null;
}) => void;

export type HandleInputChange = <Type extends State>(
  name: string,
  value: Type | null,
  form?: string,
) => void;

export type GetValue = (name: string, form?: string) => State | undefined;

export type HandleFileChange = (
  name: string,
  file: File | null,
  form?: string,
) => void;

export type SetCurrentInputFocus = (name: string | null) => void;

export type SnapInterfaceContextType = {
  handleEvent: HandleEvent;
  getValue: GetValue;
  handleInputChange: HandleInputChange;
  handleFileChange: HandleFileChange;
  setCurrentFocusedInput: SetCurrentInputFocus;
  focusedInput: string | null;
  snapId: string;
};

export const SnapInterfaceContext =
  createContext<SnapInterfaceContextType | null>(null);

export type SnapInterfaceContextProviderProps = {
  interfaceId: string;
  snapId: string;
  initialState: InterfaceState;
  context: Json;
};

/**
 * The Snap interface context provider that handles all the interface state operations.
 *
 * @param params - The context provider params.
 * @param params.children - The childrens to wrap with the context provider.
 * @param params.interfaceId - The interface ID to use.
 * @param params.snapId - The Snap ID that requested the interface.
 * @param params.initialState - The initial state of the interface.
 * @param params.context - The context blob of the interface.
 * @returns The context provider.
 */
export const SnapInterfaceContextProvider: FunctionComponent<
  SnapInterfaceContextProviderProps
> = ({ children, interfaceId, snapId, initialState, context }) => {
  const dispatch = useDispatch();

  // We keep an internal copy of the state to speed up the state update in the
  // UI. It's kept in a ref to avoid useless re-rendering of the entire tree of
  // components.
  const internalState = useRef<InterfaceState>(initialState ?? {});
  const focusedInput = useRef<string | null>(null);

  // Since the internal state is kept in a reference, it won't update when the
  // interface is updated. We have to manually update it.
  useEffect(() => {
    internalState.current = initialState;
  }, [initialState]);

  const handleSnapRequest = (
    event: UserInputEventType,
    name?: string,
    value?: unknown,
  ) => {
    handleSnapRequestFunction<Parameters<HandleEvent>[0]>({
      snapId,
      origin: '',
      handler: 'onUserInput',
      request: {
        jsonrpc: '2.0',
        method: ' ',
        params: {
          event: {
            type: event,
            // TODO: Allow null in the types and simplify this
            ...(name !== undefined && name !== null ? { name } : {}),
            ...(value !== undefined && value !== null ? { value } : {}),
          },
          id: interfaceId,
          context,
        },
      },
    }).then(() => forceUpdateMetamaskState(dispatch));
  };

  const updateState = (state: InterfaceState) =>
    dispatch(updateInterfaceState(interfaceId, state));

  /**
   * Handle the submission of an user input event to the Snap.
   *
   * @param options - An options bag.
   * @param options.event - The event type.
   * @param options.name - The name of the component emitting the event.
   * @param options.value - The value of the component emitting the event.
   */
  const handleEvent: HandleEvent = ({
    event,
    name,
    value = name ? internalState.current[name] : undefined,
  }) => handleSnapRequest(event, name, value);

  const submitInputChange = (name: string, value: State | null) =>
    handleEvent({
      event: UserInputEventType.InputChangeEvent,
      name,
      value,
    });

  /**
   * Handle the value change of an input.
   *
   * @param name - The name of the input.
   * @param value - The new value.
   * @param form - The name of the form containing the input.
   * Optional if the input is not contained in a form.
   */
  const handleInputChange: HandleInputChange = (name, value, form) => {
    const state = mergeValue(internalState.current, name, value, form);

    internalState.current = state;
    updateState(state);
    submitInputChange(name, value);
  };

  const uploadFile = (name: string, file: FileObject | null) => {
    handleSnapRequestFunction<Parameters<HandleEvent>[0]>({
      snapId,
      origin: '',
      handler: 'onUserInput',
      request: {
        jsonrpc: '2.0',
        method: ' ',
        params: {
          event: {
            type: UserInputEventType.FileUploadEvent,
            ...(name === undefined ? {} : { name }),
            ...(file === undefined ? {} : { file }),
          },
          id: interfaceId,
          context,
        },
      },
    }).then(() => forceUpdateMetamaskState(dispatch));
  };

  /**
   * Handle the file change of an input.
   *
   * @param name - The name of the input.
   * @param file - The file to upload.
   * @param form - The name of the form containing the input.
   */
  const handleFileChange: HandleFileChange = (name, file, form) => {
    if (file) {
      file
        .arrayBuffer()
        .then((arrayBuffer) => new Uint8Array(arrayBuffer))
        .then((uint8Array) => encodeBase64(uint8Array))
        .then((base64) => {
          const fileObject: FileObject = {
            name: file.name,
            size: file.size,
            contentType: file.type,
            contents: base64 as string,
          };

          const state = mergeValue(
            internalState.current,
            name,
            fileObject,
            form,
          );

          internalState.current = state;
          updateState(state);
          uploadFile(name, fileObject);
        });

      return;
    }

    const state = mergeValue(internalState.current, name, null, form);

    internalState.current = state;
    updateState(state);
    uploadFile(name, null);
  };

  /**
   * Get the value of an input from the interface state.
   *
   * @param name - The name of the input.
   * @param form - The name of the form containing the input.
   * Optional if the input is not contained in a form.
   * @returns The value of the input or undefinded if the input has no value.
   */
  const getValue: GetValue = (name, form) => {
    const value = form
      ? (initialState[form] as FormState)?.[name]
      : (initialState as FormState)?.[name];

    if (value !== undefined && value !== null) {
      return value;
    }

    return undefined;
  };

  const setCurrentFocusedInput: SetCurrentInputFocus = (name) =>
    (focusedInput.current = name);

  return (
    <SnapInterfaceContext.Provider
      value={{
        handleEvent,
        getValue,
        handleInputChange,
        handleFileChange,
        setCurrentFocusedInput,
        focusedInput: focusedInput.current,
        snapId,
      }}
    >
      {children}
    </SnapInterfaceContext.Provider>
  );
};

/**
 * The utility hook to consume the Snap inteface context.
 *
 * @returns The snap interface context.
 */
export function useSnapInterfaceContext() {
  return useContext(SnapInterfaceContext) as SnapInterfaceContextType;
}

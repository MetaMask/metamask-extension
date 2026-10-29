import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useState,
} from 'react';

type Props = {
  value: boolean;
  setValue: Dispatch<SetStateAction<boolean>>;
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
};

export function useBoolean(defaultValue = false): Props {
  const [value, setValue] = useState(defaultValue);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const toggle = useCallback(() => {
    setValue((currentValue) => !currentValue);
  }, []);

  return { value, setValue, setTrue, setFalse, toggle };
}

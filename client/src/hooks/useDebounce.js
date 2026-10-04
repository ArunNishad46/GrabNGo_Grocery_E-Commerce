import { useEffect, useState } from "react";

// Returns `value` only after it has stopped changing for `delay` ms
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer); // cancel on every new keystroke
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;

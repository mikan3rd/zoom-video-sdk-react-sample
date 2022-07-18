import { useMemo, useRef } from "react";

import _ from "lodash";

export function useDebounceFn(fn: (args: any) => void, wait: number) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const debounced = useMemo(() => _.debounce((...args) => fnRef.current(args), wait), [wait]);
  return {
    run: debounced,
    cancel: debounced.cancel,
    flush: debounced.flush,
  };
}

import { useRef } from "react";

export function usePersistFn(fn: (args: any) => void) {
  const fnRef = useRef<(args: any) => void>(fn);
  fnRef.current = fn;
  const persistFn = useRef<(args: any) => void>();
  if (persistFn.current === undefined) {
    persistFn.current = function (...args: any) {
      return fnRef.current.apply(this, args);
    };
  }
  return persistFn.current;
}

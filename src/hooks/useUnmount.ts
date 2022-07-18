import { useEffect, useRef } from "react";

export function useUnmount(fn: () => void) {
  const fnRef = useRef<() => void>(fn);
  fnRef.current = fn;
  useEffect(
    () => () => {
      fnRef.current();
    },
    [],
  );
}

export function useMount(fn: () => void) {
  useEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

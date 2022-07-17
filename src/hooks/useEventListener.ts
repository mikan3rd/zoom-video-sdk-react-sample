import { MutableRefObject, useEffect, useRef } from "react";
export function useEventListener(
  target: MutableRefObject<HTMLElement | null | undefined> | HTMLElement | null | undefined,
  eventName: string,
  handler: (event: Event) => void,
  options = { capture: false, passive: false },
) {
  const handlerRef = useRef<(event: Event) => void>();
  handlerRef.current = handler;
  useEffect(() => {
    let targetElement: null | Window | HTMLElement = null;
    if (target === null || target === undefined) {
      targetElement = window;
    } else if (Object.hasOwnProperty.call(target, "current")) {
      targetElement = (target as MutableRefObject<HTMLElement>).current;
    } else {
      targetElement = target as HTMLElement;
    }

    const eventListener = (event: Event) => handlerRef.current !== undefined && handlerRef.current(event);
    targetElement.addEventListener(eventName, eventListener, {
      capture: options.capture,
      passive: options.passive,
    });
    return () => {
      targetElement?.removeEventListener(eventName, eventListener, {
        capture: options.capture,
      });
    };
  }, [target, eventName, options]);
}

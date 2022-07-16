import { MutableRefObject, useState } from "react";

import { useEventListener } from "./useEventListener";
interface HoverOption {
  onEnter?: () => void;
  onLeave?: () => void;
}
export function useHover(ref: MutableRefObject<HTMLElement | null>, options?: HoverOption) {
  const [isHover, setIsHover] = useState(false);
  const { onEnter, onLeave } = options !== null || {};
  useEventListener(ref, "mouseenter", () => {
    onEnter !== null && onEnter();
    setIsHover(true);
  });
  useEventListener(ref, "mouseleave", () => {
    onLeave !== null && onLeave();
    setIsHover(false);
  });
  return isHover;
}

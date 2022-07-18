import { MutableRefObject, useCallback, useEffect, useState } from "react";

import _ from "lodash";

import { useMount, useSizeCallback } from "../../../hooks";
import { MediaStream } from "../../../index-types.d";
export function useCanvasDimension(
  mediaStream: MediaStream | null,
  videoRef: MutableRefObject<HTMLCanvasElement | null>,
) {
  const [dimension, setDimension] = useState({ width: 0, height: 0 });
  const onCanvasResize = useCallback(({ width, height }: { width: number; height: number }) => {
    _.debounce((...args) => {
      setDimension({
        width: args[0],
        height: args[1],
      });
    }, 300).call(null, width, height);
  }, []);

  useSizeCallback(videoRef.current, onCanvasResize);
  useMount(() => {
    if (videoRef.current !== null) {
      const { width, height } = videoRef.current.getBoundingClientRect();
      setDimension({ width, height });
    }
  });
  useEffect(() => {
    const { width, height } = dimension;
    try {
      if (videoRef.current !== null) {
        videoRef.current.width = width;
        videoRef.current.height = height;
      }
    } catch (e) {
      mediaStream?.updateVideoCanvasDimension(videoRef.current as HTMLCanvasElement, width, height);
    }
  }, [mediaStream, dimension, videoRef]);
  return dimension;
}

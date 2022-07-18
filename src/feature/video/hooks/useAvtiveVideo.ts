import { useCallback, useEffect, useState } from "react";

import { event_audio_active_speaker, event_video_active_change } from "@zoom/videosdk";

import { ZoomClient } from "../../../index-types.d";

export function useActiveVideo(zmClient: ZoomClient) {
  const [activeVideo, setActiveVideo] = useState<number>(0);
  const [activeSpeaker, setActiveSpeaker] = useState<number>(0);

  const onVideoActiveChange = useCallback((payload: Parameters<typeof event_video_active_change>[0]) => {
    const { state, userId } = payload;
    if (state === "Active") {
      setActiveVideo(userId);
    } else {
      setActiveVideo(0);
    }
  }, []);

  const onActiveSpeakerChange = useCallback((payload: Parameters<typeof event_audio_active_speaker>[0]) => {
    const activeSpeaker = payload[0];
    if (activeSpeaker !== undefined) {
      setActiveSpeaker(activeSpeaker.userId);
    }
  }, []);

  useEffect(() => {
    zmClient.on("video-active-change", onVideoActiveChange);
    zmClient.on("active-speaker", onActiveSpeakerChange);
    return () => {
      zmClient.off("video-active-change", onVideoActiveChange);
      zmClient.off("active-speaker", onActiveSpeakerChange);
    };
  }, [zmClient, onVideoActiveChange, onActiveSpeakerChange]);
  return activeVideo || activeSpeaker;
}

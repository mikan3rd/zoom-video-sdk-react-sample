import { MutableRefObject, useCallback, useEffect, useState } from "react";

import { useMount, usePrevious, useUnmount } from "../../../hooks";
import { MediaStream, ZoomClient } from "../../../index-types.d";
export function useShare(
  zmClient: ZoomClient,
  mediaStream: MediaStream | null,
  shareRef: MutableRefObject<HTMLCanvasElement | HTMLVideoElement | null>,
) {
  const [isRecieveSharing, setIsReceiveSharing] = useState(false);
  const [isStartedShare, setIsStartedShare] = useState(false);
  const [activeSharingId, setActiveSharingId] = useState(0);
  const [sharedContentDimension, setSharedContentDimension] = useState({
    width: 0,
    height: 0,
  });
  const [currentUserId, setCurrentUserId] = useState(0);
  const onActiveShareChange = useCallback(
    ({ state, userId }) => {
      if (!isStartedShare) {
        setActiveSharingId(userId);
        setIsReceiveSharing(state === "Active");
      }
    },
    [isStartedShare],
  );
  const onSharedContentDimensionChange = useCallback(({ width, height }) => {
    setSharedContentDimension({ width, height });
  }, []);
  const onCurrentUserUpdate = useCallback(
    (payload) => {
      if (Array.isArray(payload) && payload.length > 0) {
        payload.forEach((item) => {
          if (item.userId === currentUserId && item.sharerOn !== undefined) {
            setIsStartedShare(item.sharerOn);
            if (item.sharerOn) {
              setIsReceiveSharing(false);
            }
          }
        });
      }
    },
    [currentUserId],
  );
  useEffect(() => {
    zmClient.on("active-share-change", onActiveShareChange);
    zmClient.on("share-content-dimension-change", onSharedContentDimensionChange);
    zmClient.on("user-updated", onCurrentUserUpdate);
    return () => {
      zmClient.off("active-share-change", onActiveShareChange);
      zmClient.off("share-content-dimension-change", onSharedContentDimensionChange);
      zmClient.off("user-updated", onCurrentUserUpdate);
    };
  }, [zmClient, onActiveShareChange, onSharedContentDimensionChange, onCurrentUserUpdate]);
  const previousIsRecieveSharing = usePrevious(isRecieveSharing);
  useEffect(() => {
    if (shareRef.current !== null && previousIsRecieveSharing !== isRecieveSharing) {
      if (isRecieveSharing) {
        mediaStream?.startShareView(shareRef.current as HTMLCanvasElement, activeSharingId);
      } else if (previousIsRecieveSharing === true) {
        mediaStream?.stopShareView();
      }
    }
  }, [mediaStream, shareRef, previousIsRecieveSharing, isRecieveSharing, activeSharingId]);
  useEffect(() => {
    if (mediaStream !== null) {
      const activeSharedUserId = mediaStream.getActiveShareUserId();
      if (activeSharedUserId) {
        setIsReceiveSharing(true);
        setActiveSharingId(activeSharedUserId);
      }
    }
  }, [mediaStream]);
  useMount(() => {
    const currentUser = zmClient.getCurrentUserInfo();
    setCurrentUserId(currentUser.userId);
  });
  useUnmount(() => {
    if (isRecieveSharing) {
      mediaStream?.stopShareView();
    }
  });
  return { isRecieveSharing, isStartedShare, sharedContentDimension };
}

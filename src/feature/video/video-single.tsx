import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { VideoQuality } from "@zoom/videosdk";
import classnames from "classnames";
import _ from "lodash";
import { RouteComponentProps } from "react-router-dom";

import ZoomMediaContext from "../../context/media-context";
import ZoomContext from "../../context/zoom-context";
import { useMount, useSizeCallback } from "../../hooks";
import { Participant } from "../../index-types.d";
import "./video.scss";
import { isAndroidBrowser, isSupportOffscreenCanvas, isSupportWebCodecs } from "../../utils/platform";
import { isShallowEqual } from "../../utils/util";

import Avatar from "./components/avatar";
import VideoFooter from "./components/video-footer";
import { useCanvasDimension } from "./hooks/useCanvasDimension";
import { useParticipantsChange } from "./hooks/useParticipantsChange";
import { useShare } from "./hooks/useShare";
import { SELF_VIDEO_ID } from "./video-constants";

const isUseVideoElementToDrawSelfVideo = isAndroidBrowser() || isSupportOffscreenCanvas();

const VideoContainer: React.FunctionComponent<RouteComponentProps> = (props) => {
  const zmClient = useContext(ZoomContext);
  const {
    mediaStream,
    video: { decode: isVideoDecodeReady },
  } = useContext(ZoomMediaContext);
  const videoRef = useRef<HTMLCanvasElement | null>(null);
  const shareRef = useRef<HTMLCanvasElement | null>(null);
  const selfShareRef = useRef<HTMLCanvasElement & HTMLVideoElement>(null);
  const shareContainerRef = useRef<HTMLDivElement | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeVideo, setActiveVideo] = useState<number>(0);
  const previousActiveUser = useRef<Participant>();
  const canvasDimension = useCanvasDimension(mediaStream, videoRef);
  const { isRecieveSharing, isStartedShare, sharedContentDimension } = useShare(zmClient, mediaStream, shareRef);
  const isSharing = isRecieveSharing || isStartedShare;
  const [containerDimension, setContainerDimension] = useState({
    width: 0,
    height: 0,
  });
  const [shareViewDimension, setShareViewDimension] = useState({
    width: 0,
    height: 0,
  });

  useParticipantsChange(zmClient, (payload) => {
    setParticipants(payload);
  });
  const onActiveVideoChange = useCallback((payload) => {
    const { userId } = payload;
    setActiveVideo(userId);
  }, []);
  useEffect(() => {
    zmClient.on("video-active-change", onActiveVideoChange);
    return () => {
      zmClient.off("video-active-change", onActiveVideoChange);
    };
  }, [zmClient, onActiveVideoChange]);

  const activeUser = useMemo(
    () => participants.find((user) => user.userId === activeVideo),
    [participants, activeVideo],
  );
  const isCurrentUserStartedVideo = zmClient.getCurrentUserInfo().bVideoOn;
  useEffect(() => {
    if (mediaStream !== null && videoRef.current !== null && isVideoDecodeReady) {
      if (activeUser?.bVideoOn !== previousActiveUser.current?.bVideoOn) {
        if (activeUser?.bVideoOn) {
          mediaStream.renderVideo(
            videoRef.current,
            activeUser.userId,
            canvasDimension.width,
            canvasDimension.height,
            0,
            0,
            VideoQuality.Video_360P as any,
          );
        } else {
          if (previousActiveUser.current?.bVideoOn) {
            mediaStream.stopRenderVideo(videoRef.current, previousActiveUser.current.userId);
          }
        }
      }
      if (
        activeUser?.bVideoOn &&
        previousActiveUser.current?.bVideoOn &&
        activeUser.userId !== previousActiveUser.current.userId
      ) {
        mediaStream.stopRenderVideo(videoRef.current, previousActiveUser.current.userId);
        mediaStream.renderVideo(
          videoRef.current,
          activeUser.userId,
          canvasDimension.width,
          canvasDimension.height,
          0,
          0,
          VideoQuality.Video_360P as any,
        );
      }
      previousActiveUser.current = activeUser;
    }
  }, [mediaStream, activeUser, isVideoDecodeReady, canvasDimension]);
  useMount(() => {
    if (mediaStream !== null) {
      setActiveVideo(mediaStream.getActiveVideoId());
    }
  });
  useEffect(() => {
    if (isSharing && shareContainerRef.current !== null) {
      const { width, height } = sharedContentDimension;
      const { width: containerWidth, height: containerHeight } = containerDimension;
      const ratio = Math.min(containerWidth / width, containerHeight / height, 1);
      setShareViewDimension({
        width: Math.floor(width * ratio),
        height: Math.floor(height * ratio),
      });
    }
  }, [isSharing, sharedContentDimension, containerDimension]);

  const onShareContainerResize = useCallback(({ width, height }) => {
    _.throttle(() => {
      setContainerDimension({ width, height });
    }, 50).call(this);
  }, []);
  useSizeCallback(shareContainerRef.current, onShareContainerResize);
  useEffect(() => {
    if (!isShallowEqual(shareViewDimension, sharedContentDimension)) {
      mediaStream?.updateSharingCanvasDimension(shareViewDimension.width, shareViewDimension.height);
    }
  }, [mediaStream, sharedContentDimension, shareViewDimension]);
  return (
    <div className="viewport">
      <div
        className={classnames("share-container", {
          "in-sharing": isSharing,
        })}
        ref={shareContainerRef}
      >
        <div
          className="share-container-viewport"
          style={{
            width: `${shareViewDimension.width}px`,
            height: `${shareViewDimension.height}px`,
          }}
        >
          <canvas className={classnames("share-canvas", { hidden: isStartedShare })} ref={shareRef} />
          {isSupportWebCodecs() ? (
            <video className={classnames("share-canvas", { hidden: isRecieveSharing })} ref={selfShareRef} />
          ) : (
            <canvas className={classnames("share-canvas", { hidden: isRecieveSharing })} ref={selfShareRef} />
          )}
        </div>
      </div>
      <div
        className={classnames("video-container", {
          "in-sharing": isSharing,
        })}
      >
        <canvas className="video-canvas" id="video-canvas" width="800" height="600" ref={videoRef} />
        {isUseVideoElementToDrawSelfVideo ? (
          <video
            id={SELF_VIDEO_ID}
            className={classnames("self-video", {
              "single-self-video": participants.length === 1,
              "self-video-show": isCurrentUserStartedVideo,
            })}
          />
        ) : (
          <canvas
            id={SELF_VIDEO_ID}
            width="254"
            height="143"
            className={classnames("self-video", {
              "single-self-video": participants.length === 1,
              "self-video-show": isCurrentUserStartedVideo,
            })}
          />
        )}
        {activeUser !== null && <Avatar participant={activeUser} isActive={false} className="single-view-avatar" />}
      </div>
      <VideoFooter className="video-operations" sharing shareRef={selfShareRef} />
    </div>
  );
};

export default VideoContainer;

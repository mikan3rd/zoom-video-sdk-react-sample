import React from "react";

import { CheckOutlined, UpOutlined, VideoCameraAddOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { Button, Dropdown, Menu, Tooltip } from "antd";
import classNames from "classnames";

import { MediaDevice } from "../video-types.d";

import "./camera.scss";

interface CameraButtonProps {
  isStartedVideo: boolean;
  isMirrored?: boolean;
  onCameraClick: () => void;
  onSwitchCamera: (deviceId: string) => void;
  onMirrorVideo?: () => void;
  onVideoStatistic?: () => void;
  className?: string;
  cameraList?: MediaDevice[];
  activeCamera?: string;
}
const CameraButton = (props: CameraButtonProps) => {
  const {
    isStartedVideo,
    className,
    cameraList,
    activeCamera,
    isMirrored,
    onCameraClick,
    onSwitchCamera,
    onMirrorVideo,
    onVideoStatistic,
  } = props;
  const onMenuItemClick = (payload: { key: any }) => {
    if (payload.key === "mirror") {
      onMirrorVideo?.();
    } else if (payload.key === "statistic") {
      onVideoStatistic?.();
    } else {
      onSwitchCamera(payload.key);
    }
  };
  const menu = cameraList !== undefined && cameraList.length > 0 && (
    <Menu onClick={onMenuItemClick} theme="dark" className="camera-menu">
      <Menu.ItemGroup title="Select a Camera">
        {cameraList.map((item) => (
          <Menu.Item key={item.deviceId} icon={item.deviceId === activeCamera && <CheckOutlined />}>
            {item.label}
          </Menu.Item>
        ))}
      </Menu.ItemGroup>
      <Menu.Divider />
      <Menu.Item key="mirror" icon={isMirrored === true && <CheckOutlined />}>
        Mirror My Video
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="statistic">Video Statistic</Menu.Item>
    </Menu>
  );
  return (
    <div className={classNames("camera-footer", className)}>
      {isStartedVideo && menu !== false ? (
        <Dropdown.Button
          className={"camera-dropdown-button"}
          size="large"
          overlay={menu}
          onClick={onCameraClick}
          trigger={["click"]}
          type="ghost"
          icon={<UpOutlined />}
          placement="topRight"
        >
          <VideoCameraOutlined />
        </Dropdown.Button>
      ) : (
        <Tooltip title={`${isStartedVideo ? "stop camera" : "start camera"}`}>
          <Button
            className={classNames("camere-button", className)}
            icon={isStartedVideo ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
            ghost={true}
            shape="circle"
            size="large"
            onClick={onCameraClick}
          />
        </Tooltip>
      )}
    </div>
  );
};
export default CameraButton;

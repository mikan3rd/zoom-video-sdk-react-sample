import React from "react";

import ZoomVideo from "@zoom/videosdk";
import ReactDOM from "react-dom";

import "./index.css";
import App from "./App";
import { devConfig } from "./config/dev";
import ZoomContext from "./context/zoom-context";
import reportWebVitals from "./reportWebVitals";
import { generateVideoToken } from "./utils/util";

type MeegingArgsType = {
  topic: string;
  signature: string;
  name: string;
  password?: string;
  enforceGalleryView?: string;
};

const params: Partial<MeegingArgsType> = Object.fromEntries(new URLSearchParams(location.search));

const config = {
  ...devConfig,
  ...params,
};

if (typeof config.enforceGalleryView === "string") {
  config.enforceGalleryView = config.enforceGalleryView === "true";
}

if (config.signature === undefined && config.sdkKey !== undefined && config.sdkSecret !== undefined) {
  config.signature = generateVideoToken(config.sdkKey, config.sdkSecret, config.topic, config.password, "", "");
}

console.info(config);

if (config.signature === undefined) {
  throw new Error("signature is required");
}

if (typeof config.enforceGalleryView === "string") {
  throw new Error("enforceGalleryView must be boolean");
}

const zmClient = ZoomVideo.createClient();

ReactDOM.render(
  <React.StrictMode>
    <ZoomContext.Provider value={zmClient}>
      <App
        topic={config.topic}
        signature={config.signature}
        name={config.name}
        password={config.password}
        enforceGalleryView={config.enforceGalleryView}
      />
    </ZoomContext.Provider>
  </React.StrictMode>,
  document.getElementById("root"),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

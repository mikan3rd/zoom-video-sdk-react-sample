import React from "react";

import { ChatClient } from "../index-types.d";
export default React.createContext<ChatClient | null>(null);

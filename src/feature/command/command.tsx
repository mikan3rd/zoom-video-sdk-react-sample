import React, { useCallback, useContext, useEffect, useRef, useState } from "react";

import { CommandChannelMsg } from "@zoom/videosdk";
import { Input } from "antd";
import { produce } from "immer";

import CommandContext from "../../context/cmd-context";
import ZoomContext from "../../context/zoom-context";
import { useMount } from "../../hooks";

import { CommandReceiver, CommandRecord } from "./cmd-types.d";
import ChatMessageItem from "./component/cmd-message-item";
import CommandReceiverContainer from "./component/cmd-receiver";
import { useParticipantsChange } from "./hooks/useParticipantsChange";

import "./command.scss";

const { TextArea } = Input;

const oneToAllUser = {
  audio: "",
  avatar: "",
  bVideoOn: false,
  displayName: "To All",
  isHost: false,
  isManager: false,
  muted: false,
  sharerOn: undefined,
  sharerPause: undefined,
  userId: 0,
};

const CommandContainer = () => {
  const zmClient = useContext(ZoomContext);
  const cmdClient = useContext(CommandContext);
  const [commandRecords, setCommandRecords] = useState<CommandRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [commandReceivers, setCommandReceivers] = useState<CommandReceiver[]>([]);

  const [command, setCommandUser] = useState<CommandReceiver | null>(null);
  const [commandDraft, setCommandDraft] = useState<string>("");
  const chatWrapRef = useRef<HTMLDivElement | null>(null);
  const onCommandMessage = useCallback(
    (payload: CommandChannelMsg) => {
      setCommandRecords(
        produce((records: CommandRecord[]) => {
          console.info(payload);
          const length = records.length;
          const newPayload = {
            message: payload.text,
            sender: {
              name: payload.senderName ?? "",
              userId: payload.senderId,
            },
            receiver:
              payload.receiverId !== undefined
                ? {
                    name: "",
                    userId: payload.receiverId,
                  }
                : { name: "", userId: 0 },
            timestamp: payload.timestamp,
          };
          if (length > 0) {
            const lastRecord = records[length - 1];
            if (
              payload.senderId === lastRecord?.sender.userId &&
              payload.receiverId === lastRecord.receiver.userId &&
              payload.timestamp - lastRecord.timestamp < 1000 * 60 * 5
            ) {
              if (Array.isArray(lastRecord.message)) {
                lastRecord.message.push(payload.text as string);
              } else {
                lastRecord.message = [lastRecord.message, payload.text as string];
              }
            } else {
              records.push(newPayload);
            }
          } else {
            records.push(newPayload);
          }
        }),
      );
      if (chatWrapRef.current !== null) {
        chatWrapRef.current.scrollTo(0, chatWrapRef.current.scrollHeight);
      }
    },
    [chatWrapRef],
  );

  const onChatInput = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommandDraft(event.target.value);
  }, []);
  useEffect(() => {
    zmClient.on("command-channel-message", onCommandMessage);
    return () => {
      zmClient.off("command-channel-message", onCommandMessage);
    };
  }, [zmClient, onCommandMessage]);

  useParticipantsChange(zmClient, () => {
    setCommandReceivers([oneToAllUser, ...zmClient.getAllUser().filter((item) => item.userId !== currentUserId)]);
  });

  useEffect(() => {
    setCommandReceivers([oneToAllUser, ...zmClient.getAllUser().filter((item) => item.userId !== currentUserId)]);
  }, [currentUserId, zmClient]);

  useEffect(() => {
    if (command !== null) {
      const index = commandReceivers.findIndex((user) => user.userId === command.userId);
      if (index === -1 && commandReceivers[0] !== undefined) {
        setCommandUser(commandReceivers[0]);
      }
    } else {
      if (commandReceivers.length > 0 && commandReceivers[0] !== undefined) {
        setCommandUser(commandReceivers[0]);
      }
    }
  }, [commandReceivers, command]);
  const setCommandUserId = useCallback(
    (userId) => {
      const user = commandReceivers.find((u) => u.userId === userId);
      if (user !== undefined) {
        setCommandUser(user);
      }
    },
    [commandReceivers],
  );
  const sendMessage = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      event.preventDefault();
      if (command !== null) {
        cmdClient?.send(commandDraft, command.userId);
        setCommandDraft("");
      }
    },
    [cmdClient, commandDraft, command],
  );
  useMount(() => {
    setCurrentUserId(zmClient.getSessionInfo().userId);
  });
  return (
    <div className="chat-container">
      <div className="chat-wrap">
        <h2>Command Channel Chat</h2>
        <div className="chat-message-wrap" ref={chatWrapRef}>
          {commandRecords.map((record) => (
            <ChatMessageItem
              record={record}
              currentUserId={currentUserId}
              setCommandUser={setCommandUserId}
              key={record.timestamp}
            />
          ))}
        </div>
        {
          <>
            <CommandReceiverContainer
              chatUsers={commandReceivers}
              selectedChatUser={command}
              setCommandUser={setCommandUserId}
              currentUserId={currentUserId}
            />
            <div className="chat-message-box">
              <TextArea
                onPressEnter={sendMessage}
                onChange={onChatInput}
                value={commandDraft}
                placeholder="Type message here ..."
              />
            </div>
          </>
        }
      </div>
    </div>
  );
};

export default CommandContainer;

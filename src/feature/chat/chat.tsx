import React, { useCallback, useContext, useEffect, useRef, useState } from "react";

import { ChatPrivilege, event_chat_privilege_change } from "@zoom/videosdk";
import { Input } from "antd";
import { produce } from "immer";

import ChatContext from "../../context/chat-context";
import ZoomContext from "../../context/zoom-context";
import { useMount } from "../../hooks";

import { ChatReceiver, ChatRecord } from "./chat-types.d";
import ChatMessageItem from "./component/chat-message-item";
import ChatReceiverContainer from "./component/chat-receiver";
import { useParticipantsChange } from "./hooks/useParticipantsChange";

import "./chat.scss";

const { TextArea } = Input;
const ChatContainer = () => {
  const zmClient = useContext(ZoomContext);
  const chatClient = useContext(ChatContext);
  const [chatRecords, setChatRecords] = useState<ChatRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [chatReceivers, setChatReceivers] = useState<ChatReceiver[]>([]);
  const [chatPrivilege, setChatPrivilege] = useState<ChatPrivilege>(ChatPrivilege.All);
  const [chatUser, setChatUser] = useState<ChatReceiver | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isManager] = useState<boolean>(false);
  const [chatDraft, setChatDraft] = useState<string>("");
  const chatWrapRef = useRef<HTMLDivElement | null>(null);
  const onChatMessage = useCallback(
    (payload: ChatRecord) => {
      setChatRecords(
        produce((records: ChatRecord[]) => {
          const length = records.length;
          if (length > 0) {
            const lastRecord = records[length - 1];
            if (
              payload.sender.userId === lastRecord?.sender.userId &&
              payload.receiver.userId === lastRecord.receiver.userId &&
              payload.timestamp - lastRecord.timestamp < 1000 * 60 * 5
            ) {
              if (Array.isArray(lastRecord.message)) {
                lastRecord.message.push(payload.message as string);
              } else {
                lastRecord.message = [lastRecord.message, payload.message as string];
              }
            } else {
              records.push(payload);
            }
          } else {
            records.push(payload);
          }
        }),
      );
      if (chatWrapRef.current !== null) {
        chatWrapRef.current.scrollTo(0, chatWrapRef.current.scrollHeight);
      }
    },
    [chatWrapRef],
  );
  const onChatPrivilegeChange = useCallback(
    (payload: Parameters<typeof event_chat_privilege_change>[0]) => {
      setChatPrivilege(payload.chatPrivilege);
      if (chatClient !== null) {
        setChatReceivers(chatClient.getReceivers());
      }
    },
    [chatClient],
  );
  const onChatInput = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatDraft(event.target.value);
  }, []);
  useEffect(() => {
    zmClient.on("chat-on-message", onChatMessage);
    return () => {
      zmClient.off("chat-on-message", onChatMessage);
    };
  }, [zmClient, onChatMessage]);
  useEffect(() => {
    zmClient.on("chat-privilege-change", onChatPrivilegeChange);
    return () => {
      zmClient.off("chat-privilege-change", onChatPrivilegeChange);
    };
  }, [zmClient, onChatPrivilegeChange]);
  useParticipantsChange(zmClient, () => {
    if (chatClient !== null) {
      setChatReceivers(chatClient.getReceivers());
    }
    setIsHost(zmClient.isHost());
    // setIsManager(zmClient.isManager());
  });
  useEffect(() => {
    if (chatUser !== null) {
      const index = chatReceivers.findIndex((user) => user.userId === chatUser.userId);
      if (index === -1 && chatReceivers[0] !== undefined) {
        setChatUser(chatReceivers[0]);
      }
    } else {
      if (chatReceivers.length > 0 && chatReceivers[0] !== undefined) {
        setChatUser(chatReceivers[0]);
      }
    }
  }, [chatReceivers, chatUser]);
  const setChatUserId = useCallback(
    (userId: number) => {
      const user = chatReceivers.find((u) => u.userId === userId);
      if (user !== undefined) {
        setChatUser(user);
      }
    },
    [chatReceivers],
  );
  const sendMessage = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      event.preventDefault();
      if (chatUser !== null) {
        chatClient?.send(chatDraft, chatUser.userId);
        setChatDraft("");
      }
    },
    [chatClient, chatDraft, chatUser],
  );
  useMount(() => {
    setCurrentUserId(zmClient.getSessionInfo().userId);
    if (chatClient !== null) {
      setChatPrivilege(chatClient.getPrivilege());
    }
  });
  return (
    <div className="chat-container">
      <div className="chat-wrap">
        <h2>Chat</h2>
        <div className="chat-message-wrap" ref={chatWrapRef}>
          {chatRecords.map((record) => (
            <ChatMessageItem
              record={record}
              currentUserId={currentUserId}
              setChatUser={setChatUserId}
              key={record.timestamp}
            />
          ))}
        </div>
        {ChatPrivilege.NoOne !== chatPrivilege || isHost || isManager ? (
          <>
            <ChatReceiverContainer
              chatUsers={chatReceivers}
              selectedChatUser={chatUser}
              isHostOrManager={isHost || isManager}
              chatPrivilege={chatPrivilege}
              setChatUser={setChatUserId}
            />
            <div className="chat-message-box">
              <TextArea
                onPressEnter={sendMessage}
                onChange={onChatInput}
                value={chatDraft}
                placeholder="Type message here ..."
              />
            </div>
          </>
        ) : (
          <div className="chat-disabled">Chat disabled</div>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;

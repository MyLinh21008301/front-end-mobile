import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Manager, Socket } from "socket.io-client";

// Hook useSocket để quản lý kết nối Socket.IO
const useSocket = (url, token) => {
  const [socket, setSocket] = useState(null);
  const [manager, setManager] = useState(null);
  const [state, setState] = useState({
    isConnected: false,
    conversations: [],
    messages: [],
    unreadCounts: {},
    currentConversation: {},
  });

  // Ref để theo dõi component có unmount hay không
  const isMounted = useRef(true);

  // Khởi tạo socket connection
  useEffect(() => {
    // Kiểm tra giá trị url và token
    if (!url || !token) {
      console.error("Invalid url or token:", { url, token });
      return;
    }

    const newManager = new Manager(url, {
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      autoConnect: true,
      query: { token },
      transports: ["websocket"],
      auth: { token },
    });

    const socketInstance = newManager.socket("/chat");

    const onConnect = () => {
      setState((prev) => ({ ...prev, isConnected: true }));
      console.log("Socket connected");
    };

    const onDisconnect = () => {
      setState((prev) => ({ ...prev, isConnected: false }));
      console.log("Socket disconnected");
    };

    const onError = (error) => {
      console.error("Socket error:", error);
    };

    const onInitialConversations = (conversations) => {
      setState((prev) => ({ ...prev, conversations }));
    };

    const onInitialMessages = (conversation) => {
      setState((prev) => ({
        ...prev,
        currentConversation: conversation,
        messages: conversation.messageDetails,
      }));
    };

    const onNewMessage = (message) => {
      console.log("New message:", message);
      setState((prev) => {
        if (prev.messages.some((m) => m.id === message.id)) return prev;
    
        // Update conversations with the new lastMessage
        const updatedConversations = prev.conversations.map((conv) => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message,
              updatedAt: message.createdAt, // Optional: update timestamp if server doesn't
            };
          }
          return conv;
        });
    
        if (prev.currentConversation?.id === message.conversationId) {
          return {
            ...prev,
            conversations: updatedConversations,
            currentConversation: {
              ...prev.currentConversation,
              messageDetails: [...prev.currentConversation.messageDetails, message],
              lastMessage: message, // Ensure currentConversation stays in sync
            },
            messages: [...prev.messages, message],
          };
        } else {
          return {
            ...prev,
            conversations: updatedConversations,
            messages: [...prev.messages, message],
            unreadCounts: {
              ...prev.unreadCounts,
              [message.conversationId]: (prev.unreadCounts[message.conversationId] || 0) + 1,
            },
          };
        }
      });
    };

    const onMessageRecalled = (data) => {
      console.log("Message recalled:", data);
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === data.messageId ? { ...msg, isRecalled: true } : msg
        ),
        currentConversation:
          prev.currentConversation?.id === data.conversationId
            ? {
                ...prev.currentConversation,
                messageDetails: prev.currentConversation.messageDetails.map(
                  (msg) =>
                    msg.id === data.messageId
                      ? { ...msg, isRecalled: true }
                      : msg
                ),
              }
            : prev.currentConversation,
      }));
    };

    const onReactionAdded = (data) => {
      console.log("Reaction added:", data);
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) => {
          if (msg.id !== data.messageId) return msg;

          const existingReaction = msg.reactions?.find(
            (r) => r.emoji === data.emoji
          );
          let newReactions;
          if (existingReaction) {
            if (existingReaction.users.includes(data.userId)) {
              return msg;
            }
            newReactions = msg.reactions.map((r) =>
              r.emoji === data.emoji
                ? { ...r, users: [...r.users, data.userId] }
                : r
            );
          } else {
            newReactions = [
              ...(msg.reactions || []),
              { emoji: data.emoji, users: [data.userId] },
            ];
          }

          return {
            ...msg,
            reactions: newReactions,
          };
        }),
        currentConversation:
          prev.currentConversation?.id === data.conversationId
            ? {
                ...prev.currentConversation,
                messageDetails: prev.currentConversation.messageDetails.map(
                  (msg) => {
                    if (msg.id !== data.messageId) return msg;

                    const existingReaction = msg.reactions?.find(
                      (r) => r.emoji === data.emoji
                    );
                    let newReactions;
                    if (existingReaction) {
                      newReactions = msg.reactions.map((r) =>
                        r.emoji === data.emoji
                          ? { ...r, users: [...r.users, data.userId] }
                          : r
                      );
                    } else {
                      newReactions = [
                        ...(msg.reactions || []),
                        { emoji: data.emoji, users: [data.userId] },
                      ];
                    }

                    return {
                      ...msg,
                      reactions: newReactions,
                    };
                  }
                ),
              }
            : prev.currentConversation,
      }));
    };

    const onUnreadCounts = (unreadCounts) => {
      setState((prev) => ({
        ...prev,
        unreadCounts,
      }));
    };

    const onReadConversation = (data) => {
      const { conversationId } = data;
      console.log("Received read_conversation event:", data);

      // Cập nhật unreadCounts: đặt conversationId về 0
      setState((prev) => ({
        ...prev,
        unreadCounts: {
          ...prev.unreadCounts,
          [conversationId]: 0,
        },
      }));
    };

    const onNewConversation = (conversation) => {
      setState((prev) => ({
        ...prev,
        conversations: [...prev.conversations, conversation],
      }));
    };

    const onDeleteConversation = (conversationId) => {
      console.log("Received delete_conversation event:", conversationId);
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.filter(
          (conv) => conv.id !== conversationId
        ),
      }));
    };

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    socketInstance.on("error", onError);
    socketInstance.on("initial_conversations", onInitialConversations);
    socketInstance.on("initial_messages", onInitialMessages);
    socketInstance.on("new_message", onNewMessage);
    socketInstance.on("message_recalled", onMessageRecalled);
    socketInstance.on("reaction_added", onReactionAdded);
    socketInstance.on("unread_counts", onUnreadCounts);
    socketInstance.on("read_conversation", onReadConversation);
    socketInstance.on("new_conversation", onNewConversation);
    socketInstance.on("delete_conversation", onDeleteConversation);

    setManager(newManager);
    setSocket(socketInstance);

    // Cleanup chỉ khi component unmount
    return () => {
      isMounted.current = false;
    };
  }, [url, token]);

  // Cleanup socket khi component unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("error");
        socket.off("initial_conversations");
        socket.off("initial_messages");
        socket.off("new_message");
        socket.off("message_recalled");
        socket.off("reaction_added");
        socket.off("unread_counts");
        socket.off("read_conversation");
        socket.off("new_conversation");
        socket.off("delete_conversation");
        socket.disconnect();
      }
      if (manager) {
        manager.removeAllListeners();
      }
    };
  }, [socket, manager]);

  const joinConversation = useCallback(
    async (conversationId) => {
      if (!socket) return false;

      return new Promise((resolve) => {
        socket.emit("join_conversation", conversationId, (ack) => {
          resolve(ack === "JOIN_SUCCESS");
        });
      });
    },
    [socket]
  );

  const sendTextMessage = useCallback(
    async (content) => {
      if (!socket || !state.currentConversation) return false;

      const messageRequest = {
        conversationId: state.currentConversation.id,
        content,
        type: "TEXT",
        senderId: "",
      };

      return new Promise((resolve) => {
        socket.emit("send_text_message", messageRequest, (ack) => {
          resolve(ack === "SENT");
        });
      });
    },
    [socket, state.currentConversation]
  );

  const recallMessage = useCallback(
    async (messageId) => {
      if (!socket) return false;

      return new Promise((resolve) => {
        socket.emit("recall_message", messageId, (ack) => {
          resolve(ack === "RECALLED");
        });
      });
    },
    [socket]
  );

  const reactToMessage = useCallback(
    async (messageId, emoji) => {
      if (!socket) return false;

      return new Promise((resolve) => {
        socket.emit(
          "react_to_message",
          { messageId, emoji },
          (ack) => {
            resolve(ack === "REACTED");
          }
        );
      });
    },
    [socket]
  );

  const getConversationsWithUnreadCounts = useCallback(() => {
    return Object.entries(state.unreadCounts).map(
      ([conversationId, unreadCount]) => ({
        conversationId,
        unreadCount,
      })
    );
  }, [state.unreadCounts]);

  const actions = useMemo(
    () => ({
      joinConversation,
      sendTextMessage,
      recallMessage,
      reactToMessage,
      getConversationsWithUnreadCounts,
    }),
    [
      joinConversation,
      sendTextMessage,
      recallMessage,
      reactToMessage,
      getConversationsWithUnreadCounts,
    ]
  );

  return { ...state, socket };
};

export default useSocket;
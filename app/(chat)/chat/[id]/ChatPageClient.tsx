"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import socket from "@/src/lib/socket";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatInput from "@/components/chat/ChatInput";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string | Date;
  isMine?: boolean;
}

export default function ChatPageClient({ otherId }: { otherId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const myId = session?.user?.id;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [otherUser, setOtherUser] = useState<{ name: string; email: string; image?: string } | null>(null);

  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // ---------------------------
  // FETCH OTHER USER DATA
  // ---------------------------
  useEffect(() => {
    if (!otherId) return;

    async function fetchOtherUser() {
      try {
        const res = await fetch(`/api/users/${otherId}`);
        if (res.ok) {
          const data = await res.json();
          setOtherUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch other user:", err);
      }
    }

    fetchOtherUser();
  }, [otherId]);

  // ---------------------------
  // GET OR CREATE CONVERSATION
  // ---------------------------
  async function getConversation(user1: string, user2: string) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ user1, user2 }),
    });

    const data = await res.json();
    return data.conversationId;
  }

  // ---------------------------
  // LOAD MESSAGES PAGINATED
  // ---------------------------
async function loadMessages(convId: string, skipCount = 0) {
  const res = await fetch(
    `/api/messages/${convId}?limit=20&skip=${skipCount}`
  );
  const data = await res.json();

  if (data.messages.length < 20) setHasMore(false);

  // API returns newest first, reverse to get oldest first (chronological order)
  // So latest messages appear at bottom like WhatsApp
  const formatted = data.messages.reverse().map((msg: any) => ({
    ...msg,
    isMine: String(msg.senderId) === String(myId),
  }));

  // Ensure messages are sorted by createdAt (oldest to newest)
  formatted.sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB;
  });

  return formatted;
}

  async function loadMore() {
  if (!conversationId || !hasMore) return;

  const oldMessages = await loadMessages(conversationId, skip);
  setMessages((prev) => {
    // Combine old and new messages, then sort chronologically
    const combined = [...oldMessages, ...prev];
    combined.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
    return combined;
  });
  setSkip(skip + 20);
}

//   useEffect(() => {
//   if (!myId || !otherId) return;

//   let initialized = false;

//   async function init() {
//     if (initialized) return;   // Prevent duplicate runs
//     initialized = true;

//     const convId = await getConversation(myId, otherId);
//     setConversationId(convId);

//     // Join room once
//     socket.emit("join_room", convId);

//     // Load messages once
//     const initialMessages = await loadMessages(convId, 0);
//     setMessages(initialMessages);
//     setSkip(20);
//   }

//   init();

//   // ----- REAL-TIME LISTENERS -----
//   const handleReceive = (msg: any) => {
//     setMessages((prev) => [
//       ...prev,
//       { ...msg, isMine: msg.senderId === myId },
//     ]);
//   };

//   const handleTyping = ({ from }: any) => {
//     if (String(from) === String(otherId)) {
//         console.log("Typing... listeing")
//       setTyping(true);
//     }
//   };

//   const handleStopTyping = ({ from }: any) => {
//     if (String(from) === String(otherId)) {
//       setTyping(false);
//     }
//   };

//   socket.on("receive_message", handleReceive);
//   socket.on("typing", handleTyping);
//   socket.on("stop_typing", handleStopTyping);

//   return () => {
//     socket.off("receive_message", handleReceive);
//     socket.off("typing", handleTyping);
//     socket.off("stop_typing", handleStopTyping);
//     socket.emit("leave_room", conversationId);
//   };
// }, [myId, otherId]);


useEffect(() => {
  if (!myId || !otherId) return;

  let isMounted = true;
  let currentConvId: string | null = null;

  async function init() {
    if (!myId || !otherId || !isMounted) return;
    const convId = await getConversation(myId, otherId);
    
    if (!isMounted) return;
    
    currentConvId = convId;
    setConversationId(convId);

    // Ensure socket is connected before joining room
    if (socket.connected) {
      console.log("Socket connected, joining room:", convId);
      socket.emit("join_room", convId);
    } else {
      console.log("Socket not connected, waiting for connection...");
      socket.once("connect", () => {
        console.log("Socket connected, joining room:", convId);
        socket.emit("join_room", convId);
      });
      // Try to connect if not already connected
      socket.connect();
    }

    const initialMessages = await loadMessages(convId, 0);
    
    if (!isMounted) return;
    
    // Ensure messages are sorted chronologically (oldest to newest)
    const sortedMessages = [...initialMessages].sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
    setMessages(sortedMessages);
    setSkip(20);
  }

  init();

  // ---------------------------
  // REALTIME LISTENERS
  // ---------------------------

  const receiveHandler = (msg: any) => {
    if (!isMounted) return;
    
    console.log("Received message via socket:", msg);
    
    // Only process messages for the current conversation
    if (currentConvId && String(msg.conversationId) !== String(currentConvId)) {
      console.log("Message not for current conversation, ignoring");
      return;
    }

    setMessages((prev) => {
      // Check if message already exists to avoid duplicates
      const exists = prev.some((m: any) => {
        // Check by _id if both have it
        if (msg._id && m._id && String(m._id) === String(msg._id)) {
          return true;
        }
        // Check by timestamp, sender, and content/attachments for messages without _id
        const sameTime = Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 2000; // within 2 seconds
        const sameSender = String(m.senderId) === String(msg.senderId);
        const sameContent = m.content === msg.content;
        // For file messages, check if attachments match
        const sameAttachments = JSON.stringify(m.attachments || []) === JSON.stringify(msg.attachments || []);
        
        return sameTime && sameSender && (sameContent || sameAttachments);
      });
      
      if (exists) {
        console.log("Duplicate message detected, skipping");
        return prev;
      }
      
      console.log("Adding new message to state");
      // Add new message and sort by createdAt to maintain chronological order
      const updated = [...prev, { ...msg, isMine: String(msg.senderId) === String(myId) }];
      updated.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });
      
      return updated;
    });
  };

  const typingHandler = ({ from }: any) => {
    if (!isMounted) return;
    if (String(from) === String(otherId)) setTyping(true);
  };

  const stopTypingHandler = ({ from }: any) => {
    if (!isMounted) return;
    if (String(from) === String(otherId)) setTyping(false);
  };

  // Remove any existing listeners first to prevent duplicates
  socket.off("receive_message", receiveHandler);
  socket.off("typing", typingHandler);
  socket.off("stop_typing", stopTypingHandler);

  // Add new listeners
  socket.on("receive_message", receiveHandler);
  socket.on("typing", typingHandler);
  socket.on("stop_typing", stopTypingHandler);

  return () => {
    isMounted = false;
    socket.off("receive_message", receiveHandler);
    socket.off("typing", typingHandler);
    socket.off("stop_typing", stopTypingHandler);
  };
}, [myId, otherId]);


  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 md:p-5 border-b border-border bg-card shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Back button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2"
            onClick={() => router.push("/chat")}
            aria-label="Back to contacts"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </Button>
          
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-semibold text-sm">
              {otherUser?.name?.charAt(0).toUpperCase() || otherId?.slice(0, 1).toUpperCase() || "?"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-card-foreground truncate text-sm md:text-base">
              Chat with: {otherUser?.name || otherId}
            </h2>
          </div>
        </div>

        {typing && (
          <div className="flex items-center gap-2 text-sm text-primary animate-pulse ml-2">
            <span className="flex gap-1">
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
            <span className="hidden sm:inline text-muted-foreground">typing...</span>
          </div>
        )}
      </div>

      <ChatMessageList messages={messages} loadMore={loadMore} />

      {conversationId && myId && (
        <ChatInput
          conversationId={conversationId}
          senderId={myId}
          otherId={otherId}
        />
      )}
    </div>
  );
}

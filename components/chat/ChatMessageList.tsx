"use client";

import { useEffect, useRef } from "react";
import { FileText, Paperclip } from "lucide-react";

export default function ChatMessageList({
  messages,
  loadMore,
}: {
  messages: any[];
  loadMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const hasScrolledToBottomRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  // Auto-scroll to bottom when messages are first loaded or new messages arrive
  useEffect(() => {
    if (!ref.current) return;

    // If no messages, reset the flag
    if (messages.length === 0) {
      hasScrolledToBottomRef.current = false;
      prevMessagesLengthRef.current = 0;
      return;
    }

    // On initial load (first time messages appear), always scroll to bottom
    if (!hasScrolledToBottomRef.current) {
      // Use multiple timeouts to ensure DOM is fully rendered
      const timer1 = setTimeout(() => {
        if (ref.current) {
          ref.current.scrollTop = ref.current.scrollHeight;
          hasScrolledToBottomRef.current = true;
          prevMessagesLengthRef.current = messages.length;
        }
      }, 100);

      const timer2 = setTimeout(() => {
        if (ref.current) {
          ref.current.scrollTop = ref.current.scrollHeight;
        }
      }, 300);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }

    // For subsequent updates, only scroll if user is near bottom
    if (isLoadingMoreRef.current) return;

    // Check if new messages were added
    const hasNewMessages = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (hasNewMessages) {
      const { scrollTop, scrollHeight, clientHeight } = ref.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom) {
        // Scroll to bottom when new messages arrive and user is near bottom
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (ref.current) {
              ref.current.scrollTop = ref.current.scrollHeight;
            }
          }, 50);
        });
      }
    }
  }, [messages]);

  async function handleScroll() {
    if (!ref.current || isLoadingMoreRef.current) return;

    // User scrolled to TOP → load older messages
    if (ref.current.scrollTop === 0) {
      isLoadingMoreRef.current = true;
      prevScrollHeightRef.current = ref.current.scrollHeight;

      await loadMore();

      // Restore scroll position after loading
      setTimeout(() => {
        if (ref.current) {
          const newScrollHeight = ref.current.scrollHeight;
          ref.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
        }
        isLoadingMoreRef.current = false;
      }, 0);
    }
  }

  // Helper to determine file type
  function getFileType(fileType: string | undefined) {
    if (!fileType) return "file";
    if (fileType.startsWith("image/")) return "image";
    if (fileType.startsWith("video/")) return "video";
    if (fileType.startsWith("audio/")) return "audio";
    if (fileType.includes("pdf")) return "pdf";
    return "file";
  }

  // Render attachment based on type
  function renderAttachment(attachment: any) {
    // Safety check
    if (!attachment || !attachment.url) {
      console.error("Invalid attachment:", attachment);
      return (
        <div className="mt-2 p-2 bg-destructive/10 rounded-lg text-destructive text-sm border border-destructive/20">
          Invalid attachment
        </div>
      );
    }

    console.log("Rendering attachment:", attachment);

    const type = getFileType(attachment.fileType);

    switch (type) {
      case "image":
        return (
          <div className="mt-2">
            <img
              src={attachment.url}
              alt={attachment.fileName}
              className="max-w-full max-h-64 md:max-h-80 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-md"
              onClick={() => window.open(attachment.url, "_blank")}
            />
            <p className="text-xs text-muted-foreground mt-1.5 truncate">{attachment.fileName}</p>
          </div>
        );

      case "video":
        return (
          <div className="mt-2">
            <video
              src={attachment.url}
              controls
              className="max-w-full max-h-64 md:max-h-80 rounded-xl shadow-md"
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
            <p className="text-xs text-muted-foreground mt-1.5 truncate">{attachment.fileName}</p>
          </div>
        );

      case "audio":
        return (
          <div className="mt-2">
            <audio src={attachment.url} controls className="w-full max-w-sm rounded-lg">
              Your browser does not support audio playback.
            </audio>
            <p className="text-xs text-muted-foreground mt-1.5 truncate">{attachment.fileName}</p>
          </div>
        );

      case "pdf":
        return (
          <div className="mt-2 p-3 bg-card rounded-xl border border-border flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">
                {attachment.fileName}
              </p>
              <p className="text-xs text-muted-foreground">PDF Document</p>
            </div>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors font-medium flex-shrink-0"
            >
              Open
            </a>
          </div>
        );

      default:
        return (
          <div className="mt-2 p-3 bg-card rounded-xl border border-border flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">
                {attachment.fileName}
              </p>
              <p className="text-xs text-muted-foreground">
                {attachment.bytes
                  ? `${(attachment.bytes / 1024).toFixed(2)} KB`
                  : "File"}
              </p>
            </div>
            <a
              href={attachment.url}
              download={attachment.fileName}
              className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-lg hover:bg-secondary/80 transition-colors font-medium flex-shrink-0"
            >
              Download
            </a>
          </div>
        );
    }
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin bg-gradient-to-b from-background to-muted/20"
    >
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">No messages yet. Start the conversation!</p>
        </div>
      )}
      {messages.map((msg: any, i: number) => (
        <div
          key={msg._id ? `${msg._id}-${i}` : `msg-${i}-${Date.now()}`}
          className={`flex ${msg.isMine ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
        >
          <div
            className={`p-3 md:p-4 rounded-2xl max-w-[85%] md:max-w-[70%] break-words shadow-sm ${
              msg.isMine
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card text-card-foreground border border-border rounded-bl-md"
            }`}
          >
            {/* Text Content */}
            {msg.content && (
              <p className="whitespace-pre-wrap break-words text-sm md:text-base leading-relaxed">
                {msg.content}
              </p>
            )}

            {/* Attachments */}
            {msg.attachments &&
              Array.isArray(msg.attachments) &&
              msg.attachments.length > 0 &&
              msg.attachments
                .filter((att: any) => att && att.url) // Filter out invalid attachments
                .map((attachment: any, idx: number) => (
                  <div key={idx} className="mt-2 first:mt-0">
                    {renderAttachment(attachment)}
                  </div>
                ))}

            {/* Timestamp */}
            <p
              className={`text-xs mt-2 opacity-70 ${
                msg.isMine ? "text-primary-foreground/80" : "text-muted-foreground"
              }`}
            >
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
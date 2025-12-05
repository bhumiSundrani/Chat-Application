"use client";

import { useState, useEffect, useRef } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import socket from "@/src/lib/socket";

export default function ChatInput({
  conversationId,
  senderId,
  otherId,
  onMessageSent,
}: {
  conversationId: string;
  senderId: string;
  otherId: string;
  onMessageSent?: (message: any) => void;
}) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // ---------------------------------------
  // HANDLE TYPING INDICATOR
  // ---------------------------------------
  useEffect(() => {
    if (!senderId || !otherId) return;

    // Start typing
    if (text.length > 0 && !isTypingRef.current) {
      isTypingRef.current = true;

      socket.emit("typing", {
        from: senderId,
        to: otherId,
        conversationId,
      });
    }

    // Stop typing (debounce)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;

        socket.emit("stop_typing", {
          from: senderId,
          to: otherId,
          conversationId,
        });
      }
    }, 1200);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [text, senderId, otherId, conversationId]);

  const handleBlur = () => {
    if (isTypingRef.current) {
      isTypingRef.current = false;

      socket.emit("stop_typing", {
        from: senderId,
        to: otherId,
        conversationId,
      });
    }
  };

  // ------------------------------------------------
  // CLOUDINARY UPLOAD WITH PROPER ERROR HANDLING
  // ------------------------------------------------
  async function uploadFile(file: File) {
    try {
      setUploading(true);
      setUploadError(null);

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("File size exceeds 10MB limit");
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""
      );

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      if (!cloudName) {
        throw new Error("Cloudinary cloud name not configured");
      }

      // Use /auto/upload for automatic resource type detection
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }

      const data = await res.json();

      if (!data.secure_url) {
        throw new Error("No URL returned from Cloudinary");
      }

      return {
        url: data.secure_url,
        fileName: file.name,
        fileType: file.type,
        publicId: data.public_id,
        resourceType: data.resource_type,
        format: data.format,
        bytes: data.bytes,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setUploadError(errorMessage);
      console.error("Upload error:", err);
      return null;
    } finally {
      setUploading(false);
    }
  }

  // ------------------------------------------------
  // HANDLE FILE SELECT
  // ------------------------------------------------
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploaded = await uploadFile(file);
    
    if (!uploaded) {
      // Error already set by uploadFile
      return;
    }

    // Log the uploaded data for debugging
    console.log("Uploaded file data:", uploaded);

    const message = {
      conversationId,
      senderId,
      content: "",
      attachments: [uploaded],
      createdAt: new Date().toISOString(),
    };

    console.log("Message to send:", message);

    try {
      // Real-time send via socket
      socket.emit("send_message", {
        roomId: conversationId,
        message,
      });

      // Save in DB
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error:", errorData);
        throw new Error("Failed to save message");
      }

      const savedMessage = await response.json();
      console.log("Saved message:", savedMessage);

      // Message will be added via socket receive_message event
      // No need to call onMessageSent to avoid duplicates

      // Clear upload error on success
      setUploadError(null);
    } catch (err) {
      console.error("Failed to send message:", err);
      setUploadError("Failed to send message");
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // ------------------------------------------------
  // SEND TEXT MESSAGE
  // ------------------------------------------------
  async function send() {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const message = {
      conversationId,
      senderId,
      content: trimmedText,
      attachments: [],
      createdAt: new Date().toISOString(),
    };

    // Clear input immediately for better UX
    setText("");

    // Stop typing indicator
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("stop_typing", {
        from: senderId,
        to: otherId,
        conversationId,
      });
    }

    try {
      // Real-time send via socket
      socket.emit("send_message", {
        roomId: conversationId,
        message,
      });

      // Save in DB
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error("Failed to save message");
      }

      const savedMessage = await response.json();
      
      // Message will be added via socket receive_message event
      // No need to call onMessageSent to avoid duplicates
    } catch (err) {
      console.error("Failed to send message:", err);
      // Optionally restore the text on failure
      setText(trimmedText);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card shadow-lg">
      {/* Error Message */}
      {uploadError && (
        <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center justify-between">
          <span>{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="ml-2 text-destructive hover:text-destructive/80 font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* File Picker */}
        <button
          className="p-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach file (max 10MB)"
          aria-label="Attach file"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </button>

        <input
          type="file"
          hidden
          ref={fileInputRef}
          onChange={handleFileSelect}
          disabled={uploading}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            className="w-full border border-input bg-background px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed text-sm md:text-base transition-all"
            placeholder={uploading ? "Uploading file..." : "Type a message..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={uploading}
          />
        </div>

        {/* Send Button */}
        <button
          className="px-5 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md active:scale-95 disabled:active:scale-100"
          disabled={uploading || !text.trim()}
          onClick={send}
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></span>
              <span className="hidden sm:inline">Uploading...</span>
            </span>
          ) : (
            <span>Send</span>
          )}
        </button>
      </div>

      {/* Upload Progress Indicator */}
      {uploading && (
        <div className="mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            <span>Uploading file...</span>
          </div>
        </div>
      )}
    </div>
  );
}
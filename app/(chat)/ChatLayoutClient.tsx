"use client";

import { usePathname } from "next/navigation";
import SideBar from "@/components/chat/Sidebar";

export default function ChatLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Check if we're on a specific chat page (has an ID after /chat/)
  // pathname will be like "/chat/[id]" when in a chat, or "/chat" when on the home
  const isChatPage = pathname?.startsWith("/chat/") && pathname !== "/chat";

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Sidebar - always visible on desktop, hidden on mobile when chat is open */}
      <div className={`${isChatPage ? "hidden" : "flex"} md:flex flex-col w-full md:w-auto h-screen md:h-full`}>
        <SideBar/>
      </div>
      
      {/* Chat area - full width on mobile when chat is open, always visible on desktop */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden w-full h-screen md:h-full">
        {children}
      </div>
    </div>
  );
}


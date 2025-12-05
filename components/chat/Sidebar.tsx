"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import UserListItem from "./UserListItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import socket from "@/src/lib/socket";

export default function SideBar() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const user = session?.user


  useEffect(() => {
    async function loadUsers() {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users || []);
    }
    loadUsers();
  }, []);

  useEffect(() => {
  if (user?.id) {
    console.log("User connected")
    socket.emit("user_connected", user.id);
  }

  socket.on("online_users", (users) => {
    console.log("Online Users: ", users)
    setOnlineUsers(users);
  });

  return () => {
    socket.off("online_users");
  };
}, [session]);

  return (
    <div className="w-full md:w-80 lg:w-96 h-screen md:h-full border-r border-border flex flex-col bg-sidebar shadow-sm z-10">
      {/* Top User Info */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className="h-11 w-11 ring-2 ring-sidebar-ring/20">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {session?.user?.name?.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-sidebar-foreground truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="ml-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex-shrink-0"
        >
          Logout
        </Button>
      </div>

      {/* USERS LIST */}
      <div className="px-2 py-3 border-b border-sidebar-border flex-shrink-0 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Contacts
        </h2>
        <Link href="/users">
          <Button variant="ghost" size="sm" className="text-xs">
            Manage Users
          </Button>
        </Link>
      </div>
      
      {/* Scrollable users list - using native overflow for better mobile support */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <div className="p-2 space-y-1">
          {users.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No contacts found
            </div>
          ) : (
            users.map((user) => (
              <Link href={`/chat/${user._id}`} key={user._id}>
                <UserListItem 
                  name={user.name} 
                  image={user.image} 
                  online={onlineUsers.includes(user._id)}
                />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

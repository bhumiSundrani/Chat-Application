"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function UserListItem({
  name,
  image,
  online,
}: {
  name: string;
  image?: string;
  online?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors duration-150 group">
      <div className="relative flex-shrink-0">
        <Avatar className="h-11 w-11 ring-2 ring-sidebar-ring/20 group-hover:ring-sidebar-ring/40 transition-all">
          <AvatarImage src={image} />
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            {name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* ONLINE DOT */}
        <span
          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-sidebar ${
            online 
              ? "bg-green-500 shadow-lg shadow-green-500/50" 
              : "bg-muted-foreground/40"
          } transition-all`}
        />
      </div>

      <p className="font-medium text-sidebar-foreground truncate flex-1">{name}</p>
    </div>
  );
}

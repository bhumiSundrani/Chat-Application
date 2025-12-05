"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function TopBar() {
  const { data: session } = useSession();
  const user = session?.user;
  console.log(session)

  return (
    <div className="flex items-center justify-between p-3 border-b">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user?.image || ""} />
          <AvatarFallback>{user?.name?.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
      >
        Logout
      </Button>
    </div>
  );
}

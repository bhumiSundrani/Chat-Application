"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function GoogleButton() {
  return (
    <Button
      variant="outline"
      className="w-full flex items-center gap-2 border-border hover:bg-accent hover:text-accent-foreground transition-all"
      onClick={() => signIn("google")}
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        className="w-5 h-5"
        alt="Google"
      />
      Continue with Google
    </Button>
  );
}

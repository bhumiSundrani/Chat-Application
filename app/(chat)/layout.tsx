import SideBar from "@/components/chat/Sidebar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ChatLayoutClient from "./ChatLayoutClient";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) redirect("/auth/login");

  return <ChatLayoutClient>{children}</ChatLayoutClient>;
}

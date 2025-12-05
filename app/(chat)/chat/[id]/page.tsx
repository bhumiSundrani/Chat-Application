// 🚫 NO "use client" HERE — this is a server component

import ChatPageClient from "./ChatPageClient";

export const dynamicParams = true;

export default async function ChatPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: otherId } = await props.params;

  return <ChatPageClient otherId={otherId} />;
}

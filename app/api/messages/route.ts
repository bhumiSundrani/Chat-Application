import { connectDB } from "@/src/lib/db";
import { Message } from "@/src/models/Message";
import { Conversation } from "@/src/models/Conversation";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      conversationId,
      senderId,
      content,
      attachments = [],
    } = body;

    const message = await Message.create({
      conversationId,
      senderId,
      content,
      attachments,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: { text: content, createdAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (error: any) {
    console.log("Error: ", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

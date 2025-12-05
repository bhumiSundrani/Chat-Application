import { connectDB } from "@/src/lib/db";
import { Conversation } from "@/src/models/Conversation";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await connectDB();
  const { user1, user2 } = await req.json();

  // Check existing conversation
  let convo = await Conversation.findOne({
    participants: { $all: [user1, user2] },
  });

  if (!convo) {
    convo = await Conversation.create({
      participants: [user1, user2],
    });
  }

  return NextResponse.json({ conversationId: convo._id });
}

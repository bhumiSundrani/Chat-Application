import { connectDB } from "@/src/lib/db";
import { Message } from "@/src/models/Message";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  // ❗ Unwrap params (Next.js 15 requirement)
  const { conversationId } = await context.params;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = parseInt(searchParams.get("skip") || "0");

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

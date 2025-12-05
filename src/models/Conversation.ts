import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  participants: string[]; // 2 user IDs
  lastMessage?: {
    text?: string;
    createdAt: Date;
  };
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessage: {
      text: String,
      createdAt: Date,
    },
  },
  { timestamps: true }
);

export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

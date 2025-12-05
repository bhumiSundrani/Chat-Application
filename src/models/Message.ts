  import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, required: true },
  senderId: { type: Schema.Types.ObjectId, required: true },
  content: { type: String, default: "" },

  attachments: [
    {
      url: String,
      fileName: String,
      fileType: String,
      publicId: String,
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

MessageSchema.index({ conversationId: 1, createdAt: -1 });


export const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);


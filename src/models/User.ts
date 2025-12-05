import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  mobile?: string | null;
  password?: string | null;
  provider?: string;
  providerId?: string;
  lastSeen?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    
    mobile: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    
    password: { type: String },
    provider: { type: String, default: "credentials" },
    providerId: { type: String },
    lastSeen: Date,
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

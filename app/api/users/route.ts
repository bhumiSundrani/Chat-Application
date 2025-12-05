import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { User } from "@/src/models/User";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // fetch all users except the logged-in user
    const users = await User.find({
      email: { $ne: session.user.email },
    })
      .select("name email mobile image _id provider createdAt")
      .lean();

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, mobile, password } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Check if mobile already exists (if provided)
    if (mobile) {
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        return NextResponse.json(
          { error: "Mobile number already exists" },
          { status: 400 }
        );
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      mobile: mobile || null,
      password: hashedPassword,
      provider: password ? "credentials" : "manual",
    });

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      provider: user.provider,
    };

    return NextResponse.json({ message: "User created successfully", user: userResponse }, { status: 201 });
  } catch (err: any) {
    console.error("Create user error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

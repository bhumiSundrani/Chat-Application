import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import { User } from "@/src/models/User";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await context.params;

    const user = await User.findById(id)
      .select("name email mobile image _id provider createdAt")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { name, email, mobile, password } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is being changed and if it already exists
    if (email && email.toLowerCase().trim() !== user.email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
      user.email = normalizedEmail;
    }

    // Check if mobile is being changed and if it already exists
    if (mobile !== undefined && mobile !== user.mobile) {
      if (mobile) {
        const existingMobile = await User.findOne({ mobile });
        if (existingMobile && String(existingMobile._id) !== String(id)) {
          return NextResponse.json(
            { error: "Mobile number already exists" },
            { status: 400 }
          );
        }
      }
      user.mobile = mobile || null;
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      provider: user.provider,
    };

    return NextResponse.json({ message: "User updated successfully", user: userResponse });
  } catch (err: any) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await context.params;

    // Prevent deleting yourself
    if (String(id) === String(session.user.id)) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (err: any) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


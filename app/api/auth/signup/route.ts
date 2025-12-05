import { connectDB } from "@/src/lib/db";
import { User } from "@/src/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { name, email, mobile, password } = body;

    // Normalize email (lowercase and trim)
    const normalizedEmail = email ? email.toLowerCase().trim() : null;

    if(normalizedEmail){
        const exists = await User.findOne({ email: normalizedEmail });
        if (exists) {
        console.log("Email already exists")
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }
    }

    if(mobile){
        const exists = await User.findOne({mobile});
        if (exists) {
        console.log("Mobile already exists")
      return NextResponse.json(
        { error: "Mobile already exists" },
        { status: 400 }
      );
    }
    }

    

    

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      mobile,
      password: hashedPassword,
      provider: "credentials",
    });

    return NextResponse.json({ message: "User created", user });
  } catch (error: any) {
    console.log("Signup Error: ", error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

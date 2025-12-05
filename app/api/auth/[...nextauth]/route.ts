import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/src/lib/db";
import { User } from "@/src/models/User";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email" },
        password: { label: "Password" },
      },

      async authorize(credentials: any) {
        await connectDB();

        const { email, password } = credentials;

        // fetch plain object
        const user = await User.findOne({ email }).lean();
        if (!user) throw new Error("Invalid email or password");

        // user created via Google has no password
        if (!user.password) {
          throw new Error("Please login with Google");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Invalid email or password");

        // return only serializable fields
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = token.user as any;
      return session;
    },

    async signIn({ profile }) {
      if (profile) {
        await connectDB();

        let existing = await User.findOne({ email: profile.email }).lean();

        if (!existing) {
          await User.create({
            name: profile.name,
            email: profile.email,
            provider: "google",
            password: null,
            providerId: profile.sub,
          });
        }
      }
      return true;
    },
  },

  pages: {
    signIn: "/auth/login",
  },
});

export { handler as GET, handler as POST };

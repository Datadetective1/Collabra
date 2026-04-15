import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

// Magic-link accounts are passwordless — but the Turso production DB still
// has User.passwordHash NOT NULL (we don't rebuild that table across FKs
// just for this). Store a bcrypt hash of random bytes; nothing can ever
// `compare()` against it successfully, so password sign-in for those
// accounts is impossible by construction.
async function makeUnusablePasswordHash(): Promise<string> {
  const randomSecret = randomBytes(32).toString("hex");
  return bcrypt.hash(randomSecret, 10);
}

export const authOptions: AuthOptions = {
  providers: [
    // Standard email + password.
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),

    // Magic-link sign-in tied to a pending problem submission.
    //
    // The client calls signIn("magic-link", { token }) on the verify page
    // after the user clicks the link in their email. We consume the pending
    // row atomically here: create (or reuse) a passwordless User, create the
    // Problem, mark the token consumed with the resulting problem id, and
    // return the user so NextAuth issues a session.
    //
    // If anything in this flow fails, nothing is committed — user stays
    // signed out and can click the link again.
    CredentialsProvider({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token;
        if (!token || typeof token !== "string") return null;

        const pending = await prisma.pendingProblemSubmission.findUnique({
          where: { token },
        });
        if (!pending) return null;

        // If this token was already consumed, reuse its result: sign the
        // same user in (idempotent click-again-on-email behavior).
        if (pending.consumedAt && pending.resultProblemId) {
          const user = await prisma.user.findUnique({
            where: { email: pending.email },
          });
          if (!user) return null;
          return { id: user.id, email: user.email, name: user.name };
        }

        // Fresh use: token must not be expired.
        if (pending.expiresAt.getTime() < Date.now()) return null;

        // Derive a display name from the email local-part as a sane default.
        // Users can edit their profile afterwards.
        const defaultName = pending.email.split("@")[0] || "Collabra User";

        // Pre-compute the unusable hash outside the transaction so bcrypt's
        // cost doesn't eat into the transaction's lock window.
        const unusableHash = await makeUnusablePasswordHash();

        // All-or-nothing: create user (or reuse existing), create problem,
        // mark pending consumed.
        const result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.upsert({
            where: { email: pending.email },
            update: {},
            create: {
              email: pending.email,
              name: defaultName,
              role: "problem_creator",
              passwordHash: unusableHash,
            },
          });

          const problem = await tx.problem.create({
            data: {
              title: pending.title,
              description: pending.description,
              category: pending.category,
              creatorId: user.id,
            },
          });

          await tx.pendingProblemSubmission.update({
            where: { id: pending.id },
            data: {
              consumedAt: new Date(),
              resultProblemId: problem.id,
            },
          });

          return { user, problem };
        });

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "collabra-dev-secret-change-in-production",
};

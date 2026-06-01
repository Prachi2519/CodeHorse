import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getAppBaseUrl, getAuthTrustedOrigins } from "./app-url";
import prisma from "./db";

const githubClientId = process.env.GITHUB_CLIENT_ID?.trim();
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
const betterAuthSecret = process.env.BETTER_AUTH_SECRET?.trim();

if (!githubClientId || !githubClientSecret) {
  throw new Error(
    "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be configured.",
  );
}

if (process.env.NODE_ENV === "production" && !betterAuthSecret) {
  throw new Error("BETTER_AUTH_SECRET must be configured in production.");
}

export const auth = betterAuth({
  appName: "CodeHorse",
  baseURL: getAppBaseUrl(),
  secret: betterAuthSecret,
  trustedOrigins: getAuthTrustedOrigins(),
  advanced: {
    trustedProxyHeaders: true,
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    github: {
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      scope: ["repo"],
    },
  },
});

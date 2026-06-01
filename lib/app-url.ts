const LOCAL_APP_ORIGIN = "http://localhost:3000";

const hasProtocol = (value: string) => /^[a-z][a-z\d+\-.]*:\/\//i.test(value);

const isLocalHostLike = (value: string) => {
  const host = value.replace(/^[a-z][a-z\d+\-.]*:\/\//i, "").split("/")[0];

  return (
    host.startsWith("localhost") ||
    host.startsWith("127.") ||
    host.startsWith("[::1]")
  );
};

const normalizeHostOrigin = (host?: string | null, protocol = "https") => {
  const trimmedHost = host?.trim();

  if (!trimmedHost) {
    return null;
  }

  if (
    /\.\.|[\s<>'"]|javascript:|file:|data:/i.test(trimmedHost) ||
    trimmedHost.includes("\0")
  ) {
    return null;
  }

  const normalizedProtocol = protocol === "http" ? "http" : "https";

  try {
    return new URL(`${normalizedProtocol}://${trimmedHost}`).origin;
  } catch {
    return null;
  }
};

export const isLocalAppOrigin = (origin: string) => {
  const hostname = new URL(origin).hostname;

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
};

export const normalizeAppOrigin = (value?: string | null) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = hasProtocol(trimmed)
    ? trimmed
    : `${isLocalHostLike(trimmed) ? "http" : "https"}://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    throw new Error(
      "Invalid app URL configured. Set BETTER_AUTH_URL or NEXT_PUBLIC_APP_BASE_URL to a valid origin like https://codehorse.vercel.app.",
    );
  }
};

const getConfiguredOrigins = () => {
  return [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_BASE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]
    .map(normalizeAppOrigin)
    .filter((origin): origin is string => Boolean(origin));
};

export const getAppBaseUrl = () => {
  const origins = getConfiguredOrigins();
  const origin =
    process.env.NODE_ENV === "production"
      ? origins.find((candidate) => !isLocalAppOrigin(candidate)) ?? origins[0]
      : origins[0];

  if (origin) {
    if (process.env.NODE_ENV === "production" && isLocalAppOrigin(origin)) {
      throw new Error(
        "Production app URL is pointing at localhost. Set BETTER_AUTH_URL and NEXT_PUBLIC_APP_BASE_URL to your Vercel production URL.",
      );
    }

    return origin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing production app URL. Set BETTER_AUTH_URL or NEXT_PUBLIC_APP_BASE_URL before deploying.",
    );
  }

  return LOCAL_APP_ORIGIN;
};

export const getPublicAppBaseUrl = () => {
  const origins = [
    process.env.NEXT_PUBLIC_APP_BASE_URL,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]
    .map(normalizeAppOrigin)
    .filter((origin): origin is string => Boolean(origin));

  return (
    origins.find((origin) => !isLocalAppOrigin(origin)) ?? getAppBaseUrl()
  );
};

const normalizeTrustedOrigin = (value?: string | null) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.includes("*")) {
    return hasProtocol(trimmed) ? trimmed : `https://${trimmed}`;
  }

  return normalizeAppOrigin(trimmed);
};

const getRequestOrigin = (request?: Request) => {
  if (!request) {
    return null;
  }

  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ??
    (forwardedHost && isLocalHostLike(forwardedHost) ? "http" : "https");
  const originFromHeaders = normalizeHostOrigin(forwardedHost, forwardedProto);

  if (originFromHeaders) {
    return originFromHeaders;
  }

  return normalizeAppOrigin(request.url);
};

export const getAuthTrustedOrigins = (request?: Request) => {
  const origins = new Set<string>([
    LOCAL_APP_ORIGIN,
    "http://127.0.0.1:3000",
    "https://*.vercel.app",
  ]);

  const requestOrigin = getRequestOrigin(request);

  if (requestOrigin) {
    origins.add(requestOrigin);
  }

  for (const origin of getConfiguredOrigins()) {
    origins.add(origin);
  }

  const extraOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [];

  for (const origin of extraOrigins) {
    const normalizedOrigin = normalizeTrustedOrigin(origin);

    if (normalizedOrigin) {
      origins.add(normalizedOrigin);
    }
  }

  return Array.from(origins);
};

export const getGitHubWebhookUrl = () =>
  `${getPublicAppBaseUrl()}/api/webhooks/github`;

import { Inngest } from "inngest";

const inngestEventKey = process.env.INNGEST_EVENT_KEY?.trim();
const inngestSigningKey = process.env.INNGEST_SIGNING_KEY?.trim();

export const isInngestConfigured = () =>
  process.env.INNGEST_DEV === "1" || Boolean(inngestEventKey);

export const inngest = new Inngest({
  id: "codehorse",
  eventKey: inngestEventKey,
  signingKey: inngestSigningKey,
  isDev: process.env.INNGEST_DEV === "1",
});

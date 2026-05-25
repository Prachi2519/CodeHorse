import { NextResponse, NextRequest } from "next/server";
import { reviewPullRequest } from "@/module/ai/actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = req.headers.get("x-github-event");
    console.log(`Received GitHub event: ${event}`);

    if (event == "ping") {
      return NextResponse.json({ message: "Pong" }, { status: 200 });
    }

    if (event === "pull_request") {
      const action = body.action;
      const fullName = body.repository?.full_name;
      const prNumber = body.pull_request?.number ?? body.number;

      if (!fullName || !prNumber) {
        return NextResponse.json(
          { error: "Invalid pull_request payload" },
          { status: 400 },
        );
      }

      const [owner, repoName] = fullName.split("/");

      const shouldReview =
        action === "opened" ||
        action === "synchronize" ||
        action === "reopened" ||
        action === "ready_for_review";

      if (shouldReview) {
        const result = await reviewPullRequest(owner, repoName, prNumber);
        console.log(
          `Review queued for ${fullName} #${prNumber}:`,
          JSON.stringify(result),
        );

        if (!result.success) {
          return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result, { status: 200 });
      }

      return NextResponse.json(
        { message: `Ignored pull_request action: ${action}` },
        { status: 200 },
      );
    }
    //TODO: HANDLE LATER

    return NextResponse.json({ message: "Event processed" }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

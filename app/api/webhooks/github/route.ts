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
      const prNumber = Number(body.pull_request?.number ?? body.number);
      const isMergedPullRequest =
        action === "closed" && body.pull_request?.merged === true;

      if (!fullName || !Number.isInteger(prNumber)) {
        return NextResponse.json(
          { error: "Invalid pull_request payload" },
          { status: 400 },
        );
      }

      const [owner, repoName] = fullName.split("/");

      if (!owner || !repoName) {
        return NextResponse.json(
          { error: "Invalid repository full_name" },
          { status: 400 },
        );
      }

      const shouldReview =
        action === "opened" ||
        action === "synchronize" ||
        action === "reopened" ||
        action === "ready_for_review" ||
        isMergedPullRequest;

      if (shouldReview) {
        const result = await reviewPullRequest(owner, repoName, prNumber, {
          action,
          merged: isMergedPullRequest,
          prUrl: body.pull_request?.html_url,
        });
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
        {
          action,
          merged: body.pull_request?.merged === true,
          message: `Ignored pull_request action: ${action}`,
        },
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

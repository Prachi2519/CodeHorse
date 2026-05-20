import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { dataTagErrorSymbol } from "@tanstack/react-query";

/**
 * getting the github access token
 *
 *
 */

export const getGithubToken = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "github",
    },
  });

  if (!account?.accessToken) {
    throw new Error("No github access token found");
  }

  return account.accessToken;
};

export async function fetchUserContribution(token:string, username: string) {
  const octokit = new Octokit({auth:token});

  const query = 
  query($username: String!) {
    user(login:$username){
      contributionCollection {
        contributionCalender{
          totalContributions
          weeks{
            contributionDays{
              contributionCount
              data
              color
            }
          }
        }
      }
    }
  }

  try {
    const response: any = await Octokit.graphql(query, {
      username
    })
    return response.user.contributionCollection.contributionCalender
  } catch (error) {

  }
}

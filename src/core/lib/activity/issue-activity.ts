import { prisma } from "@/core/lib/prisma/prisma";
import { IssueActivityType } from "@/generated/prisma/enums";

export async function logIssueActivity(
  issueId: string,
  type: IssueActivityType,
  oldValue?: string | null,
  newValue?: string | null
) {
  return prisma.issueActivity.create({
    data: {
      issueId,
      type,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
    },
  });
}

export async function getIssueActivities(issueId: string) {
  return prisma.issueActivity.findMany({
    where: { issueId },
    orderBy: { createdAt: "desc" },
  });
}

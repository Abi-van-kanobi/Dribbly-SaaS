import { requireWorkspace } from "@/lib/session";
import { loadBar, loadCandidates } from "@/lib/pin-service";
import { TodayBarView } from "./TodayBarView";

/**
 * The Important Today bar: the few things the person chose to focus on today, nothing else.
 * "Today" is the workspace's own calendar day, not the server's.
 */
export async function TodayBar() {
  const { db, workspace, user } = await requireWorkspace();
  const ctx = { workspaceId: workspace.id, userId: user.id, timeZone: workspace.timezone, now: new Date() };
  const [bar, candidates] = await Promise.all([loadBar(db, ctx), loadCandidates(db, ctx)]);
  return <TodayBarView bar={bar} candidates={candidates} />;
}

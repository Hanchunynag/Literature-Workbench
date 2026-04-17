import { countPapersNeedingMaintenance, listPapersNeedingMaintenance } from "@/lib/db/papers";
import { processPaper } from "@/lib/pipeline/process-paper";

type MaintenanceSweepState = {
  running: boolean;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastError: string | null;
  lastQueuedPaperIds: string[];
  lastCompletedPaperIds: string[];
};

declare global {
  var __paperMaintenanceSweepState: MaintenanceSweepState | undefined;
}

function getSweepState() {
  if (!globalThis.__paperMaintenanceSweepState) {
    globalThis.__paperMaintenanceSweepState = {
      running: false,
      lastStartedAt: null,
      lastFinishedAt: null,
      lastError: null,
      lastQueuedPaperIds: [],
      lastCompletedPaperIds: []
    };
  }

  return globalThis.__paperMaintenanceSweepState;
}

export function getMaintenanceSweepState() {
  const state = getSweepState();

  return {
    ...state,
    pendingCount: countPapersNeedingMaintenance()
  };
}

export function triggerMaintenanceSweep(batchSize = 3) {
  const state = getSweepState();

  if (state.running) {
    return {
      started: false,
      queuedPaperIds: [] as string[],
      state: getMaintenanceSweepState()
    };
  }

  const queuedPaperIds = listPapersNeedingMaintenance(batchSize);

  if (queuedPaperIds.length === 0) {
    state.lastQueuedPaperIds = [];
    state.lastCompletedPaperIds = [];

    return {
      started: false,
      queuedPaperIds,
      state: getMaintenanceSweepState()
    };
  }

  state.running = true;
  state.lastStartedAt = new Date().toISOString();
  state.lastError = null;
  state.lastQueuedPaperIds = queuedPaperIds;
  state.lastCompletedPaperIds = [];

  void (async () => {
    try {
      for (const paperId of queuedPaperIds) {
        try {
          await processPaper(paperId);
          state.lastCompletedPaperIds = [...state.lastCompletedPaperIds, paperId];
        } catch (error) {
          console.error("maintenance sweep reprocess failed", { paperId, error });
        }
      }
    } catch (error) {
      state.lastError = error instanceof Error ? error.message : "Maintenance sweep failed.";
      console.error("maintenance sweep failed", error);
    } finally {
      state.running = false;
      state.lastFinishedAt = new Date().toISOString();
    }
  })();

  return {
    started: true,
    queuedPaperIds,
    state: getMaintenanceSweepState()
  };
}

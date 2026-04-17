import { listPaperIds } from "../lib/db/papers";
import { processPaper } from "../lib/pipeline/process-paper";

async function main() {
  const paperIds = listPaperIds();

  for (const paperId of paperIds) {
    // Keep backfill intentionally sequential to avoid overloading local model quotas.
    await processPaper(paperId);
    console.log(`processed ${paperId}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

// in controllers/summaryController.js
import generateSummaries from "../../scripts/generateSummaries.js"
export const rebuildSummaries = async (req, res) => {
    try {
      await generateSummaries();
      res.json({ message: "Summaries rebuilt successfully" });
    } catch (e) {
      res.status(500).json({ message: "Failed to rebuild summaries", error: e });
    }
  };
  
// backend/src/controllers/insights.controller.js

const AnalyticsService = require('../services/analytics.service');

/**
 * GET /api/insights
 */
const getOracleInsight = async (req, res) => {
  try {
    const userId = req.user.id;
    // Call the service to get the processed data
    const insight = await AnalyticsService.generateOracleInsight(userId);
    res.status(200).json(insight);
  } catch (error) {
    console.error(`Error generating insight:`, error);
    res.status(500).json({ message: "The Oracle is silent." });
  }
};

/**
 * GET /api/insights/weekly
 */
const getWeeklyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    // Call the service to get the report data
    const report = await AnalyticsService.generateWeeklyReport(userId);
    res.status(200).json(report);
  } catch (error) {
    console.error(`Error generating report:`, error);
    res.status(500).json({ message: "Could not generate report." });
  }
};

module.exports = { getOracleInsight, getWeeklyReport };
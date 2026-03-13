// Created by: Jorge Valdes-Santiago
//
//
// This script contains the endpoints to the goals controller functions
const express = require("express"); //import express from "express";
const GoalsController = require("../controllers/goals.controller.js");
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth.middleware');

router.use(ensureAuthenticated);


// HTTP GET /api/goals/
router.get("/", GoalsController.getGoalsByUserId);

// HTTP POST /api/goals
router.post("/", GoalsController.createGoal);

// HTTP GET /api/goals/:id
router.get("/:id", GoalsController.getGoalById);

// HTTP PATCH /api/goals/:id
router.patch("/:id", GoalsController.updateGoal);

// HTTP DELETE /api/goals/:id
router.delete("/:id", GoalsController.deleteGoal);

module.exports = router; //export default router;

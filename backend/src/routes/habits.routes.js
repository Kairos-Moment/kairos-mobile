// Created by: Jorge Valdes-Santiago
//
//
// This script contains the endpoints to the tasks controller functions
const express = require("express"); //import express from "express";
const HabitsController = require("../controllers/habits.controller.js");
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth.middleware');

router.use(ensureAuthenticated);

// HTTP GET /api/habits/
router.get("/", HabitsController.getHabitsByUserId);

// HTTP POST /api/habits
router.post("/", HabitsController.createHabit);

// HTTP GET /api/habits/:id
router.get("/:id", HabitsController.getHabitById);

// HTTP PATCH /api/habits/:id
router.patch("/:id", HabitsController.updateHabit);

// HTTP DELETE /api/habits/:id
router.delete("/:id", HabitsController.deleteHabit);

module.exports = router; //export default router;

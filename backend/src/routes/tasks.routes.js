// backend/src/routes/tasks.routes.js

const express = require("express");
const TasksController = require("../controllers/tasks.controller.js");
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth.middleware');
const { toggleSubtask } = require('../controllers/tasks.controller');

router.use(ensureAuthenticated);

router.get("/", TasksController.getTasksByUserId);
router.post("/", TasksController.createTask);
router.get("/:id", TasksController.getTaskById);

// --- CHANGE THIS FROM PATCH TO PUT ---
router.put("/:id", TasksController.updateTask);

router.delete("/:id", TasksController.deleteTask);
router.patch('/subtasks/:id/toggle', toggleSubtask);

module.exports = router;
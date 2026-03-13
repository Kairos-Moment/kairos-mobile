// backend/src/services/analytics.service.js

const { pool } = require('../config/database');
const { isToday, isTomorrow, format, eachDayOfInterval, addDays } = require('date-fns');

/**
 * Generates the Dashboard Insight.
 * Now checks for URGENT tasks to trigger the "Red Alert" on the frontend.
 */
const generateOracleInsight = async (userId) => {
  // 1. Fetch pending tasks that are High Priority (Urgent OR Important)
  const query = `
    SELECT title, is_important, is_urgent, due_date 
    FROM tasks 
    WHERE user_id = $1 
    AND status = 'pending'
    AND (is_urgent = TRUE OR is_important = TRUE)
    ORDER BY is_urgent DESC, due_date ASC;
  `;
  const { rows: tasks } = await pool.query(query, [userId]);

  // 2. Analyze tasks
  // We prioritize 'Urgent' tasks for the alert system
  const urgentTasks = tasks.filter(t => t.is_urgent);
  const highLeverageTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    const date = new Date(t.due_date);
    return isToday(date) || isTomorrow(date);
  });

  // 2. Fetch Habits Status
  // Find active habits not logged today
  const habitQuery = `
    SELECT h.title
    FROM habits h
    LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND DATE(hl.completion_date) = CURRENT_DATE
    WHERE h.user_id = $1 AND h.is_active = TRUE AND hl.id IS NULL
  `;
  const { rows: missedHabits } = await pool.query(habitQuery, [userId]);

  // 3. Generate Dynamic Message
  let message;

  // Logic: Urgent tasks take priority over everything else
  if (urgentTasks.length > 0) {
    message = `Alert: You have ${urgentTasks.length} urgent task${urgentTasks.length > 1 ? 's' : ''} requiring immediate attention. Action is required.`;
  } else if (missedHabits.length > 0) {
    // Pick one random missed habit to mention
    const habitName = missedHabits[0].title;
    message = `Reminder: Consistency is key. You haven't logged '${habitName}' yet today.`;
  } else if (highLeverageTasks.length > 0) {
    message = "You have high-leverage tasks due soon. Seize the day with purpose!";
  } else if (tasks.length > 0) {
    message = "You have important matters pending. Steady progress prevents chaos.";
  } else {
    message = "The flow of time is calm. No urgent matters cloud your horizon.";
  }

  // 4. Format for Frontend
  // We take the top 3 most critical tasks
  const tasksDisplay = tasks.slice(0, 3).map(task => {
    let dueText = 'No Date';
    if (task.due_date) {
      const date = new Date(task.due_date);
      if (isToday(date)) dueText = 'Due Today';
      else if (isTomorrow(date)) dueText = 'Due Tomorrow';
      else dueText = format(date, 'MMM do');
    }

    return {
      text: task.title,
      due: dueText,
      is_urgent: task.is_urgent,
      is_important: task.is_important
    };
  });

  // 5. Productivity Summary (for Speech)
  const prodQuery = `SELECT COUNT(*) as count FROM tasks WHERE user_id = $1 AND status = 'completed' AND due_date > NOW() - INTERVAL '7 days'`;
  const prodResult = await pool.query(prodQuery, [userId]);
  const completedCount = prodResult.rows[0].count;
  const productivitySummary = `You have completed ${completedCount} tasks in the last 7 days.`;

  return {
    message,
    tasks: tasksDisplay,
    missedHabits: missedHabits.map(h => h.title),
    productivitySummary
  };
};

/**
 * Generates the Weekly Report Data.
 * Aggregates completed tasks and goal distribution.
 */
const generateWeeklyReport = async (userId) => {
  // 1. Determine Date Range
  // Get the first active day (min due_date of completed tasks OR min start_time of focus sessions)
  const minTaskDateResult = await pool.query(
    `SELECT MIN(due_date) as start_date FROM tasks WHERE user_id = $1 AND status = 'completed'`,
    [userId]
  );
  const minSessionDateResult = await pool.query(
    `SELECT MIN(start_time) as start_date FROM focus_sessions WHERE user_id = $1`,
    [userId]
  );

  let taskStartDate = minTaskDateResult.rows[0].start_date ? new Date(minTaskDateResult.rows[0].start_date) : null;
  let sessionStartDate = minSessionDateResult.rows[0].start_date ? new Date(minSessionDateResult.rows[0].start_date) : null;

  // Default to today if nothing exists
  let startDate = new Date();

  // Use the earliest of the two dates
  if (taskStartDate && sessionStartDate) {
    startDate = taskStartDate < sessionStartDate ? taskStartDate : sessionStartDate;
  } else if (taskStartDate) {
    startDate = taskStartDate;
  } else if (sessionStartDate) {
    startDate = sessionStartDate;
  }

  if (startDate > new Date()) startDate = new Date(); // Defensive

  const endDate = addDays(new Date(), 7); // Next week

  // 2. Generate Full Date Sequence
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  // 3. Query Productivity Data (Dynamic Range)

  // A. Get Focus Minutes (from focus_sessions)
  const minutesQuery = `
    SELECT DATE(start_time) as date_val, COALESCE(SUM(duration_minutes), 0) as minutes
    FROM focus_sessions
    WHERE user_id = $1 
    AND start_time >= $2 AND start_time <= $3
    GROUP BY date_val;
  `;
  const minutesResult = await pool.query(minutesQuery, [userId, startDate, endDate]);

  // B. Get Completed Tasks (from tasks table USING completed_at)
  const tasksQuery = `
    SELECT DATE(completed_at) as date_val, COUNT(*) as task_count
    FROM tasks
    WHERE user_id = $1
    AND status = 'completed'
    AND completed_at >= $2 AND completed_at <= $3
    GROUP BY date_val;
  `;
  const tasksResult = await pool.query(tasksQuery, [userId, startDate, endDate]);

  const dataMap = {};

  // Fill minutes
  minutesResult.rows.forEach(row => {
    const key = format(new Date(row.date_val), 'yyyy-MM-dd');
    if (!dataMap[key]) dataMap[key] = { minutes: 0, tasks: 0 };
    dataMap[key].minutes = parseInt(row.minutes);
  });

  // Fill tasks
  tasksResult.rows.forEach(row => {
    const key = format(new Date(row.date_val), 'yyyy-MM-dd');
    if (!dataMap[key]) dataMap[key] = { minutes: 0, tasks: 0 };
    dataMap[key].tasks = parseInt(row.task_count);
  });

  const productivityData = allDays.map(day => {
    const key = format(day, 'yyyy-MM-dd');
    return {
      date: format(day, 'MM/dd'),
      minutes: dataMap[key]?.minutes || 0,
      tasks: dataMap[key]?.tasks || 0
    };
  });

  // 4. Goal Distribution Data (Dynamic Range)
  const distQuery = `
    SELECT COALESCE(g.title, 'Uncategorized') as name, 
       COALESCE(SUM(fs.duration_minutes), 0) as value
        FROM focus_sessions fs
        JOIN tasks t ON fs.task_id = t.id
        LEFT JOIN goals g ON t.goal_id = g.id
        WHERE fs.user_id = $1
        AND fs.start_time >= $2 AND fs.start_time <= $3
        GROUP BY COALESCE(g.title, 'Uncategorized');
  `;
  const distResult = await pool.query(distQuery, [userId, startDate, endDate]);

  // 5. Summary
  const total = productivityData.reduce((acc, curr) => acc + curr.minutes, 0);
  const summary = `You have focused for ${total} minutes since your journey began.`;

  return {
    summary,
    productivityData,
    distributionData: distResult.rows.map(r => ({ ...r, value: parseInt(r.value) }))
  };
};

module.exports = { generateOracleInsight, generateWeeklyReport };
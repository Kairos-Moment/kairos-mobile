// frontend/src/components/dashboard/Timeline.jsx

import React from 'react';
import styles from './Timeline.module.css';
import TimelineItem from './TimelineItem';
import { format } from 'date-fns';

/**
 * Skeleton loader to prevent layout shift during data fetching.
 */
const TimelineSkeleton = () => (
  <div className={styles.skeletonItem}>
    <div className={styles.skeletonCircle}></div>
    <div className={styles.skeletonCard}></div>
  </div>
);

const Timeline = ({ 
  tasks, 
  isLoading, 
  onEdit, 
  onDelete, 
  onTaskUpdate, 
  onStartFocus // Passed from Dashboard
}) => {
  
  // 1. Handle Loading State
  if (isLoading) {
    return (
      <div className={styles.timeline}>
        <TimelineSkeleton />
        <TimelineSkeleton />
        <TimelineSkeleton />
      </div>
    );
  }

  // 2. Handle Empty State
  if (!tasks || tasks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⏳</div>
        <h3>Your timeline is clear.</h3>
        <p>No labors assigned for today. Click the '+' button to plant a new task.</p>
      </div>
    );
  }

  // 3. Render the List of Tasks
  return (
    <div className={styles.timeline}>
      {tasks.map(task => {
        // Determine the "Tag" or "Type" label based on task properties
        let type = 'Task';
        if (task.is_urgent) type = 'Urgent';
        else if (task.goal_id) type = 'Goal Task';

        return (
          <TimelineItem
            key={task.id}
            task={task}
            // Format the due_date into a readable 12-hour format (e.g., 2:30 PM)
            hour={task.due_date ? format(new Date(task.due_date), 'h:mm a') : '--'}
            type={type}
            onEdit={onEdit}
            onDelete={onDelete}
            onTaskUpdate={onTaskUpdate}
            onStartFocus={onStartFocus} // Link to Focus Page
          />
        );
      })}
    </div>
  );
};

export default Timeline;
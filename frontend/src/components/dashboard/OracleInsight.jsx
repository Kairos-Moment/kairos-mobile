// frontend/src/components/dashboard/OracleInsight.jsx

import React from 'react';
import styles from './OracleInsight.module.css';
// Import a Hazard icon for urgent tasks
import { GiScrollQuill, GiLaurels, GiHazardSign } from 'react-icons/gi';

const SkeletonLoader = () => (
  <div className={`${styles.insightCard} ${styles.loading}`}>
    <h2><GiLaurels size={28} /> The Oracle's Insight</h2>
    <div className={styles.skeleton} style={{ width: '80%', height: '1.2rem', marginBottom: '0.5rem' }} />
    <div className={styles.skeleton} style={{ width: '60%', height: '1.2rem' }} />
  </div>
);

const OracleInsight = ({ insightData, isLoading }) => {
  if (isLoading || !insightData) {
    return <SkeletonLoader />;
  }

  const { message, tasks } = insightData;

  // Check if any task in the list is marked as urgent
  const hasUrgent = tasks?.some(t => t.is_urgent);

  return (
    // If urgent, add the 'urgentCard' class for Red styling
    <div className={`${styles.insightCard} ${hasUrgent ? styles.urgentCard : ''}`}>
      <h2 className={hasUrgent ? styles.urgentHeader : ''}>
        {hasUrgent ? <GiHazardSign size={28} /> : <GiLaurels size={28} />} 
        {hasUrgent ? " Priority Alert" : " The Oracle's Insight"}
      </h2>
      
      <p className={styles.oracleMessage}>{message}</p>
      
      {tasks && tasks.length > 0 ? (
        <ul className={styles.taskList}>
          {tasks.map((task, index) => (
            <li key={index} className={task.is_urgent ? styles.urgentTask : ''}>
              <span className={styles.taskIcon}>
                {task.is_urgent ? <GiHazardSign /> : <GiScrollQuill />}
              </span>
              <div className={styles.taskDetails}>
                <span className={styles.taskText}>{task.text}</span>
                <span className={styles.taskDue}>Due: {task.due}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.noTasksMessage}>
          No high-priority tasks. The path is clear.
        </div>
      )}
    </div>
  );
};

export default OracleInsight;
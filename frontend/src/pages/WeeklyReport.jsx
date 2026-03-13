// frontend/src/pages/WeeklyReportPage.jsx

import React, { useState, useEffect } from 'react';
import styles from './WeeklyReport.module.css';
import apiClient from '../api/axios';

// Import Chart Components
import ProductivityChart from '../components/report/ProductivityChart';
import DistributionChart from '../components/report/DistributionChart';
import ActivityLineChart from '../components/report/ActivityLineChart';

// A dedicated component for the loading state skeleton
const ReportSkeleton = () => (
  <div className={styles.report}>
    <h1 className={styles.reportHeader}>Your Weekly Kairos</h1>
    <div className={styles.reportCard}>
      <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
      <div className={`${styles.skeleton} ${styles.skeletonText}`} />
      <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '80%' }} />
    </div>
    <div className={styles.reportCard}>
      <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
      <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
    </div>
  </div>
);

const WeeklyReport = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        // Make the live API call to the secure endpoint
        const response = await apiClient.get('/insights/weekly');
        setReportData(response.data);
      } catch (error) {
        console.error("Failed to fetch weekly report:", error);
        // In a real app, you might set an error state to show a message.
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, []); // The empty array ensures this runs only once on mount

  // Render the skeleton loader while fetching data
  if (isLoading) {
    return <ReportSkeleton />;
  }

  // Render a message if data could not be fetched
  if (!reportData) {
    return <div className={styles.emptyState}>Could not load your weekly report.</div>;
  }

  return (
    // This page is now wrapped by MainLayout, so we don't need Header or BottomNav
    <div className={styles.reportPage}>
      <h1 className={styles.reportHeader}>Your Weekly Kairos</h1>

      <div className={styles.reportCard}>
        <h3>Oracle's Summary</h3>
        <p>{reportData.summary}</p>
      </div>

      <div className={styles.reportCard}>
        <h3>Productivity Peaks</h3>
        <p className={styles.chartDescription}>Tasks completed per day this week.</p>
        <ProductivityChart data={reportData.productivityData} />
      </div>

      <div className={styles.reportCard}>
        <h3>Activity Detected</h3>
        <p className={styles.chartDescription}>Your activity flow throughout the week.</p>
        <ActivityLineChart data={reportData.productivityData} />
      </div>

      <div className={styles.reportCard}>
        <h3>Time Distribution</h3>
        <p className={styles.chartDescription}>Time spent on each goal category (in minutes).</p>
        <DistributionChart data={reportData.distributionData} />
      </div>
    </div>
  );
};

export default WeeklyReport;
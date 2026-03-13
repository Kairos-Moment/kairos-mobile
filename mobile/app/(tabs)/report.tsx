import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import {
    LineChart,
    BarChart,
    PieChart
} from 'react-native-chart-kit';

import { Text, View } from '@/components/Themed';
import apiClient from '@/api/client';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
        borderRadius: 16
    },
    propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#ffa726"
    }
};

export default function ReportScreen() {
    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReport = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get('/insights/weekly');
            setReportData(response.data);
        } catch (error) {
            console.error("Failed to fetch weekly report:", error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchReport();
    };

    if (isLoading && !refreshing) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Tending the archives...</Text>
            </View>
        );
    }

    if (!reportData) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Could not load the weekly report.</Text>
            </View>
        );
    }

    // Pre-process productivity data for charts
    const peakData = reportData.productivityData?.map((d: any) => Number(d.tasks) || 0) || [];
    const labels = reportData.productivityData?.map((d: any) => d.date) || [];

    const barData = {
        labels: labels.length > 0 ? labels : ["No Data"],
        datasets: [{ data: peakData.length > 0 ? peakData : [0] }]
    };

    const lineData = {
        labels: labels.length > 0 ? labels : ["No Data"],
        datasets: [{ data: peakData.length > 0 ? peakData : [0] }]
    };

    // Pie chart data
    const pieData = reportData.distributionData?.map((d: any, i: number) => ({
        name: d.name || "Uncategorized",
        population: Number(d.value) || 0,
        color: ['#d4af37', '#1a1a2e', '#4caf50', '#ef4444', '#2196f3'][i % 5],
        legendFontColor: "#7F7F7F",
        legendFontSize: 12
    })) || [];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Your Weekly Kairos</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Oracle's Summary</Text>
                <Text style={styles.summaryText}>{reportData.summary}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Productivity Peaks</Text>
                <Text style={styles.cardSub}>Tasks completed per day.</Text>
                <BarChart
                    style={styles.chart}
                    data={barData}
                    width={screenWidth - 60}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    verticalLabelRotation={30}
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Activity Flow</Text>
                <LineChart
                    data={lineData}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Time Distribution</Text>
                <PieChart
                    data={pieData}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={chartConfig}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    center={[10, 0]}
                    absolute
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        marginVertical: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#d4af37',
        textTransform: 'uppercase',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 50,
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginTop: 50,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    cardSub: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 16,
    },
    summaryText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#334155',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
});

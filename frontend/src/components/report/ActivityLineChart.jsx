/* frontend/src/components/report/ActivityLineChart.jsx */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ActivityLineChart = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#38bdf8' }}
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    formatter={(value) => [`${value} mins`, 'Focus Time']}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#38bdf8' }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default ActivityLineChart;

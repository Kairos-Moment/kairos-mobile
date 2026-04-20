import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabIcon({ name, color }: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) {
  return <Ionicons name={name} size={22} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),
        tabBarActiveTintColor: '#d4af37',
        tabBarInactiveTintColor: '#555',
        tabBarStyle: {
          backgroundColor: '#0f0f1a',
          borderTopColor: 'rgba(212,175,55,0.2)',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
        headerStyle: {
          backgroundColor: '#0f0f1a',
          borderBottomColor: 'rgba(212,175,55,0.2)',
          borderBottomWidth: 1,
        },
        headerTintColor: '#d4af37',
        headerTitleStyle: {
          fontWeight: 'bold',
          letterSpacing: 2,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Agora',
          tabBarIcon: ({ color }) => <TabIcon name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Virtues',
          tabBarIcon: ({ color }) => <TabIcon name="shield-checkmark-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Temple',
          tabBarIcon: ({ color }) => <TabIcon name="flame-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Oracle',
          tabBarIcon: ({ color }) => <TabIcon name="bar-chart-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Scrolls',
          tabBarIcon: ({ color }) => <TabIcon name="settings-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}

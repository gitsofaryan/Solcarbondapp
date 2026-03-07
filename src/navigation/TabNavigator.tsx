import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MarketplaceScreen } from '../screens/MarketplaceScreen';
import { PortfolioScreen } from '../screens/PortfolioScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ToolsScreen } from '../screens/ToolsScreen';
import { Header } from '../components/Header';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const tabIcons: Record<string, { active: string; inactive: string }> = {
    Dashboard: { active: 'grid', inactive: 'grid-outline' },
    Market: { active: 'storefront', inactive: 'storefront-outline' },
    Portfolio: { active: 'wallet', inactive: 'wallet-outline' },
    History: { active: 'time', inactive: 'time-outline' },
    Tools: { active: 'construct', inactive: 'construct-outline' },
};

const ScreenWithHeader = ({ children }: { children: React.ReactNode }) => (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header />
        {children}
    </View>
);

export const TabNavigator: React.FC = () => {
    const insets = useSafeAreaInsets();
    const bottomPadding = Math.max(insets.bottom, 10);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    const iconName = focused
                        ? tabIcons[route.name].active
                        : tabIcons[route.name].inactive;
                    return <Ionicons name={iconName as any} size={22} color={color} />;
                },
                tabBarActiveTintColor: colors.green,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: 70 + bottomPadding,
                    paddingBottom: bottomPadding > 0 ? bottomPadding : 10,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                },
            })}
        >
            <Tab.Screen name="Dashboard">
                {() => (
                    <ScreenWithHeader>
                        <DashboardScreen />
                    </ScreenWithHeader>
                )}
            </Tab.Screen>
            <Tab.Screen name="Market">
                {() => (
                    <ScreenWithHeader>
                        <MarketplaceScreen />
                    </ScreenWithHeader>
                )}
            </Tab.Screen>
            <Tab.Screen name="Portfolio">
                {() => (
                    <ScreenWithHeader>
                        <PortfolioScreen />
                    </ScreenWithHeader>
                )}
            </Tab.Screen>
            <Tab.Screen name="History">
                {() => (
                    <ScreenWithHeader>
                        <HistoryScreen />
                    </ScreenWithHeader>
                )}
            </Tab.Screen>
            <Tab.Screen name="Tools">
                {() => (
                    <ScreenWithHeader>
                        <ToolsScreen />
                    </ScreenWithHeader>
                )}
            </Tab.Screen>
        </Tab.Navigator>
    );
};

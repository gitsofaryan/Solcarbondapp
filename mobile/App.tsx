// Polyfills MUST be imported first — before any Solana code
import './src/polyfills';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabNavigator } from './src/navigation/TabNavigator';
import { ProjectDetailScreen } from './src/screens/ProjectDetailScreen';
import { ListProjectScreen } from './src/screens/ListProjectScreen';
import { SellProjectScreen } from './src/screens/SellProjectScreen';
import { CertificateDetailScreen } from './src/screens/CertificateDetailScreen';
import { WalletProvider } from './src/providers/WalletProvider';
import { colors } from './src/theme/colors';

const Stack = createNativeStackNavigator();

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.green,
    background: colors.background,
    card: colors.card,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.green,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <WalletProvider>
        <NavigationContainer theme={DarkTheme}>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen
              name="ProjectDetail"
              options={{ animation: 'slide_from_right' }}
            >
              {({ route, navigation }: any) => (
                <ProjectDetailScreen
                  projectId={route.params?.projectId}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="ListProject"
              component={ListProjectScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="SellProject"
              component={SellProjectScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="CertificateDetail"
              component={CertificateDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </WalletProvider>
    </SafeAreaProvider>
  );
}

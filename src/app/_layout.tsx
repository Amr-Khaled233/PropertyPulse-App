import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider,SafeAreaView  } from 'react-native-safe-area-context';
import { ThemeProvider } from '../theme/ThemeProvider';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
    <AuthProvider>
        <StatusBar style="dark" backgroundColor="#faf9f6" />

        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#faf9f6' },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Landing' }} />
          <Stack.Screen name="home" options={{ title: 'Dashboard' }} />
          <Stack.Screen name="search" options={{ title: 'Search' }} />
          <Stack.Screen name="portfolio" options={{ title: 'Portfolio' }} />
          <Stack.Screen name="profile" options={{ title: 'Profile' }} />
          <Stack.Screen name="property/[id]" options={{ title: 'Property Details' }} />
          <Stack.Screen name="market" options={{ title: 'Market' }} />
          <Stack.Screen name="transactions"  options={{ title: 'Transactions' }} />
          <Stack.Screen name="analysis"      options={{ title: 'Analysis' }} />
          <Stack.Screen name="chat"          options={{ title: 'Chat' }} />
          <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
          <Stack.Screen name="payment"       options={{ title: 'Payment' }} />
          <Stack.Screen name="watchlist"     options={{ title: 'Watchlist' }} />
          <Stack.Screen name="report"        options={{ title: 'Report' }} />
          <Stack.Screen name="admin"         options={{ title: 'Admin' }} />
          <Stack.Screen name="adminUsers"    options={{ title: 'Admin Users' }} />
          <Stack.Screen name="register"      options={{ title: 'Register' }} />
          <Stack.Screen name="login"   options={{ title: 'Login' }}
    />
        </Stack>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
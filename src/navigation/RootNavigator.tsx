import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { PropertyDetailScreen } from '../app/property/[id]';
import { AdminDashboardScreen } from '../app/screens/AdminDashboardScreen';
import { PaymentScreen } from '../app/screens/PaymentScreen';
import { ReportScreen } from '../app/screens/ReportScreen';
import { TransactionsScreen } from '../app/screens/TransactionsScreen';
import { NotificationsScreen } from '../app/screens/NotificationsScreen';
import { AdminUsersScreen } from '../app/screens/AdminUsersScreen';
import { Loader } from '../app/components/common/Loader';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  if (status === 'loading') return <Loader />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'authenticated' ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ presentation: 'card' }} />
          <Stack.Screen name="Admin" component={AdminDashboardScreen} />
          <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ presentation: 'card' }} />
          <Stack.Screen name="Report" component={ReportScreen} />
          <Stack.Screen name="Transactions" component={TransactionsScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DashboardScreen } from '../app/screens/DashboardScreen';
// import { SearchScreen } from '../app/search';
import { ChatScreen } from '../app/screens/ChatScreen';
import { PortfolioScreen } from '../app/screens/PortfolioScreen';
import { ProfileScreen } from '../app/screens/ProfileScreen';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, shadow } from '../theme/theme';
import { AppText } from '../components/common/Text';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Search: 'search',
  Chat: 'sparkles',
  Portfolio: 'briefcase',
  Profile: 'person',
};

function TabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const labels: Record<string, string> = {
    Home: t('tabs.home'),
    Search: t('tabs.search'),
    Chat: t('tabs.ai'),
    Portfolio: t('tabs.portfolio'),
    Profile: t('tabs.profile'),
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: c.surface,
          borderTopWidth: 1,
          borderTopColor: c.border,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
        },
        shadow.soft,
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const name = route.name as keyof TabParamList;
        const isCenter = name === 'Chat';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        if (isCenter) {
          return (
            <View key={route.key} style={{ flex: 1, alignItems: 'center' }}>
              <Pressable
                onPress={onPress}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  marginTop: -18,
                  backgroundColor: c.secondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...shadow.card,
                }}
              >
                <Ionicons name="sparkles" size={24} color="#fff" />
              </Pressable>
              <AppText style={{ fontFamily: fonts.medium, fontSize: 10, color: focused ? c.secondary : c.textMuted, marginTop: 4 }}>
                {labels[name]}
              </AppText>
            </View>
          );
        }

        return (
          <Pressable key={route.key} onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Ionicons name={ICONS[name]} size={22} color={focused ? c.secondary : c.textMuted} />
            <AppText style={{ fontFamily: fonts.medium, fontSize: 10, color: focused ? c.secondary : c.textMuted }}>
              {labels[name]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={DashboardScreen} />
      {/* <Tab.Screen name="Search" component={PropertySearchScreen} /> */}
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
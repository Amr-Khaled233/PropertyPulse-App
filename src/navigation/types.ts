import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Chat: undefined;
  Portfolio: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
  PropertyDetail: { id: string };
  Admin: undefined;
  Payment: { planId?: string } | undefined;
  Report: { id: string };
  Transactions: undefined;
  Notifications: undefined;
  AdminUsers: undefined;
};
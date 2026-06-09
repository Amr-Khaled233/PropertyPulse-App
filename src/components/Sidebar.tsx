import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type MenuItem = {
  name: string;
  icon: string;
  route: string;
  section?: string;
};

const MENU_ITEMS: MenuItem[] = [
  // Main
  { name: 'Dashboard',       icon: 'dashboard',            route: '/home',          section: 'MAIN' },
  { name: 'Market Search',   icon: 'search',               route: '/search',        section: 'MAIN' },
  { name: 'Market Trends',   icon: 'trending-up',          route: '/market/trends', section: 'MAIN' },

  // Tools
  { name: 'AI Advisor',      icon: 'smart-toy',            route: '/ai',            section: 'TOOLS' },
  { name: 'Analysis',        icon: 'bar-chart',            route: '/analysis',      section: 'TOOLS' },
  { name: 'Watchlist',       icon: 'bookmark',             route: '/watchlist',     section: 'TOOLS' },
  { name: 'Chat',            icon: 'chat',                 route: '/chat',          section: 'TOOLS' },

  // Account
  { name: 'Portfolio',       icon: 'pie-chart',            route: '/portfolio',     section: 'ACCOUNT' },
  { name: 'Transactions',    icon: 'receipt-long',         route: '/transactions',  section: 'ACCOUNT' },
  { name: 'Reports',         icon: 'description',          route: '/report',        section: 'ACCOUNT' },
  { name: 'Notifications',   icon: 'notifications',        route: '/notifications', section: 'ACCOUNT' },
  { name: 'Payment',         icon: 'credit-card',          route: '/payment',       section: 'ACCOUNT' },

  // Admin
  { name: 'Admin Dashboard', icon: 'admin-panel-settings', route: '/admin',         section: 'ADMIN' },
  { name: 'Admin Users',     icon: 'manage-accounts',      route: '/adminUsers',    section: 'ADMIN' },

  // Profile
  { name: 'Profile',         icon: 'person',               route: '/profile',       section: 'PROFILE' },
  { name: 'Register',        icon: 'app-registration',     route: '/register',      section: 'PROFILE' },
];

const SECTIONS = ['MAIN', 'TOOLS', 'ACCOUNT', 'ADMIN', 'PROFILE'];

export const Sidebar = () => {
  const router   = useRouter();
  const pathname = usePathname();
  const insets   = useSafeAreaInsets();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <SafeAreaView>
    <View style={[
      styles.container,
      {
        paddingTop: 100,
        paddingBottom: Math.max(insets.bottom, 16),
      },
    ]}>
      {/* Logo */}
      <View style={styles.header}>
        <Text style={styles.logo}>PropertyPulse</Text>
        <Text style={styles.subtitle}>Investor Portal</Text>
      </View>

      {/* Scrollable menu */}
      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 12 }}
      >
        {SECTIONS.map(section => {
          const items = MENU_ITEMS.filter(i => i.section === section);
          const isCollapsed = collapsed[section];

          return (
            <View key={section} style={styles.sectionBlock}>
              {/* Section header — tap to collapse */}
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionLabel}>{section}</Text>
                <MaterialIcons
                  name={isCollapsed ? 'chevron-right' : 'expand-more'}
                  size={16}
                  color="#4a5568"
                />
              </TouchableOpacity>

              {/* Items */}
              {!isCollapsed && items.map(item => {
                const isActive =
                  pathname === item.route ||
                  (item.route !== '/' && pathname.startsWith(item.route));
                return (
                  <TouchableOpacity
                    key={item.name}
                    style={[styles.menuItem, isActive && styles.activeMenuItem]}
                    onPress={() => router.push(item.route as any)}
                    activeOpacity={0.75}
                  >
                    <MaterialIcons
                      name={item.icon as any}
                      size={18}
                      color={isActive ? '#fff' : '#79849b'}
                    />
                    <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                      {item.name}
                    </Text>
                    {isActive && <View style={styles.activeDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* CTA */}
      <TouchableOpacity
        style={styles.newInvestmentButton}
        onPress={() => router.push('/search' as any)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={20} color="#fff" />
        <Text style={styles.newInvestmentText}>New Investment</Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 240,
    backgroundColor: '#0A1628',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2d42',
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#79849b',
  },
  scrollArea: {
    flex: 1,
  },
  sectionBlock: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4a5568',
    letterSpacing: 1.2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  activeMenuItem: {
    backgroundColor: '#1e3a5f',
  },
  menuText: {
    fontSize: 13,
    color: '#79849b',
    fontWeight: '500',
    flex: 1,
  },
  activeMenuText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#006c4e',
  },
  newInvestmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#006c4e',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  newInvestmentText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

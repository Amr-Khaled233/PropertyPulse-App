import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes } from '../constants/colors';

// ── Main tabs (always visible) ───────────────────────────────────
const MAIN_TABS = [
  { name: 'home',    icon: 'home',      label: 'Home',    route: '/home' },
  { name: 'search',  icon: 'search',    label: 'Search',  route: '/search' },
  { name: 'ai',      icon: 'smart-toy', label: 'AI',      route: '/ai' },
  { name: 'profile', icon: 'person',    label: 'Profile', route: '/profile' },
];

// ── More sheet items ─────────────────────────────────────────────
type MoreSection = { title: string; items: { label: string; icon: string; route: string }[] };

const MORE_SECTIONS: MoreSection[] = [
  {
    title: 'Invest',
    items: [
      { label: 'Portfolio',     icon: 'pie-chart',     route: '/portfolio' },
      { label: 'Transactions',  icon: 'receipt-long',  route: '/transactions' },
      { label: 'Watchlist',     icon: 'bookmark',      route: '/watchlist' },
      { label: 'Payment',       icon: 'credit-card',   route: '/payment' },
    ],
  },
  {
    title: 'Market',
    items: [
      { label: 'Market Trends', icon: 'trending-up',   route: '/market/trends' },
      { label: 'Analysis',      icon: 'bar-chart',     route: '/analysis' },
      { label: 'Reports',       icon: 'description',   route: '/report' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', icon: 'notifications', route: '/notifications' },
      { label: 'Chat',          icon: 'chat',          route: '/chat' },
      { label: 'Register',      icon: 'app-registration', route: '/register' },
      { label: 'Admin',         icon: 'admin-panel-settings', route: '/admin' },
    ],
  },
];

export const BottomNav = () => {
  const router   = useRouter();
  const pathname = usePathname();
  const insets   = useSafeAreaInsets();
  const [moreOpen, setMoreOpen] = useState(false);

  const navigateTo = (route: string) => {
    setMoreOpen(false);
    router.push(route as any);
  };

  return (
    <>
      {/* ── Bottom Nav Bar ───────────────────────────────────── */}
      <View style={[
        styles.container,
        { paddingBottom: insets.bottom + 8 },
      ]}>
        {MAIN_TABS.map(tab => {
          const isActive = pathname === tab.route;
          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={tab.icon as any}
                size={22}
                color={isActive ? Colors.onSurface : Colors.onSurfaceVariant}
              />
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* More button */}
        <TouchableOpacity
          style={[styles.tab, moreOpen && styles.activeTab]}
          onPress={() => setMoreOpen(true)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="menu"
            size={22}
            color={moreOpen ? Colors.onSurface : Colors.onSurfaceVariant}
          />
          <Text style={[styles.label, moreOpen && styles.activeLabel]}>More</Text>
        </TouchableOpacity>
      </View>

      {/* ── More Bottom Sheet ─────────────────────────────────── */}
      <Modal
        visible={moreOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMoreOpen(false)}
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={() => setMoreOpen(false)} />

        {/* Sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>

          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>All Screens</Text>
            <TouchableOpacity onPress={() => setMoreOpen(false)} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {MORE_SECTIONS.map(section => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.grid}>
                  {section.items.map(item => {
                    const isActive = pathname === item.route;
                    return (
                      <TouchableOpacity
                        key={item.route}
                        style={[styles.gridItem, isActive && styles.gridItemActive]}
                        onPress={() => navigateTo(item.route)}
                        activeOpacity={0.75}
                      >
                        <View style={[
                          styles.gridIconWrap,
                          isActive && styles.gridIconWrapActive,
                        ]}>
                          <MaterialIcons
                            name={item.icon as any}
                            size={22}
                            color={isActive ? '#fff' : Colors.secondary}
                          />
                        </View>
                        <Text style={[
                          styles.gridLabel,
                          isActive && styles.gridLabelActive,
                        ]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // ── Nav bar
  container: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.mobileMargin,
    height: 80,
    zIndex: 50,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
    minHeight: 40,
  },
  activeTab: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSizes.labelSM,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  activeLabel: {
    color: Colors.onSurface,
    fontWeight: '600',
  },

  // ── Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.mobileMargin,
    paddingTop: 12,
    maxHeight: '75%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.outlineVariant,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: FontSizes.headlineSM,
    fontWeight: '700',
    color: Colors.onSurface,
  },

  // ── Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: FontSizes.labelSM,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '22%',
    alignItems: 'center',
    gap: 8,
  },
  gridItemActive: {},
  gridIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.secondaryContainer + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconWrapActive: {
    backgroundColor: Colors.secondary,
  },
  gridLabel: {
    fontSize: FontSizes.labelSM,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  gridLabelActive: {
    color: Colors.secondary,
    fontWeight: '600',
  },
});
// Saved comparisons (on-device) — re-open or delete a saved AI comparison.

import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/common/Screen';
import { AppText } from '../components/common/Text';
import { Card } from '../components/common/Card';
import { ScreenHeader } from '../components/common/Brand';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/theme';
import { savedCompareCache, type SavedCompare } from '../services/api/savedCompareCache';
import { formatDate } from '../utils/formatters';
import { displayTitle } from '../utils/propertyTitle';

export default function SavedComparesScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<SavedCompare[]>([]);

  const load = useCallback(async () => {
    setItems(await savedCompareCache.list());
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function confirmDelete(item: SavedCompare) {
    Alert.alert(t('admin.delete'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: async () => {
          setItems((p) => p.filter((x) => x.id !== item.id));
          await savedCompareCache.remove(item.id);
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScreenHeader title={t('compare.savedTitle')} onBack={() => router.back()} />
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: c.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="git-compare-outline" size={28} color={c.secondary} />
            </View>
            <AppText color="textMuted" center>{t('compare.savedEmpty')}</AppText>
          </View>
        }
        renderItem={({ item }) => {
          const titles = item.result.candidates.map((cn) => displayTitle(cn.property));
          return (
            <Pressable onPress={() => router.push(`/compare?saved=${item.id}`)}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <AppText style={{ fontFamily: fonts.semibold, flex: 1 }}>{t('compare.properties', { count: titles.length })}</AppText>
                  <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={c.danger} />
                  </Pressable>
                </View>
                <AppText variant="caption" color="textMuted" numberOfLines={1}>{titles.join(' · ')}</AppText>
                <AppText color="textSecondary" numberOfLines={2} style={{ marginTop: 8, lineHeight: 20 }}>{item.result.verdict}</AppText>
                <AppText variant="caption" color="textMuted" style={{ marginTop: 8 }}>{formatDate(item.savedAt)}</AppText>
              </Card>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

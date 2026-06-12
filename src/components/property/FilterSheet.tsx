// Bottom-sheet style filter modal for property search — phone-friendly.

import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { AppText } from '../common/Text';
import { Chip } from '../common/Chip';
import { Button } from '../common/Button';
import type { PropertySearchParams, PropertyType } from '../../types/listing';

const CITIES = ['Cairo', 'Giza'];
const ALL_TYPES: PropertyType[] = ['apartment', 'villa', 'house', 'townhouse', 'commercial', 'land'];

interface Props {
  visible: boolean;
  filters: PropertySearchParams;
  towns: string[];
  availableTypes?: string[];
  onApply: (patch: PropertySearchParams) => void;
  onReset: () => void;
  onClose: () => void;
}

export function FilterSheet({ visible, filters, towns, availableTypes, onApply, onReset, onClose }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const [draft, setDraft] = useState<PropertySearchParams>(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const types = (availableTypes && availableTypes.length
    ? ALL_TYPES.filter((x) => availableTypes.includes(x))
    : ALL_TYPES);
  const patch = (p: Partial<PropertySearchParams>) => setDraft((d) => ({ ...d, ...p }));
  const num = (v: string) => (v === '' ? undefined : Number(v));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: c.overlay }} onPress={onClose} />
      <View style={{ backgroundColor: c.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '88%' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 8 }}>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 22 }}>{t('search.filtersTitle')}</AppText>
          <Pressable onPress={onClose} hitSlop={8}><Ionicons name="close" size={24} color={c.text} /></Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 20 }} keyboardShouldPersistTaps="handled">
          <Group label={t('search.city')}>
            <Chip label={t('search.allCities')} selected={!draft.city} onPress={() => patch({ city: undefined, district: undefined })} />
            {CITIES.map((city) => (
              <Chip key={city} label={city} selected={draft.city === city} onPress={() => patch({ city, district: undefined })} />
            ))}
          </Group>

          {towns.length > 0 && (
            <Group label={t('search.area')}>
              <Chip label={t('search.allAreas')} selected={!draft.district} onPress={() => patch({ district: undefined })} />
              {towns.slice(0, 30).map((town) => (
                <Chip key={town} label={town} selected={draft.district === town} onPress={() => patch({ district: town })} />
              ))}
            </Group>
          )}

          <Group label={t('search.type')}>
            <Chip label={t('search.allTypes')} selected={!draft.type} onPress={() => patch({ type: undefined })} />
            {types.map((ty) => (
              <Chip key={ty} label={ty} selected={draft.type === ty} onPress={() => patch({ type: ty })} />
            ))}
          </Group>

          <Group label={t('search.beds')}>
            <Chip label={t('search.any')} selected={draft.bedrooms == null} onPress={() => patch({ bedrooms: undefined })} />
            {[1, 2, 3, 4, 5].map((b) => (
              <Chip key={b} label={`${b}+`} selected={draft.bedrooms === b} onPress={() => patch({ bedrooms: b })} />
            ))}
          </Group>

          <View style={{ gap: 8 }}>
            <AppText variant="label" color="textSecondary">{t('search.priceRange')}</AppText>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <PriceInput placeholder={t('search.minPrice')} value={draft.minPrice} onChange={(v) => patch({ minPrice: num(v) })} c={c} />
              <PriceInput placeholder={t('search.maxPrice')} value={draft.maxPrice} onChange={(v) => patch({ maxPrice: num(v) })} c={c} />
            </View>
          </View>
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: c.border }}>
          <Button label={t('search.reset')} variant="outlined" fullWidth={false} style={{ flex: 1 }} onPress={() => { onReset(); onClose(); }} />
          <Button label={t('search.apply')} fullWidth={false} style={{ flex: 1 }} onPress={() => { onApply(draft); onClose(); }} />
        </View>
      </View>
    </Modal>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <AppText variant="label" color="textSecondary">{label}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
    </View>
  );
}

function PriceInput({ placeholder, value, onChange, c }: { placeholder: string; value?: number; onChange: (v: string) => void; c: { surface: string; border: string; text: string; textMuted: string } }) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={c.textMuted}
      keyboardType="number-pad"
      value={value != null ? String(value) : ''}
      onChangeText={onChange}
      style={{ flex: 1, height: 50, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: 14, color: c.text, fontFamily: fonts.body }}
    />
  );
}

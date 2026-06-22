// Create / edit a property (admin). Maps to adminService create/update.

import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { AppText } from '../common/Text';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Chip } from '../common/Chip';
import { adminService, type PropertyDraft } from '../../services/api/adminService';
import type { Property, PropertyType, ListingStatus } from '../../types/listing';

const TYPES: PropertyType[] = ['apartment', 'villa', 'house', 'townhouse', 'commercial', 'land'];
const STATUSES: ListingStatus[] = ['for_sale', 'for_rent', 'sold', 'off_market'];

interface Props {
  visible: boolean;
  editing: Property | null;
  onClose: () => void;
  onSaved: () => void;
}

function emptyDraft(): PropertyDraft {
  return {
    title: '', type: 'apartment', status: 'for_sale', price: 0, currency: 'EGP',
    areaSqm: 0, bedrooms: 0, bathrooms: 0,
    address: { line1: '', city: 'Cairo', country: 'Egypt' },
    images: [], featured: false, approved: true,
  };
}

export function PropertyFormModal({ visible, editing, onClose, onSaved }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const [draft, setDraft] = useState<PropertyDraft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setError(null);
      setDraft(editing ? { ...editing } as PropertyDraft : emptyDraft());
    }
  }, [visible, editing]);

  const set = (p: Partial<PropertyDraft>) => setDraft((d) => ({ ...d, ...p }));
  const setAddr = (p: Partial<PropertyDraft['address']>) => setDraft((d) => ({ ...d, address: { ...d.address, ...p } }));
  const numField = (v: string) => Number(v) || 0;

  async function save() {
    setError(null);
    if (!draft.title.trim()) return setError(t('admin.titleRequired'));
    setSaving(true);
    try {
      if (editing) await adminService.updateProperty(editing.id, draft);
      else await adminService.createProperty(draft);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: c.overlay }} onPress={onClose} />
      <View style={{ backgroundColor: c.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '92%' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 8 }}>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 22 }}>{editing ? t('admin.editProperty') : t('admin.newProperty')}</AppText>
          <Pressable onPress={onClose} hitSlop={8}><Ionicons name="close" size={24} color={c.text} /></Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Input label={t('admin.fTitle')} value={draft.title} onChangeText={(v) => set({ title: v })} />

          <View style={{ gap: 8 }}>
            <AppText variant="label" color="textSecondary">{t('search.type')}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TYPES.map((ty) => <Chip key={ty} label={t(`propertyType.${ty}`)} selected={draft.type === ty} onPress={() => set({ type: ty })} />)}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <AppText variant="label" color="textSecondary">{t('admin.status')}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {STATUSES.map((st) => <Chip key={st} label={t(`listingStatus.${st}`)} selected={draft.status === st} onPress={() => set({ status: st })} />)}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Input label={t('admin.fPrice')} keyboardType="number-pad" value={draft.price ? String(draft.price) : ''} onChangeText={(v) => set({ price: numField(v) })} /></View>
            <View style={{ flex: 1 }}><Input label={t('admin.fArea')} keyboardType="number-pad" value={draft.areaSqm ? String(draft.areaSqm) : ''} onChangeText={(v) => set({ areaSqm: numField(v) })} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Input label={t('detail.beds')} keyboardType="number-pad" value={draft.bedrooms ? String(draft.bedrooms) : ''} onChangeText={(v) => set({ bedrooms: numField(v) })} /></View>
            <View style={{ flex: 1 }}><Input label={t('detail.baths')} keyboardType="number-pad" value={draft.bathrooms ? String(draft.bathrooms) : ''} onChangeText={(v) => set({ bathrooms: numField(v) })} /></View>
          </View>

          <Input label={t('admin.fAddress')} value={draft.address.line1} onChangeText={(v) => setAddr({ line1: v })} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Input label={t('search.city')} value={draft.address.city} onChangeText={(v) => setAddr({ city: v })} /></View>
            <View style={{ flex: 1 }}><Input label={t('search.area')} value={draft.address.state ?? ''} onChangeText={(v) => setAddr({ state: v })} /></View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText style={{ fontFamily: fonts.medium }}>{t('admin.featured')}</AppText>
            <Switch value={!!draft.featured} onValueChange={(v) => set({ featured: v })} trackColor={{ true: c.secondary }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText style={{ fontFamily: fonts.medium }}>{t('admin.approved')}</AppText>
            <Switch value={!!draft.approved} onValueChange={(v) => set({ approved: v })} trackColor={{ true: c.secondary }} />
          </View>

          {error && <AppText variant="caption" color="danger">{error}</AppText>}
          <Button label={t('common.save')} onPress={save} loading={saving} />
        </ScrollView>
      </View>
    </Modal>
  );
}

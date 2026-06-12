// Contact / request-viewing form → POST /inquiries.

import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { AppText } from '../common/Text';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Chip } from '../common/Chip';
import { useAuthStore } from '../../store/authStore';
import { inquiryService } from '../../services/api/inquiryService';
import type { InquiryKind } from '../../types/inquiry';

interface Props {
  visible: boolean;
  propertyId: string;
  onClose: () => void;
}

export function InquiryModal({ visible, propertyId, onClose }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [kind, setKind] = useState<InquiryKind>('viewing_request');
  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!name.trim()) return setError(t('inquiry.nameRequired'));
    setLoading(true);
    try {
      await inquiryService.create({ kind, name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, message: message.trim() || undefined, propertyId });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setDone(false);
    setMessage('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={{ flex: 1, backgroundColor: c.overlay }} onPress={close} />
      <View style={{ backgroundColor: c.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '90%' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 8 }}>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 22 }}>{t('inquiry.title')}</AppText>
          <Pressable onPress={close} hitSlop={8}><Ionicons name="close" size={24} color={c.text} /></Pressable>
        </View>

        {done ? (
          <View style={{ padding: 32, alignItems: 'center', gap: 12 }}>
            <Ionicons name="checkmark-circle" size={56} color={c.success} />
            <AppText style={{ fontFamily: fonts.serif, fontSize: 20 }} center>{t('inquiry.sent')}</AppText>
            <AppText color="textMuted" center>{t('inquiry.sentBody')}</AppText>
            <Button label={t('common.done')} onPress={close} style={{ marginTop: 8 }} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label={t('inquiry.viewing')} selected={kind === 'viewing_request'} onPress={() => setKind('viewing_request')} />
              <Chip label={t('inquiry.contact')} selected={kind === 'contact_message'} onPress={() => setKind('contact_message')} />
            </View>
            <Input label={t('inquiry.name')} icon="person-outline" value={name} onChangeText={setName} />
            <Input label={t('inquiry.email')} icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Input label={t('inquiry.phone')} icon="call-outline" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <Input label={t('inquiry.message')} icon="chatbubble-outline" multiline value={message} onChangeText={setMessage} style={{ minHeight: 80, textAlignVertical: 'top' }} />
            {error && <AppText variant="caption" color="danger">{error}</AppText>}
            <Button label={t('inquiry.submit')} onPress={submit} loading={loading} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

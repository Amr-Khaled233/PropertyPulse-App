// Role-aware notifications feed + per-role "seen" tracking (local).
//   Admin    → recent inquiries + new users (merged, newest first, capped).
//   Investor → admin updates on the user's OWN inquiries (incl. 'deleted').
// Each item has a `sig` (signature): admin items notify once ("exists"),
// investor items re-notify whenever the inquiry status changes.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminService } from './adminService';
import { inquiryService } from './inquiryService';
import type { Inquiry, InquiryStatus } from '../../types/inquiry';
import type { UserProfile } from '../../types/user';

export interface NotifItem {
  id: string;
  sig: string;
  titleKey: string; // i18n key
  detail: string;
  date: string;
  tag?: 'inquiry' | 'user'; // admin feed tag
  status?: InquiryStatus; // investor status pill
  countable: boolean;
}

export type NotifRole = 'admin' | 'investor';

const KIND_KEY: Record<string, string> = {
  buyer_inquiry: 'notif.kind.buyer_inquiry',
  viewing_request: 'notif.kind.viewing_request',
  contact_message: 'notif.kind.contact_message',
  application: 'notif.kind.application',
};

export async function getFeed(role: NotifRole): Promise<NotifItem[]> {
  if (role === 'admin') {
    const [inq, usr] = await Promise.all([
      adminService.listInquiries().catch(() => [] as Inquiry[]),
      adminService.listUsers().catch(() => [] as UserProfile[]),
    ]);
    const inqItems: NotifItem[] = inq.map((i) => ({
      id: `inq_${i.id}`,
      sig: 'exists',
      titleKey: 'notif.adm.newInquiry',
      detail: `${i.name} · ${kindLabelRaw(i.kind)}${i.message ? ` — ${i.message}` : ''}`,
      date: i.createdAt,
      tag: 'inquiry',
      countable: true,
    }));
    const usrItems: NotifItem[] = usr.map((u) => ({
      id: `usr_${u.id}`,
      sig: 'exists',
      titleKey: 'notif.adm.newUser',
      detail: u.fullName || u.email,
      date: u.createdAt,
      tag: 'user',
      countable: true,
    }));
    return [...inqItems, ...usrItems]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 40);
  }

  // investor
  const list = await inquiryService.getMyInquiries().catch(() => [] as Inquiry[]);
  return list.map((i) => ({
    id: i.id,
    sig: i.status,
    titleKey: KIND_KEY[i.kind] ?? 'notif.kind.contact_message',
    detail: i.message ?? '',
    date: i.createdAt,
    status: i.status,
    countable: i.status !== 'new', // a fresh self-submission isn't a notification
  }));
}

function kindLabelRaw(kind: string): string {
  return kind.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function seenKey(role: NotifRole): string {
  return role === 'admin' ? 'notif_seen_admin' : 'notif_seen_investor';
}

async function loadSeen(role: NotifRole): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(seenKey(role));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function saveSeen(role: NotifRole, map: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(seenKey(role), JSON.stringify(map));
  } catch {
    /* best-effort */
  }
}

export async function countUnseen(items: NotifItem[], role: NotifRole): Promise<number> {
  const seen = await loadSeen(role);
  return items.filter((it) => it.countable && seen[it.id] !== it.sig).length;
}

export async function markSeen(items: NotifItem[], role: NotifRole): Promise<void> {
  const seen = await loadSeen(role);
  for (const it of items) seen[it.id] = it.sig;
  await saveSeen(role, seen);
}

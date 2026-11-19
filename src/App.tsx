import React, { useState, useMemo, type FormEvent } from 'react';

// ==========================================
// ★ Google Apps Script (GAS) Web API URL
// ==========================================
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxk4thIeXyE39bL8bEQplwd84oWcWO8J4NHZFbr7vPvHgUj08yRBB2h9xQnCvyFckYzNA/exec';

// ==========================================
// 1. 型定義 (TypeScript)
// ==========================================
type UserRole = 'staff' | 'center_admin' | 'super_admin';
type ShiftSubTab = 'confirmed' | 'submit' | 'history';
type CenterTab = 'shift' | 'skills' | 'absence';
type SuperAdminTab = 'overview' | 'skills' | 'likes';
type SkillStatus = 'none' | 'pending' | 'approved';
type CallSubTab = 'call' | 'absence';

interface UserProfile {
  id: string;
  name: string;
  centerId: string;
  center: string;
  role: UserRole;
  hourlyWage: number;
  monthlyLikeLimit: number;
}

interface ConfirmedShiftItem {
  id: string;
  date: string;
  dayOfWeek: string;
  timeRange: string;
  task: string;
}

interface AbsenceReport {
  id: number;
  center: string;
  userId: string;
  userName: string;
  targetDate: string;
  type: '当日欠勤' | '遅刻' | '早退';
  reason: string;
  note: string;
  reportedAt: string;
}

interface WorkRecord {
  date: string;
  minutes: number;
  timeRange: string;
}

interface MonthData {
  monthLabel: string;
  records: WorkRecord[];
}

interface ActiveCall {
  id: number;
  targetName: string;
  reasonLabel: string;
  priority: string;
  color: string;
  calledAt: string;
}

interface SkillTier {
  name: string;
  level: string;
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
  barColor: string;
  badgeBg: string;
}

interface CenterSummary {
  id: string;
  name: string;
  region: string;
  staffCount: number;
  submittedCount: number;
  fillRate: number;
  skillRate: number;
  avgSkills: number;
  likeUsageRate: number;
  alert: string | null;
}

interface PendingSkillApproval {
  id: number;
  staffName: string;
  skillName: string;
  appliedAt: string;
}

interface CallReason {
  id: number;
  label: string;
  priority: string;
  color: string;
}

interface LikeMessage {
  id: number;
  center: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  text: string;
  sentAt: string;
}

interface MessageGroup {
  label: string;
  options: string[];
}

interface PersonItem {
  id: string;
  name: string;
  center?: string;
}

interface SvgIconProps {
  path: string;
}

interface IconChevronDownProps {
  open: boolean;
}

interface FastLikeFormProps {
  sentCount: number;
  monthlyLikeLimit: number;
  targetList: PersonItem[];
  messageGroups: MessageGroup[];
  onSend: (targetId: string, message: string) => void;
}

interface SkillItem {
  full: string;
  label: string;
  icon: string;
}

interface NextTierInfo {
  nextName: string;
  nextLevel: string;
  remaining: number;
}

// ==========================================
// 2. マスターデータ（初期値・デモフォールバック用）
// ==========================================
const CENTERS_DATA: CenterSummary[] = [
  { id: 'c150',  name: '千歳',   region: '北海道', staffCount: 30,  submittedCount: 28,  fillRate: 93, skillRate: 68, avgSkills: 4.8, likeUsageRate: 85, alert: null },
  { id: 'c210',  name: '青森',   region: '東北',   staffCount: 9,   submittedCount: 8,   fillRate: 89, skillRate: 72, avgSkills: 5.1, likeUsageRate: 90, alert: null },
  { id: 'c440',  name: '宮城',   region: '東北',   staffCount: 31,  submittedCount: 29,  fillRate: 94, skillRate: 65, avgSkills: 4.5, likeUsageRate: 78, alert: null },
  { id: 'c510',  name: '秋田',   region: '東北',   staffCount: 13,  submittedCount: 12,  fillRate: 92, skillRate: 59, avgSkills: 4.0, likeUsageRate: 70, alert: null },
  { id: 'c710',  name: '郡山',   region: '東北',   staffCount: 18,  submittedCount: 16,  fillRate: 89, skillRate: 61, avgSkills: 4.2, likeUsageRate: 75, alert: null },
  { id: 'c920',  name: '佐野',   region: '関東',   staffCount: 100, submittedCount: 92,  fillRate: 92, skillRate: 74, avgSkills: 5.3, likeUsageRate: 88, alert: null },
  { id: 'c1170', name: '入間',   region: '関東',   staffCount: 114, submittedCount: 105, fillRate: 92, skillRate: 70, avgSkills: 4.9, likeUsageRate: 82, alert: null },
  { id: 'c1210', name: '千葉',   region: '関東',   staffCount: 65,  submittedCount: 48,  fillRate: 74, skillRate: 48, avgSkills: 3.2, likeUsageRate: 55, alert: 'フォーク乗務不足' },
  { id: 'c1410', name: '伊勢原', region: '関東',   staffCount: 153, submittedCount: 142, fillRate: 93, skillRate: 76, avgSkills: 5.6, likeUsageRate: 91, alert: null },
  { id: 'c1510', name: '新潟',   region: '甲信越', staffCount: 20,  submittedCount: 19,  fillRate: 95, skillRate: 66, avgSkills: 4.6, likeUsageRate: 80, alert: null },
  { id: 'c1710', name: '金沢',   region: '北陸',   staffCount: 9,   submittedCount: 8,   fillRate: 89, skillRate: 70, avgSkills: 4.7, likeUsageRate: 85, alert: null },
  { id: 'c2030', name: '長野',   region: '甲信越', staffCount: 25,  submittedCount: 23,  fillRate: 92, skillRate: 64, avgSkills: 4.3, likeUsageRate: 76, alert: null },
  { id: 'c2410', name: '四日市', region: '東海',   staffCount: 75,  submittedCount: 70,  fillRate: 93, skillRate: 71, avgSkills: 5.0, likeUsageRate: 84, alert: null },
  { id: 'c2710', name: '大阪',   region: '関西',   staffCount: 34,  submittedCount: 31,  fillRate: 91, skillRate: 69, avgSkills: 4.8, likeUsageRate: 82, alert: null },
  { id: 'c2760', name: '岸和田', region: '関西',   staffCount: 118, submittedCount: 82,  fillRate: 69, skillRate: 52, avgSkills: 3.5, likeUsageRate: 60, alert: '出庫人員不足' },
  { id: 'c3410', name: '広島',   region: '中国',   staffCount: 22,  submittedCount: 20,  fillRate: 91, skillRate: 67, avgSkills: 4.6, likeUsageRate: 81, alert: null },
  { id: 'c3730', name: 'さぬき', region: '四国',   staffCount: 25,  submittedCount: 23,  fillRate: 92, skillRate: 63, avgSkills: 4.4, likeUsageRate: 75, alert: null },
  { id: 'c4010', name: '朝倉',   region: '九州',   staffCount: 145, submittedCount: 133, fillRate: 92, skillRate: 75, avgSkills: 5.4, likeUsageRate: 89, alert: null },
  { id: 'c4610', name: '鹿児島', region: '九州',   staffCount: 23,  submittedCount: 21,  fillRate: 91, skillRate: 66, avgSkills: 4.5, likeUsageRate: 79, alert: null },
];

const CALL_REASONS: CallReason[] = [
  { id: 1, label: '【緊急】 怪我・トラブル', priority: '高', color: 'bg-red-500 text-white' },
  { id: 2, label: '【優先】 機器不良', priority: '中', color: 'bg-amber-500 text-white' },
  { id: 3, label: '【確認】 在庫確認', priority: '低', color: 'bg-blue-500 text-white' },
  { id: 4, label: '【相談】 その他', priority: '低', color: 'bg-slate-600 text-white' },
];

const ABSENCE_REASONS = [
  '体調不良・発熱',
  '交通機関の遅延・運休',
  '家庭の事情・急用',
  '怪我・通院',
  'その他',
];

const SKILL_DEFINITIONS: Array<{ category: string; label: string; icon: string }> = [
  { category: '発注', label: '入力業務', icon: '💻' },
  { category: '発注', label: '新発注補助Ｓ操作', icon: '🖥️' },
  { category: '発注', label: '直送発注', icon: '🚚' },
  { category: '発注', label: '移動対応', icon: '🔄' },
  { category: '入荷', label: '入荷照合', icon: '📥' },
  { category: '棚入', label: '棚入', icon: '📦' },
  { category: '棚入', label: '棚番メンテナンス', icon: '🏷️' },
  { category: '棚入', label: 'セット組み・得意先依頼加工', icon: '🛠️' },
  { category: '出荷', label: '受注引当（集計）', icon: '📊' },
  { category: '出荷', label: 'ピッキング ＨＴ', icon: '📱' },
  { category: '出荷', label: 'ピッキングリスト', icon: '📋' },
  { category: '出荷', label: 'ケースラベル', icon: '🏷️' },
  { category: '出荷', label: '不定形 ＨＴ', icon: '📦' },
  { category: '返品', label: '店返品作業', icon: '↩️' },
  { category: '返品', label: '店返品棚戻', icon: '🔙' },
  { category: '返品', label: '仕入れ返品作業', icon: '📦' },
  { category: '棚卸', label: 'カウント', icon: '🔢' },
  { category: '事務業務', label: '仕入', icon: '📑' },
  { category: '事務業務', label: '売上', icon: '🧾' },
  { category: '事務業務', label: '出荷事務', icon: '📂' },
  { category: 'その他', label: 'フォークリフト乗務', icon: '🚜' },
];

const SKILL_LIST: string[] = SKILL_DEFINITIONS.map(s => `【${s.category}】${s.label}`);

const DEFAULT_STAFF_USER: UserProfile = {
  id: '1001',
  name: '佐々木 深',
  centerId: 'c1410',
  center: '伊勢原',
  role: 'staff',
  hourlyWage: 1200,
  monthlyLikeLimit: 3,
};

const SHIFT_SCHEDULE = {
  targetWeek: '2026年11月23日(月) 〜 11月29日(日)',
  deadline: '2026年11月20日(金) 23:59',
};

const INITIAL_CONFIRMED_SHIFTS: ConfirmedShiftItem[] = [
  { id: 'cs1', date: '2026-11-19', dayOfWeek: '木', timeRange: '09:00 〜 18:00 (休1h)', task: '【出荷】ピッキング ＨＴ' },
  { id: 'cs2', date: '2026-11-20', dayOfWeek: '金', timeRange: '09:00 〜 18:00 (休1h)', task: '【入荷】入荷照合' },
  { id: 'cs3', date: '2026-11-21', dayOfWeek: '土', timeRange: '10:00 〜 16:00 (休1h)', task: '【棚入】棚入' },
  { id: 'cs4', date: '2026-11-23', dayOfWeek: '月', timeRange: '09:00 〜 18:00 (休1h)', task: '【出荷】ピッキング ＨＴ' },
  { id: 'cs5', date: '2026-11-25', dayOfWeek: '水', timeRange: '09:00 〜 17:00 (休1h)', task: '【出荷】受注引当（集計）' },
];

const INITIAL_STAFF_LIST: PersonItem[] = [
  { id: '2001', name: '木村 裕一', center: '伊勢原' },
  { id: '2002', name: '島木 一友', center: '伊勢原' },
  { id: '2003', name: '猪熊 啓吾', center: '伊勢原' },
  { id: '2004', name: '岩田 能啓', center: '伊勢原' },
];

const INITIAL_LIKE_TARGETS: PersonItem[] = [
  { id: '1002', name: '堀田 大暉' },
  { id: '1003', name: '五十嵐 聖己' },
  { id: '1004', name: '奥山 政幸' },
  { id: '1005', name: '湯谷 杏吏' },
  { id: '1006', name: '菅田 真啓' },
  { id: '1007', name: '松井 蓮之' },
  { id: '1008', name: '中田 有祐' },
  { id: '2001', name: '木村 裕一（社員）' },
];

const INITIAL_MESSAGE_GROUPS: MessageGroup[] = [
  {
    label: '業務サポート',
    options: [
      'ピッキングのフォロー、助かりました！',
      '重い荷物の運搬を手伝ってくれてありがとう！',
      '梱包作業のスピードアップ、感謝です！',
      '忙しい時の応援・ヘルプ、ありがとう！',
      'トラブルへの素早い対応、助かりました！',
    ]
  },
  {
    label: '気遣い・環境',
    options: [
      '備品（段ボールやテープ等）の補充、ありがとう！',
      '作業スペースの片付け・清掃、感謝です！',
      '台車やカゴ車の整理整頓、ありがとう！',
      '周囲への声掛けや気配り、嬉しかったです！',
      '安全確認や声出しをしてくれて助かりました！',
    ]
  },
  {
    label: '教育・連携',
    options: [
      '新しい作業のやり方を丁寧に教えてくれてありがとう！',
      '新人さんへの優しいフォロー、助かります！',
      'ダブルチェックを一緒にしてくれて安心できました！',
      'わかりやすい引き継ぎ・連絡、助かりました！',
      '作業のコツを教えてくれてありがとう！',
    ]
  },
  {
    label: '態度・姿勢',
    options: [
      'いつも明るい挨拶で、現場が和みます！',
      'テキパキとした作業姿勢、とても頼もしいです！',
      'いつも丁寧で正確な作業、素晴らしいです！',
      '周囲をよく見て自発的に動いてくれてありがとう！',
      '今日も一日、一緒に頑張ってくれて感謝です！',
    ]
  }
];

const SKILL_TIERS: SkillTier[] = [
  { name: 'マスター', level: 'S級', range: '18個以上', min: 18, max: 21, count: 52, percentage: 5.1, barColor: 'bg-amber-500', badgeBg: 'bg-amber-100 text-amber-800 border-amber-300' },
  { name: 'プロ', level: 'A級', range: '14〜17個', min: 14, max: 17, count: 160, percentage: 15.5, barColor: 'bg-purple-500', badgeBg: 'bg-purple-100 text-purple-800 border-purple-300' },
  { name: 'アドバンス', level: 'B級', range: '10〜13個', min: 10, max: 13, count: 415, percentage: 40.3, barColor: 'bg-indigo-500', badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { name: 'スタンダード', level: 'C級', range: '6〜9個', min: 6, max: 9, count: 322, percentage: 31.3, barColor: 'bg-blue-500', badgeBg: 'bg-blue-100 text-blue-800 border-blue-300' },
  { name: 'エントリー', level: 'D級', range: '0～5個', min: 0, max: 5, count: 80, percentage: 7.8, barColor: 'bg-slate-400', badgeBg: 'bg-slate-100 text-slate-700 border-slate-300' },
];

const SKILL_COUNT_DISTRIBUTION: Record<number, number> = {
  21: 5, 20: 10, 19: 15, 18: 22,
  17: 30, 16: 40, 15: 45, 14: 45,
  13: 80, 12: 110, 11: 115, 10: 110,
  9: 90, 8: 90, 7: 72, 6: 70,
  5: 25, 4: 20, 3: 15, 2: 10, 1: 6, 0: 4
};

const WORK_HISTORY: Record<string, MonthData> = {
  '2026-11': {
    monthLabel: '2026年11月度',
    records: [
      { date: '11/02 (月)', minutes: 480, timeRange: '9:00 - 18:00 (休1h)' },
      { date: '11/04 (水)', minutes: 450, timeRange: '9:00 - 17:30 (休1h)' },
      { date: '11/06 (金)', minutes: 495, timeRange: '9:00 - 18:15 (休1h)' },
      { date: '11/09 (月)', minutes: 420, timeRange: '9:00 - 17:00 (休1h)' },
      { date: '11/11 (水)', minutes: 480, timeRange: '9:00 - 18:00 (休1h)' },
      { date: '11/13 (金)', minutes: 465, timeRange: '9:00 - 17:45 (休1h)' },
      { date: '11/16 (月)', minutes: 480, timeRange: '9:00 - 18:00 (休1h)' },
      { date: '11/18 (水)', minutes: 440, timeRange: '9:00 - 17:20 (休1h)' },
    ]
  },
  '2026-10': {
    monthLabel: '2026年10月度',
    records: [
      { date: '10/01 (木)', minutes: 455, timeRange: '9:00 - 17:35 (休1h)' },
      { date: '10/02 (金)', minutes: 492, timeRange: '9:00 - 18:12 (休1h)' },
      { date: '10/05 (月)', minutes: 405, timeRange: '10:00 - 17:45 (休1h)' },
      { date: '10/07 (水)', minutes: 440, timeRange: '9:00 - 17:20 (休1h)' },
      { date: '10/08 (木)', minutes: 470, timeRange: '9:00 - 17:50 (休1h)' },
      { date: '10/09 (金)', minutes: 315, timeRange: '11:00 - 17:15 (休1h)' },
      { date: '10/12 (月)', minutes: 485, timeRange: '9:00 - 18:05 (休1h)' },
      { date: '10/14 (水)', minutes: 450, timeRange: '9:00 - 17:30 (休1h)' },
      { date: '10/16 (金)', minutes: 495, timeRange: '9:00 - 18:15 (休1h)' },
    ]
  },
  '2026-09': {
    monthLabel: '2026年9月度',
    records: [
      { date: '09/01 (火)', minutes: 435, timeRange: '9:00 - 17:15 (休1h)' },
      { date: '09/03 (木)', minutes: 440, timeRange: '9:00 - 17:20 (休1h)' },
      { date: '09/04 (金)', minutes: 490, timeRange: '9:00 - 18:10 (休1h)' },
      { date: '09/07 (月)', minutes: 430, timeRange: '9:00 - 17:10 (休1h)' },
      { date: '09/10 (木)', minutes: 485, timeRange: '9:00 - 18:05 (休1h)' },
      { date: '09/15 (火)', minutes: 395, timeRange: '10:00 - 17:35 (休1h)' },
    ]
  },
};

const formatMinutes = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}時間${m}分` : `${h}時間`;
};

const calculateMinuteSalary = (minutes: number, wage: number): number => {
  return Math.floor((wage / 60) * minutes);
};

// ==========================================
// 3. 共通コンポーネント
// ==========================================
const SvgIcon: React.FC<SvgIconProps> = ({ path }) => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

const IconEye: React.FC = () => (
  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const IconEyeOff: React.FC = () => (
  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const IconChevronDown: React.FC<IconChevronDownProps> = ({ open }) => (
  <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const NAV_TABS = [
  { id: 'call', label: '呼出・欠勤', color: 'text-red-600', path: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { id: 'shift', label: 'シフト・給与', color: 'text-indigo-600', path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'likes', label: 'いいね', color: 'text-rose-600', path: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { id: 'skills', label: 'スキル/分布', color: 'text-amber-600', path: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
];

const FastLikeForm: React.FC<FastLikeFormProps> = ({ sentCount, monthlyLikeLimit, targetList, messageGroups, onSend }) => {
  const [selectedTarget, setSelectedTarget] = useState<string>(targetList[0]?.id || '');
  const [message, setMessage] = useState<string>('');

  const effectiveTarget = targetList.some(t => t.id === selectedTarget) ? selectedTarget : (targetList[0]?.id || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!effectiveTarget) {
      alert('送信相手を選択してください。');
      return;
    }
    if (!message) {
      alert('メッセージを選択してください。');
      return;
    }
    onSend(effectiveTarget, message);
    setMessage('');
  };

  if (sentCount >= monthlyLikeLimit) {
    return (
      <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-xs font-medium">
        今月の送信上限数（{monthlyLikeLimit}件）に達しました。来月また送信できます。
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full">
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">送信相手（自センターメンバー）</label>
        <select
          value={effectiveTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm focus:border-indigo-500 focus:bg-white"
        >
          {targetList.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">感謝のメッセージ（定型文から選択）</label>
        <select
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm focus:border-indigo-500 focus:bg-white"
          required
        >
          <option value="" disabled>メッセージを選択してください</option>
          {messageGroups.map((group, idx) => (
            <optgroup key={idx} label={`【${group.label}】`}>
              {group.options.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-lg text-sm shadow active:scale-95 transition-all"
      >
        感謝のカードを直接送る（いいね +1）
      </button>
    </form>
  );
};

// ==========================================
// 4. アプリケーション本体
// ==========================================
export default function App() {
  // ログイン状態（本番は未ログインから開始）
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginId, setLoginId] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // ユーザー情報とマスターデータ（スプレッドシート連携で更新される）
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_STAFF_USER);
  const [staffList, setStaffList] = useState<PersonItem[]>(INITIAL_STAFF_LIST);
  const [likeTargetList, setLikeTargetList] = useState<PersonItem[]>(INITIAL_LIKE_TARGETS);
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>(INITIAL_MESSAGE_GROUPS);
  const [confirmedShifts, setConfirmedShifts] = useState<ConfirmedShiftItem[]>(INITIAL_CONFIRMED_SHIFTS);

  // 画面タブ状態
  const [currentTab, setCurrentTab] = useState<string>('shift');
  const [callSubTab, setCallSubTab] = useState<CallSubTab>('call');
  const [shiftSubTab, setShiftSubTab] = useState<ShiftSubTab>('confirmed');
  const [centerTab, setCenterTab] = useState<CenterTab>('shift');
  const [superAdminTab, setSuperAdminTab] = useState<SuperAdminTab>('overview');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // 給与表示トグル（実績金額のみに使用）
  const [isMoneyVisible, setIsMoneyVisible] = useState<boolean>(false);
  const [isDeadlinePassed] = useState<boolean>(false);

  // 社員呼び出し関連
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callTargetStaff, setCallTargetStaff] = useState<string>('all');

  // 当日欠勤・遅刻連絡関連
  const [absenceDate, setAbsenceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [absenceType, setAbsenceType] = useState<'当日欠勤' | '遅刻' | '早退'>('当日欠勤');
  const [absenceReason, setAbsenceReason] = useState<string>(ABSENCE_REASONS[0]);
  const [absenceNote, setAbsenceNote] = useState<string>('');
  const [absenceReports, setAbsenceReports] = useState<AbsenceReport[]>([
    {
      id: 1,
      center: '伊勢原',
      userId: '1004',
      userName: '奥山 政幸',
      targetDate: new Date().toISOString().split('T')[0],
      type: '遅刻',
      reason: '交通機関の遅延・運休',
      note: '電車遅延のため30分ほど遅れて到着します。',
      reportedAt: '08:15',
    },
  ]);

  // いいね（サンクスカード）関連（所長承認なし・即時反映）
  const [sentCount, setSentCount] = useState<number>(1);
  const [allMessages, setAllMessages] = useState<LikeMessage[]>([
    { id: 1, center: '伊勢原', fromId: '1002', fromName: '堀田 大暉', toId: '1001', toName: '佐々木 深', text: '朝の荷卸し手伝っていただき助かりました！', sentAt: '11/18 08:45' },
    { id: 2, center: '伊勢原', fromId: '1004', fromName: '奥山 政幸', toId: '1001', toName: '佐々木 深', text: 'ピッキングのフォロー、助かりました！', sentAt: '11/17 15:20' },
    { id: 3, center: '佐野', fromId: '3001', fromName: '佐藤 健', toId: '3002', toName: '高橋 涼介', text: '忙しい時の応援・ヘルプ、ありがとう！', sentAt: '11/16 14:10' },
  ]);

  // スキル関連
  const [mySkillStatus, setMySkillStatus] = useState<Record<string, SkillStatus>>({
    '【入荷】入荷照合': 'approved',
    '【棚入】棚入': 'approved',
    '【出荷】ピッキング ＨＴ': 'approved'
  });

  const [pendingSkillApprovals, setPendingSkillApprovals] = useState<PendingSkillApproval[]>([
    { id: 101, staffName: '佐々木 深', skillName: '【その他】フォークリフト乗務', appliedAt: '昨日 17:30' },
    { id: 102, staffName: '奥山 政幸', skillName: '【出荷】受注引当（集計）', appliedAt: '本日 09:15' },
  ]);

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({ '出荷': true });

  // 希望シフト入力関連
  const [shiftDates, setShiftDates] = useState<Record<number, number[]>>({});
  const [shiftSubmitted, setShiftSubmitted] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [tempHours, setTempHours] = useState<number[]>([]);
  const HOURS: number[] = [9, 10, 11, 12, 13, 14, 15, 16];
  const TOTAL_DAYS = 30;

  // 勤務実績の月度選択
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');

  // ==========================================
  // GAS API 共通通信ヘルパー
  // ==========================================
  const postToGas = async (action: string, payload: Record<string, unknown>) => {
    if (!GAS_API_URL) return null;
    try {
      const res = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...payload }),
      });
      return await res.json();
    } catch (err) {
      console.error(`GAS通信エラー (${action}):`, err);
      return null;
    }
  };

  // ==========================================
  // ログイン処理（社員番号に応じて権限・画面を自動振り分け）
  // ==========================================
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const id = loginId.trim();
    const pw = loginPassword.trim();

    if (!id || !pw) {
      setLoginError('社員番号とパスワードを入力してください。');
      return;
    }

    setIsLoggingIn(true);

    // 1. GAS_API_URL が設定されている場合はスプレッドシートで認証・データ一括取得
    if (GAS_API_URL) {
      const res = await postToGas('login', { id, password: pw });
      setIsLoggingIn(false);

      if (res && res.success && res.user) {
        const user: UserProfile = res.user;
        setCurrentUser(user);
        if (Array.isArray(res.staffList)) setStaffList(res.staffList);
        if (Array.isArray(res.likeTargets)) {
          // 自分自身を送信相手から除外
          setLikeTargetList(res.likeTargets.filter((t: PersonItem) => t.id !== user.id));
        }
        if (Array.isArray(res.messageGroups) && res.messageGroups.length > 0) {
          setMessageGroups(res.messageGroups);
        }
        if (Array.isArray(res.confirmedShifts)) {
          setConfirmedShifts(res.confirmedShifts);
        }
        if (Array.isArray(res.allMessages)) {
          setAllMessages(res.allMessages);
        }
        if (Array.isArray(res.absenceReports)) {
          setAbsenceReports(res.absenceReports);
        }
        setIsLoggedIn(true);
        return;
      } else {
        setLoginError(res?.message || '社員番号またはパスワードが正しくありません。');
        return;
      }
    }

    // 2. GAS_API_URL 未設定時のローカルデモ認証（テスト用）
    setTimeout(() => {
      setIsLoggingIn(false);
      if (id === 'admin' || id.startsWith('9')) {
        // 本部社員（全センター閲覧）
        setCurrentUser({
          id,
          name: 'SC本部 管理者',
          centerId: 'hq',
          center: 'SC本部',
          role: 'super_admin',
          hourlyWage: 0,
          monthlyLikeLimit: 0,
        });
        setIsLoggedIn(true);
      } else if (id.startsWith('2') || id.startsWith('c')) {
        // センター社員（自センター管理画面のみ）
        const centerObj = CENTERS_DATA.find(c => c.id === id) || CENTERS_DATA.find(c => c.id === 'c1410')!;
        setCurrentUser({
          id,
          name: '木村 裕一',
          centerId: centerObj.id,
          center: centerObj.name,
          role: 'center_admin',
          hourlyWage: 0,
          monthlyLikeLimit: 0,
        });
        setIsLoggedIn(true);
      } else {
        // パート社員（自センターの自分の画面のみ）
        setCurrentUser({
          id,
          name: id === '1001' ? '佐々木 深' : `パート社員 (${id})`,
          centerId: 'c1410',
          center: '伊勢原',
          role: 'staff',
          hourlyWage: 1200,
          monthlyLikeLimit: 3,
        });
        setLikeTargetList(INITIAL_LIKE_TARGETS.filter(t => t.id !== id));
        setIsLoggedIn(true);
      }
    }, 300);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginId('');
    setLoginPassword('');
    setLoginError('');
    setCurrentTab('shift');
  };

  // ==========================================
  // 各種計算ロジック
  // ==========================================
  const skillCategories: Record<string, SkillItem[]> = useMemo(() => {
    const map: Record<string, SkillItem[]> = {};
    SKILL_DEFINITIONS.forEach((s) => {
      const full = `【${s.category}】${s.label}`;
      if (!map[s.category]) {
        map[s.category] = [];
      }
      map[s.category].push({ full, label: s.label, icon: s.icon });
    });
    return map;
  }, []);

  const approvedSkillCount = useMemo(() => {
    return Object.values(mySkillStatus).filter(status => status === 'approved').length;
  }, [mySkillStatus]);

  const currentTier = useMemo(() => {
    const found = SKILL_TIERS.find(t => approvedSkillCount >= t.min && approvedSkillCount <= t.max);
    return found ? found : SKILL_TIERS[SKILL_TIERS.length - 1];
  }, [approvedSkillCount]);

  const rankStats = useMemo(() => {
    const totalWorkers = 1029;
    let higherCount = 0;
    for (let c = 21; c > approvedSkillCount; c--) {
      higherCount += SKILL_COUNT_DISTRIBUTION[c] || 0;
    }
    const overallRank = higherCount + 1;

    let higherInTier = 0;
    for (let c = currentTier.max; c > approvedSkillCount; c--) {
      higherInTier += SKILL_COUNT_DISTRIBUTION[c] || 0;
    }
    const tierRank = higherInTier + 1;

    return {
      overallRank,
      totalWorkers,
      tierRank,
      tierCount: currentTier.count,
    };
  }, [approvedSkillCount, currentTier]);

  const nextTierInfo = useMemo<NextTierInfo | null>(() => {
    const currentIndex = SKILL_TIERS.findIndex(t => t.name === currentTier.name);
    if (currentIndex > 0) {
      const next = SKILL_TIERS[currentIndex - 1];
      const diff = next.min - approvedSkillCount;
      return { nextName: next.name, nextLevel: next.level, remaining: diff };
    }
    return null;
  }, [currentTier, approvedSkillCount]);

  const { totalPlannedHours, totalPlannedDays } = useMemo(() => {
    let hours = 0;
    let days = 0;
    Object.values(shiftDates).forEach((list) => {
      if (Array.isArray(list) && list.length > 0) {
        hours += list.length;
        days += 1;
      }
    });
    return { totalPlannedHours: hours, totalPlannedDays: days };
  }, [shiftDates]);

  const currentMonthData = useMemo(() => {
    return WORK_HISTORY[selectedMonth] || { monthLabel: '', records: [] };
  }, [selectedMonth]);

  const monthlyTotalMinutes = useMemo(() => {
    return currentMonthData.records.reduce((acc, r) => acc + r.minutes, 0);
  }, [currentMonthData]);

  const monthlySalary = useMemo(() => {
    return calculateMinuteSalary(monthlyTotalMinutes, currentUser.hourlyWage);
  }, [monthlyTotalMinutes, currentUser.hourlyWage]);

  const cumulativeStats = useMemo(() => {
    let totalMins = 0;
    Object.values(WORK_HISTORY).forEach(month => {
      totalMins += month.records.reduce((acc, r) => acc + r.minutes, 0);
    });
    return {
      totalMinutes: totalMins,
      totalSalary: calculateMinuteSalary(totalMins, currentUser.hourlyWage)
    };
  }, [currentUser.hourlyWage]);

  const receivedLikes = useMemo(() => {
    return allMessages.filter(m => m.toId === currentUser.id || m.toName === currentUser.name);
  }, [allMessages, currentUser]);

  const displayMoney = (amount: number) => isMoneyVisible ? `¥${amount.toLocaleString()}` : '¥***,***';
  const isSunday = (day: number) => (day - 1) % 7 === 0;

  // ==========================================
  // アクションハンドラ（スプレッドシート同期付き）
  // ==========================================
  const handleShiftSubmit = async () => {
    setShiftSubmitted(true);
    setSyncStatus('スプレッドシートへ保存中...');

    const payload = {
      userId: currentUser.id,
      userName: currentUser.name,
      center: currentUser.center,
      targetWeek: SHIFT_SCHEDULE.targetWeek,
      totalHours: totalPlannedHours,
      totalDays: totalPlannedDays,
      shiftDates,
    };

    const res = await postToGas('submitShift', payload);
    if (res && res.success) {
      setSyncStatus('✓ スプレッドシート同期完了');
    } else {
      setSyncStatus(GAS_API_URL ? '※ オフライン保存済' : '✓ 保存完了（デモモード）');
    }
    setTimeout(() => setSyncStatus(null), 3000);
    alert(`合計 ${totalPlannedDays}日（${totalPlannedHours}時間）で希望シフトを提出しました。`);
  };

  const handleCallStaff = async (reason: CallReason) => {
    const targetName = callTargetStaff === 'all'
      ? `${currentUser.center}センター 社員全員`
      : (staffList.find(s => s.id === callTargetStaff)?.name || '社員');
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setActiveCall({
      id: Date.now(),
      targetName,
      reasonLabel: reason.label,
      priority: reason.priority,
      color: reason.color,
      calledAt: timeStr,
    });

    await postToGas('callStaff', {
      center: currentUser.center,
      fromId: currentUser.id,
      fromName: currentUser.name,
      targetName,
      reason: reason.label,
      priority: reason.priority,
    });
  };

  const handleClearCall = (isResolved: boolean) => {
    setActiveCall(null);
    alert(isResolved ? '社員の対応が完了し、解除されました。' : '呼び出しを取り消しました。');
  };

  const handleAbsenceSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newReport: AbsenceReport = {
      id: Date.now(),
      center: currentUser.center,
      userId: currentUser.id,
      userName: currentUser.name,
      targetDate: absenceDate,
      type: absenceType,
      reason: absenceReason,
      note: absenceNote,
      reportedAt: timeStr,
    };

    setSyncStatus('欠勤・遅刻連絡を送信中...');
    const res = await postToGas('reportAbsence', newReport as unknown as Record<string, unknown>);
    setAbsenceReports(prev => [newReport, ...prev]);
    setAbsenceNote('');
    setSyncStatus(res?.success ? '✓ センター社員へ連絡完了' : '✓ 連絡を送信しました');
    setTimeout(() => setSyncStatus(null), 3000);
    alert(`${absenceDate} の「${absenceType}」連絡を${currentUser.center}センターの社員へ送信しました。`);
  };

  // いいね送信（所長承認なし・本人に直接届く）
  const handleSendLike = async (targetId: string, message: string) => {
    if (targetId === currentUser.id) {
      alert('自分自身には送信できません。');
      return;
    }
    const targetObj = likeTargetList.find(s => s.id === targetId);
    if (!targetObj) return;

    const now = new Date();
    const sentAt = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMessage: LikeMessage = {
      id: Date.now(),
      center: currentUser.center,
      fromId: currentUser.id,
      fromName: currentUser.name,
      toId: targetObj.id,
      toName: targetObj.name,
      text: message,
      sentAt,
    };

    setAllMessages(prev => [newMessage, ...prev]);
    setSentCount(prev => prev + 1);

    await postToGas('sendLike', newMessage as unknown as Record<string, unknown>);
    alert(`${targetObj.name} さんへサンクスカードを直接送信しました！`);
  };

  const handleApproveSkill = (id: number, approve: boolean) => {
    setPendingSkillApprovals(prev => prev.filter(item => item.id !== id));
    alert(approve ? 'スキル習得を承認しました。パートの保有スキルに反映されます。' : '申請を差戻しました。');
  };

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleSkillStatus = (skill: string) => {
    setMySkillStatus(prev => {
      const currentStatus = prev[skill] || 'none';
      let nextStatus: SkillStatus = 'none';
      if (currentStatus === 'none') {
        nextStatus = 'pending';
        alert(`「${skill}」の習得を申請しました。社員の承認をお待ちください。`);
      } else if (currentStatus === 'pending') {
        nextStatus = 'approved';
        alert(`【デモ機能】社員が「${skill}」を承認しました！`);
      } else if (currentStatus === 'approved') {
        nextStatus = 'none';
        alert(`「${skill}」の習得状態を解除しました。`);
      }
      return { ...prev, [skill]: nextStatus };
    });
  };

  const openShiftModal = (day: number) => {
    if (isDeadlinePassed || isSunday(day)) return;
    setSelectedDay(day);
    setTempHours(shiftDates[day] || []);
  };
  const toggleHour = (h: number) => {
    setTempHours(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h].sort((a, b) => a - b));
  };
  const saveHours = () => {
    if (selectedDay !== null) {
      setShiftDates(prev => ({ ...prev, [selectedDay]: tempHours }));
    }
    setSelectedDay(null);
  };

  // ==========================================
  // レンダリング
  // ==========================================
  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-slate-100 select-none overflow-hidden text-slate-800 relative">

      {/* ==========================================
          ログイン画面（社員番号による権限自動判定）
         ========================================== */}
      {!isLoggedIn && (
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 bg-slate-900">
          <div className="bg-white w-full p-6 rounded-2xl shadow-xl border border-slate-200">
            <div className="text-center mb-6">
              <div className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2">
                LOGISTICS PORTAL
              </div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">シフト・スキル統合管理</h1>
              <p className="text-xs text-slate-500 mt-1">社員番号とパスワードでログインしてください</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">社員番号（ID）</label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="例: 1001"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:border-indigo-500 focus:bg-white transition-colors"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">パスワード</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:border-indigo-500 focus:bg-white transition-colors"
                  autoComplete="current-password"
                />
              </div>

              {loginError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 text-center">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-colors mt-2"
              >
                {isLoggingIn ? '認証中...' : 'ログイン'}
              </button>
            </form>

            {/* 動作確認用クイック入力（不要になったら削除可能） */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 mb-2 text-center">【テスト用 クイックID入力】</p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => { setLoginId('1001'); setLoginPassword('pass1234'); }}
                  className="text-[10px] bg-slate-100 hover:bg-indigo-50 text-slate-700 font-bold py-1.5 px-1 rounded border border-slate-200"
                >
                  👤 パート<br /><span className="font-mono text-[9px] text-slate-400">ID: 1001</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginId('2001'); setLoginPassword('pass1234'); }}
                  className="text-[10px] bg-slate-100 hover:bg-amber-50 text-slate-700 font-bold py-1.5 px-1 rounded border border-slate-200"
                >
                  🏢 センター社員<br /><span className="font-mono text-[9px] text-slate-400">ID: 2001</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginId('9001'); setLoginPassword('pass1234'); }}
                  className="text-[10px] bg-slate-100 hover:bg-emerald-50 text-slate-700 font-bold py-1.5 px-1 rounded border border-slate-200"
                >
                  🌐 本部社員<br /><span className="font-mono text-[9px] text-slate-400">ID: 9001</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ログイン後画面（権限ごとに厳格に分離）
         ========================================== */}
      {isLoggedIn && (
        <>
          {/* 1時間単位選択モーダル */}
          {selectedDay !== null && (
            <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center sm:p-4 pb-0">
              <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl p-5 shadow-2xl">
                <h3 className="font-bold text-lg mb-4 text-center text-slate-800">{selectedDay}日 の希望時間</h3>
                <div className="grid grid-cols-2 gap-2 mb-4 w-full">
                  {HOURS.map(h => {
                    const isSelected = tempHours.includes(h);
                    return (
                      <button key={h} onClick={() => toggleHour(h)} className={`py-2 rounded-lg text-xs font-bold border transition-colors ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {h}:00 - {h + 1}:00
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between space-x-2 mb-5 w-full">
                  <button onClick={() => setTempHours([...HOURS])} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg text-xs font-bold transition">フル一括 (8h)</button>
                  <button onClick={() => setTempHours([])} className="flex-1 bg-slate-100 text-slate-500 py-2 rounded-lg text-xs font-bold border border-slate-200">クリア (休み)</button>
                </div>
                <div className="flex space-x-2.5 w-full">
                  <button onClick={() => setSelectedDay(null)} className="flex-1 border-2 border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-bold">キャンセル</button>
                  <button onClick={saveHours} className="flex-[2] bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-transform">決定 ({tempHours.length}時間)</button>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              画面1：パート個人画面（自センター・本人のみ）
             ========================================== */}
          {currentUser.role === 'staff' && (
            <>
              <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 w-full">
                <div>
                  <div className="text-xs text-slate-400">{currentUser.center}センター（ID: {currentUser.id}）</div>
                  <div className="text-sm font-bold flex items-center">
                    {currentUser.name} さん
                    <button
                      onClick={() => setIsMoneyVisible(!isMoneyVisible)}
                      className="ml-2 flex items-center text-[11px] font-normal text-slate-300 hover:text-white transition-colors bg-slate-800 px-2 py-0.5 rounded-full"
                    >
                      時給 {displayMoney(currentUser.hourlyWage)}
                      {isMoneyVisible ? <IconEye /> : <IconEyeOff />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700"
                >
                  ログアウト
                </button>
              </header>

              {syncStatus && (
                <div className="bg-indigo-600 text-white text-[11px] px-3 py-1 font-bold text-center transition-all animate-pulse">
                  {syncStatus}
                </div>
              )}

              {activeCall && (
                <div className="bg-red-600 text-white px-4 py-2.5 shadow-md shrink-0 w-full flex items-center justify-between animate-pulse">
                  <div className="text-xs font-bold flex items-center space-x-1.5 truncate">
                    <span role="img" aria-label="alert">🚨</span>
                    <span className="truncate">【呼出中】{activeCall.targetName} へ [{activeCall.priority}優先] {activeCall.reasonLabel}</span>
                  </div>
                  <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded shrink-0 ml-2 font-mono">{activeCall.calledAt}発信</span>
                </div>
              )}

              <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 w-full box-border">
                {/* タブ1：社員呼出 ＆ 当日欠勤・遅刻連絡 */}
                {currentTab === 'call' && (
                  <div className="w-full space-y-3">
                    <div className="flex bg-slate-200 p-1 rounded-xl w-full box-border">
                      <button
                        onClick={() => setCallSubTab('call')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${callSubTab === 'call' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600'}`}
                      >
                        現場での社員呼出
                      </button>
                      <button
                        onClick={() => setCallSubTab('absence')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${callSubTab === 'absence' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600'}`}
                      >
                        当日欠勤・遅刻連絡
                      </button>
                    </div>

                    {callSubTab === 'call' && (
                      <div className="w-full space-y-4">
                        {activeCall ? (
                          <div className="w-full bg-red-50 border-2 border-red-400 rounded-xl p-4 shadow-sm box-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-red-700 uppercase tracking-wider flex items-center">
                                <span className="w-2.5 h-2.5 bg-red-600 rounded-full inline-block mr-1.5 animate-ping"></span>
                                社員の対応をお待ちください
                              </span>
                              <span className="text-xs font-mono font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">{activeCall.calledAt} 発信</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-red-200 mb-3 space-y-1">
                              <div className="text-xs text-slate-600">呼び出し宛先：<span className="font-bold text-slate-800">{activeCall.targetName}</span></div>
                              <div className="text-xs text-slate-600">内容：<span className="font-bold text-red-600">[{activeCall.priority}優先] {activeCall.reasonLabel}</span></div>
                            </div>
                            <div className="flex space-x-2">
                              <button onClick={() => handleClearCall(true)} className="flex-[2] bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-xs shadow">✓ 社員が対応完了（解除）</button>
                              <button onClick={() => handleClearCall(false)} className="flex-1 bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-xs">取消</button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 box-border">
                            <h2 className="text-base font-bold text-slate-800 mb-4">{currentUser.center}センター 社員呼び出し</h2>
                            <div className="mb-5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <label className="text-xs font-bold text-slate-600 block mb-2">1. 誰を呼び出しますか？</label>
                              <select value={callTargetStaff} onChange={(e) => setCallTargetStaff(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-700 shadow-sm">
                                <option value="all">{currentUser.center}センター 社員全員（手が空いている人）</option>
                                {staffList.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name} 社員</option>
                                ))}
                              </select>
                            </div>
                            <label className="text-xs font-bold text-slate-600 block mb-2">2. トラブル・質問内容（優先度順）</label>
                            <div className="grid grid-cols-1 gap-2.5 w-full">
                              {CALL_REASONS.map((r) => (
                                <button key={r.id} onClick={() => handleCallStaff(r)} className={`${r.color} w-full p-4 rounded-xl text-left font-bold shadow flex items-center justify-between box-border active:scale-98 transition-transform`}>
                                  <span>{r.label}</span><span className="text-xs bg-black/20 px-2 py-1 rounded shrink-0">優先度: {r.priority}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 当日急遽欠勤・遅刻連絡フォーム */}
                    {callSubTab === 'absence' && (
                      <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 box-border">
                        <div className="mb-3">
                          <h2 className="text-base font-bold text-slate-800">当日欠勤・遅刻の緊急連絡</h2>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            送信すると{currentUser.center}センターの社員画面に即時通知されます。
                          </p>
                        </div>

                        <form onSubmit={handleAbsenceSubmit} className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">対象日</label>
                            <input
                              type="date"
                              value={absenceDate}
                              onChange={(e) => setAbsenceDate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-800"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">連絡区分</label>
                            <div className="grid grid-cols-3 gap-2">
                              {(['当日欠勤', '遅刻', '早退'] as const).map((t) => (
                                <button
                                  type="button"
                                  key={t}
                                  onClick={() => setAbsenceType(t)}
                                  className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                                    absenceType === t
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                      : 'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">理由</label>
                            <select
                              value={absenceReason}
                              onChange={(e) => setAbsenceReason(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm"
                            >
                              {ABSENCE_REASONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">詳細・到着予定時刻など（任意）</label>
                            <textarea
                              value={absenceNote}
                              onChange={(e) => setAbsenceNote(e.target.value)}
                              placeholder="例：38度の発熱があるため本日お休みします / 電車遅延のため10時頃出社します"
                              rows={3}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm focus:border-rose-500 focus:bg-white"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm shadow-md active:scale-95 transition-all"
                          >
                            {currentUser.center}センター社員へ連絡を送信
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* タブ2：シフト・給与（確定シフト / 希望提出 / 勤務実績） */}
                {currentTab === 'shift' && (
                  <div className="w-full space-y-3">
                    <div className="flex bg-slate-200 p-1 rounded-xl w-full box-border">
                      <button
                        onClick={() => setShiftSubTab('confirmed')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${shiftSubTab === 'confirmed' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
                      >
                        確定シフト
                      </button>
                      <button
                        onClick={() => setShiftSubTab('submit')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${shiftSubTab === 'submit' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
                      >
                        希望提出
                      </button>
                      <button
                        onClick={() => setShiftSubTab('history')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${shiftSubTab === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
                      >
                        勤務実績
                      </button>
                    </div>

                    {/* サブタブA：確定シフト確認 */}
                    {shiftSubTab === 'confirmed' && (
                      <div className="space-y-3 w-full">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800">確定済み出勤予定</h3>
                              <p className="text-[10px] text-slate-500">センター社員が確定したあなたのシフトです</p>
                            </div>
                            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                              計 {confirmedShifts.length} 日
                            </span>
                          </div>

                          {confirmedShifts.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-400">
                              現在確定しているシフトはありません。
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {confirmedShifts.map((item) => (
                                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-sm font-black text-slate-800">
                                        {item.date.replace(/-/g, '/')} ({item.dayOfWeek})
                                      </span>
                                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                                        {item.task}
                                      </span>
                                    </div>
                                    <div className="text-xs font-bold text-slate-600 mt-1">
                                      ⏰ {item.timeRange}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setAbsenceDate(item.date);
                                      setCurrentTab('call');
                                      setCallSubTab('absence');
                                    }}
                                    className="text-[10px] text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold px-2 py-1.5 rounded-lg shrink-0"
                                  >
                                    欠勤・遅刻連絡
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* サブタブB：希望シフト提出（給与予定は非表示・時間と日数のみ表示） */}
                    {shiftSubTab === 'submit' && (
                      <div className="space-y-3 w-full">
                        <div className={`p-3.5 rounded-xl shadow-sm border box-border ${isDeadlinePassed ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700">【次回シフト提出アナウンス】</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isDeadlinePassed ? 'bg-rose-200 text-rose-900' : 'bg-blue-200 text-blue-900'}`}>{isDeadlinePassed ? '締切終了' : '提出受付中'}</span>
                          </div>
                          <div className="text-xs text-slate-600 mb-1">対象期間：<span className="text-indigo-900 font-bold">{SHIFT_SCHEDULE.targetWeek}</span></div>
                          <div className="text-xs text-slate-600">提出締切：<span className="text-red-600 font-extrabold text-sm">{SHIFT_SCHEDULE.deadline} まで</span></div>
                        </div>

                        {/* 予定給与は表示せず、希望日数と希望時間のみ表示 */}
                        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-4 rounded-xl shadow-md w-full box-border">
                          <div className="text-[11px] text-indigo-200 mb-1">希望シフト入力状況</div>
                          <div className="flex justify-between items-end">
                            <div>
                              <div className="text-xs text-indigo-200">希望出勤日数</div>
                              <div className="text-2xl font-black">{totalPlannedDays} <span className="text-xs font-normal">日</span></div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-indigo-200">月間希望合計時間</div>
                              <div className="text-2xl font-black text-amber-300">{totalPlannedHours} <span className="text-xs font-normal text-white">時間</span></div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 w-full box-border">
                          <div className="grid grid-cols-7 gap-1 text-center mb-4 w-full">
                            {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                              <span key={d} className={`text-[10px] font-bold py-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>{d}</span>
                            ))}
                            {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((day) => {
                              const sunday = isSunday(day);
                              const hoursSelected = shiftDates[day] || [];
                              const isFull = hoursSelected.length === 8;
                              const isPartial = hoursSelected.length > 0 && !isFull;

                              if (sunday) {
                                return (
                                  <div key={day} className="h-12 min-w-0 w-full rounded-lg flex flex-col items-center justify-center bg-slate-100/80 border border-slate-200 text-slate-400 cursor-not-allowed opacity-70">
                                    <span className="text-xs font-bold leading-tight text-slate-400">{day}</span>
                                    <span className="text-[8px] font-bold text-red-400 mt-0.5 scale-95">定休</span>
                                  </div>
                                );
                              }

                              return (
                                <button
                                  key={day}
                                  onClick={() => openShiftModal(day)}
                                  disabled={isDeadlinePassed}
                                  className={`h-12 min-w-0 w-full rounded-lg flex flex-col items-center justify-center transition-all border ${
                                    isFull ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' :
                                    isPartial ? 'bg-indigo-100 text-indigo-900 border-indigo-300' :
                                    'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  <span className="text-xs font-bold leading-tight">{day}</span>
                                  <span className="text-[8px] font-medium leading-none mt-0.5 scale-95">{isFull ? '8h' : isPartial ? `${hoursSelected.length}h` : '-'}</span>
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={handleShiftSubmit}
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-sm shadow-md active:scale-95 transition-transform"
                          >
                            {shiftSubmitted ? '✓ 提出完了（保存済・再提出する）' : 'この内容でシフトを提出する'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* サブタブC：勤務実績（月次・年間合計の実績金額のみ表示） */}
                    {shiftSubTab === 'history' && (
                      <div className="space-y-3 w-full">
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                          <div>
                            <span className="text-xs font-bold text-slate-700 block">表示月度を選択（確定実績）</span>
                            <span className="text-[10px] text-slate-400">※分単位計算（時給 ÷ 60）で算出</span>
                          </div>
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-indigo-50 border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-900 focus:outline-none"
                          >
                            {Object.keys(WORK_HISTORY).map((mKey) => (
                              <option key={mKey} value={mKey}>
                                {WORK_HISTORY[mKey].monthLabel}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 w-full">
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-[10px] font-bold text-indigo-600 mb-1">【月次実績】{currentMonthData.monthLabel}</div>
                            <div className="text-xs text-slate-500">実働勤務時間</div>
                            <div className="text-lg font-black text-slate-800">
                              {formatMinutes(monthlyTotalMinutes)}
                            </div>
                            <div className="text-xs text-slate-500 mt-2 flex items-center cursor-pointer" onClick={() => setIsMoneyVisible(!isMoneyVisible)}>
                              実績支給額 {isMoneyVisible ? <IconEye /> : <IconEyeOff />}
                            </div>
                            <div className="text-lg font-black text-emerald-600">{displayMoney(monthlySalary)}</div>
                          </div>
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 shadow-sm">
                            <div className="text-[10px] font-bold text-amber-400 mb-1">【年間合計実績】</div>
                            <div className="text-xs text-slate-400">累計実働時間</div>
                            <div className="text-lg font-black">
                              {formatMinutes(cumulativeStats.totalMinutes)}
                            </div>
                            <div className="text-xs text-slate-400 mt-2 flex items-center cursor-pointer" onClick={() => setIsMoneyVisible(!isMoneyVisible)}>
                              累計支給額 {isMoneyVisible ? <IconEye /> : <IconEyeOff />}
                            </div>
                            <div className="text-lg font-black text-amber-300">{displayMoney(cumulativeStats.totalSalary)}</div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 w-full box-border">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-slate-700">日別実績明細（{currentMonthData.records.length}日稼働・分単位計算）</h3>
                            <button onClick={() => setIsMoneyVisible(!isMoneyVisible)} className="text-[10px] flex items-center text-slate-400 border border-slate-200 px-2 py-0.5 rounded bg-slate-50">
                              金額表示 {isMoneyVisible ? <IconEye /> : <IconEyeOff />}
                            </button>
                          </div>
                          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                            {currentMonthData.records.map((r, idx) => {
                              const dailyPay = calculateMinuteSalary(r.minutes, currentUser.hourlyWage);
                              return (
                                <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                                  <div>
                                    <div className="font-bold text-slate-800">{r.date}</div>
                                    <div className="text-[10px] text-slate-400">{r.timeRange}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-slate-700">{formatMinutes(r.minutes)}</div>
                                    <div className="text-[11px] font-bold text-emerald-600">{displayMoney(dailyPay)}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* タブ3：いいね（直接送信 ＆ 受信一覧） */}
                {currentTab === 'likes' && (
                  <div className="w-full space-y-4">
                    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 box-border">
                      <div className="flex justify-between items-center mb-3">
                        <h2 className="text-base font-bold text-slate-800">サンクスカードを送る</h2>
                        <span className="text-xs font-bold text-slate-500">今月: {sentCount} / {currentUser.monthlyLikeLimit} 件</span>
                      </div>
                      <FastLikeForm
                        sentCount={sentCount}
                        monthlyLikeLimit={currentUser.monthlyLikeLimit}
                        targetList={likeTargetList}
                        messageGroups={messageGroups}
                        onSend={handleSendLike}
                      />
                    </div>

                    {/* 自分宛てに直接届いたサンクスカード一覧 */}
                    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 box-border">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-800">あなたに届いた感謝カード</h3>
                        <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                          計 {receivedLikes.length} 通
                        </span>
                      </div>

                      {receivedLikes.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400">
                          まだ届いたカードはありません。
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {receivedLikes.map((m) => (
                            <div key={m.id} className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-rose-900">From: {m.fromName} さん</span>
                                <span className="text-[10px] text-slate-400">{m.sentAt}</span>
                              </div>
                              <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-rose-100 font-medium">
                                「{m.text}」
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* タブ4：スキル/分布 */}
                {currentTab === 'skills' && (
                  <div className="w-full space-y-4">
                    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 box-border">
                      <div className="flex justify-between items-center mb-1">
                        <h2 className="text-base font-bold text-slate-800">保有スキル申請</h2>
                        <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                          {approvedSkillCount} / {SKILL_LIST.length} 習得済
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-3 border-b border-slate-100 pb-2">
                        スキルをタップして申請します。社員の承認で「習得済（緑色）」になり、順位が上がります。
                      </p>

                      <div className="space-y-2 w-full">
                        {Object.keys(skillCategories).map((category) => {
                          const items = skillCategories[category];
                          const isOpen = Boolean(openCategories[category]);
                          const categoryApprovedCount = items.filter(i => mySkillStatus[i.full] === 'approved').length;
                          const hasApproved = categoryApprovedCount > 0;

                          return (
                            <div
                              key={category}
                              className={`border rounded-xl overflow-hidden transition-all ${
                                hasApproved ? 'border-emerald-200 shadow-xs' : 'border-slate-200'
                              }`}
                            >
                              <button
                                onClick={() => toggleCategory(category)}
                                className={`w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors ${
                                  hasApproved ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-slate-50 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-base">{items[0]?.icon}</span>
                                  <span className="font-bold text-xs text-slate-800">【{category}】</span>
                                  <span className="text-[10px] text-slate-400">({items.length})</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    hasApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {categoryApprovedCount} / {items.length} 習得
                                  </span>
                                  <IconChevronDown open={isOpen} />
                                </div>
                              </button>

                              {isOpen && (
                                <div className="p-2 space-y-1.5 border-t border-slate-100 bg-white">
                                  {items.map(({ full, label, icon }) => {
                                    const status = mySkillStatus[full] || 'none';
                                    const isApproved = status === 'approved';
                                    const isPending = status === 'pending';

                                    return (
                                      <div
                                        key={full}
                                        onClick={() => toggleSkillStatus(full)}
                                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                          isApproved
                                            ? 'bg-emerald-50/80 border-emerald-300 border-l-4 border-l-emerald-600 shadow-xs'
                                            : isPending
                                            ? 'bg-amber-50/80 border-amber-300 border-dashed text-amber-900'
                                            : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-600'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2 flex-1 pr-2">
                                          <span className="text-base shrink-0">{icon}</span>
                                          <span className={`leading-tight font-medium ${isApproved ? 'font-bold text-emerald-950' : ''}`}>
                                            {label}
                                          </span>
                                        </div>
                                        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold transition-transform ${
                                          isApproved
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : isPending
                                            ? 'bg-amber-500 text-white animate-pulse'
                                            : 'bg-slate-200 text-slate-500'
                                        }`}>
                                          {isApproved ? '✓ 習得済' : isPending ? '⌛ 申請中' : '+ 申請'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 box-border">
                      <h3 className="text-xs font-bold text-slate-800 mb-2">全国パート社員 スキル分布図（1,029名）</h3>
                      <div className="space-y-2.5">
                        {SKILL_TIERS.map((tier) => {
                          const isCurrent = tier.name === currentTier.name;
                          return (
                            <div key={tier.name} className={`p-2 rounded-lg border ${isCurrent ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400 shadow-xs' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex justify-between text-xs mb-1">
                                <div className="flex items-center space-x-1">
                                  <span className="font-bold text-slate-800">{tier.level} {tier.name}</span>
                                  <span className="text-[10px] text-slate-500">({tier.range})</span>
                                  {isCurrent && <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1">現在地</span>}
                                </div>
                                <span className="text-slate-600 font-bold">{tier.count}名 ({tier.percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div className={`h-full ${tier.barColor}`} style={{ width: `${tier.percentage * 2}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-indigo-900/40">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-indigo-800/40">
                        <span className="text-xs font-bold text-indigo-300">全国パート個人スキル順位</span>
                        <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-mono">
                          全19センター集計
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 my-2">
                        <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-center">
                          <div className="text-[10px] text-indigo-200 font-bold mb-0.5">
                            {currentTier.level} {currentTier.name} 内
                          </div>
                          <div className="text-xl font-black text-amber-300 tracking-tight">
                            {rankStats.tierRank} <span className="text-xs font-normal text-slate-300">/ {rankStats.tierCount}位</span>
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">（同クラス内順位）</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-center">
                          <div className="text-[10px] text-indigo-200 font-bold mb-0.5">全国全体順位</div>
                          <div className="text-xl font-black text-emerald-300 tracking-tight">
                            {rankStats.overallRank} <span className="text-xs font-normal text-slate-300">/ {rankStats.totalWorkers}位</span>
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">（全国パート1,029名中）</div>
                        </div>
                      </div>

                      {nextTierInfo ? (
                        <div className="text-[11px] bg-indigo-900/50 px-3 py-1.5 rounded-lg text-indigo-100 flex items-center justify-between mt-2">
                          <span>上位ランク <strong className="text-white">{nextTierInfo.nextLevel} {nextTierInfo.nextName}</strong> まで</span>
                          <span className="text-amber-300 font-bold">あと {nextTierInfo.remaining} スキル</span>
                        </div>
                      ) : (
                        <div className="text-[11px] bg-amber-500/20 text-amber-200 px-3 py-1.5 rounded-lg text-center font-bold mt-2">
                          ★ 最高位のマスタークラス（上位5%）に到達しています！
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </main>

              <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full bg-white/95 backdrop-blur border-t border-slate-200 flex justify-around py-2 shadow-lg z-40">
                {NAV_TABS.map((tab) => (
                  <button key={tab.id} onClick={() => setCurrentTab(tab.id)} className={`flex flex-col items-center p-1 text-xs font-medium ${currentTab === tab.id ? `${tab.color} font-bold` : 'text-slate-400'}`}>
                    <SvgIcon path={tab.path} /><span className="text-[10px] mt-1">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </>
          )}

          {/* ==========================================
              画面2：センター社員画面（自センターのみアクセス可）
             ========================================== */}
          {currentUser.role === 'center_admin' && (
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-12 w-full box-border">
              <div className="bg-amber-600 text-white p-4 rounded-2xl shadow-md mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs bg-black/20 px-2 py-0.5 rounded font-bold">センター社員管理画面</span>
                  <button
                    onClick={handleLogout}
                    className="text-[11px] bg-black/25 hover:bg-black/40 text-white px-2.5 py-0.5 rounded-lg"
                  >
                    ログアウト
                  </button>
                </div>
                <h1 className="text-lg font-black">{currentUser.center}センター 管理ダッシュボード</h1>
                <p className="text-xs text-amber-100 mt-1">担当: {currentUser.name}（自センターデータのみ閲覧可能）</p>
              </div>

              <div className="flex bg-slate-200 p-1 rounded-xl mb-4 w-full">
                <button
                  onClick={() => setCenterTab('shift')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg ${centerTab === 'shift' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600'}`}
                >
                  シフト集計
                </button>
                <button
                  onClick={() => setCenterTab('absence')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg relative ${centerTab === 'absence' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600'}`}
                >
                  欠勤・遅刻連絡
                  {absenceReports.filter(a => a.center === currentUser.center).length > 0 && (
                    <span className="ml-1 bg-rose-600 text-white px-1.5 py-0.2 rounded-full text-[9px]">
                      {absenceReports.filter(a => a.center === currentUser.center).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setCenterTab('skills')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg relative ${centerTab === 'skills' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600'}`}
                >
                  スキル承認
                  {pendingSkillApprovals.length > 0 && (
                    <span className="ml-1 bg-indigo-600 text-white px-1.5 py-0.2 rounded-full text-[9px]">
                      {pendingSkillApprovals.length}
                    </span>
                  )}
                </button>
              </div>

              {centerTab === 'shift' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-sm text-slate-800">{currentUser.center}センター シフト提出状況</h3>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">充足率: 93%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-500 block">提出済み</span>
                        <span className="text-xl font-black text-indigo-600">142 <span className="text-xs font-normal text-slate-600">/ 153名</span></span>
                      </div>
                      <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-center">
                        <span className="text-[10px] text-rose-600 block">未提出者</span>
                        <span className="text-xl font-black text-rose-600">11 <span className="text-xs font-normal text-slate-600">名</span></span>
                      </div>
                    </div>

                    <button
                      onClick={() => alert(`${currentUser.center}センター専用のシフト集計Excelファイルをダウンロードしました。`)}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow"
                    >
                      <span>📊 {currentUser.center}センター専用Excel出力 (シフト確定用)</span>
                    </button>
                  </div>
                </div>
              )}

              {centerTab === 'absence' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-sm text-slate-800 mb-3">{currentUser.center}センター 当日欠勤・遅刻連絡一覧</h3>
                  {absenceReports.filter(a => a.center === currentUser.center).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">本日の欠勤・遅刻連絡はありません。</div>
                  ) : (
                    <div className="space-y-2.5">
                      {absenceReports.filter(a => a.center === currentUser.center).map((rep) => (
                        <div key={rep.id} className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded">{rep.type}</span>
                              <span className="font-bold text-slate-800">{rep.userName} さん</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{rep.targetDate} ({rep.reportedAt}受信)</span>
                          </div>
                          <div className="text-slate-700 font-bold mt-1">理由: {rep.reason}</div>
                          {rep.note && (
                            <p className="text-slate-600 bg-white p-2 rounded border border-rose-100 mt-1.5">
                              {rep.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {centerTab === 'skills' && (
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-sm text-slate-800 mb-2">パートからのスキル習得申請一覧</h3>
                    {pendingSkillApprovals.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">承認待ちのスキル申請はありません。</div>
                    ) : (
                      <div className="space-y-2.5">
                        {pendingSkillApprovals.map((item) => (
                          <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-800">{item.staffName} さん</span>
                              <span className="text-[10px] text-slate-400">{item.appliedAt}</span>
                            </div>
                            <div className="text-indigo-900 font-bold mb-2">申請: {item.skillName}</div>
                            <div className="flex space-x-2">
                              <button onClick={() => handleApproveSkill(item.id, true)} className="flex-1 bg-indigo-600 text-white font-bold py-1.5 rounded text-xs shadow">✓ 承認する</button>
                              <button onClick={() => handleApproveSkill(item.id, false)} className="flex-1 bg-slate-200 text-slate-600 font-bold py-1.5 rounded text-xs">差戻し</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              画面3：本部社員画面（全19センター統括・閲覧可）
             ========================================== */}
          {currentUser.role === 'super_admin' && (
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-12 w-full box-border">
              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md mb-3 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs bg-emerald-600 px-2 py-0.5 rounded font-bold">SC本部 統括管理画面</span>
                  <button
                    onClick={handleLogout}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded-lg border border-slate-700"
                  >
                    ログアウト
                  </button>
                </div>
                <h1 className="text-lg font-black">全国19センター 総合分析</h1>
                <p className="text-xs text-slate-300 mt-0.5">担当者: {currentUser.name} / 全社パート総数: 1,029名</p>
              </div>

              <div className="flex bg-slate-200 p-1 rounded-xl mb-3 w-full">
                <button
                  onClick={() => setSuperAdminTab('overview')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${superAdminTab === 'overview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
                >
                  拠点サマリー
                </button>
                <button
                  onClick={() => setSuperAdminTab('skills')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${superAdminTab === 'skills' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
                >
                  スキル習得率
                </button>
                <button
                  onClick={() => setSuperAdminTab('likes')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${superAdminTab === 'likes' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
                >
                  いいね履歴
                </button>
              </div>

              {superAdminTab === 'overview' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-xs">
                      <span className="text-[9px] text-slate-500 block">全国総在籍</span>
                      <span className="text-base font-black text-slate-800">1,029 <span className="text-[10px] font-normal">名</span></span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-xs">
                      <span className="text-[9px] text-slate-500 block">提出済み</span>
                      <span className="text-base font-black text-indigo-600">950 <span className="text-[10px] font-normal">名</span></span>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-center shadow-xs">
                      <span className="text-[9px] text-rose-600 block">要対応拠点</span>
                      <span className="text-base font-black text-rose-600">2 <span className="text-[10px] font-normal">拠点</span></span>
                    </div>
                  </div>

                  <button
                    onClick={() => alert('全国19センター・1,029名分のシフト希望統合Excelを出力しました。')}
                    className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md"
                  >
                    <span>📥 全国19拠点 統合シフト希望データ (Excel一括出力)</span>
                  </button>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-xs text-slate-800 mb-2">全国19拠点 シフト充足率・稼働状況一覧</h3>
                    <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                      {CENTERS_DATA.map((c) => (
                        <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-800">{c.name}</span>
                              <span className="text-[9px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">{c.region}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              提出: {c.submittedCount}/{c.staffCount}名 ({Math.round((c.submittedCount / c.staffCount) * 100)}%)
                            </div>
                            {c.alert && (
                              <span className="inline-block mt-0.5 text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">
                                ⚠️ {c.alert}
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className={`text-xs font-black px-2 py-0.5 rounded ${
                              c.fillRate >= 90 ? 'bg-emerald-100 text-emerald-800' :
                              c.fillRate >= 80 ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              充足率 {c.fillRate}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {superAdminTab === 'skills' && (
                <div className="space-y-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-xs text-slate-800">全19センター スキル習得進捗・多能工化率</h3>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">全社平均: 4.8個</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-3">各拠点のパート従業員におけるスキル習得進捗と1人あたり平均保有数です。</p>

                    <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                      {CENTERS_DATA.map((c) => (
                        <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-800">{c.name}</span>
                              <span className="text-[9px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">{c.staffCount}名</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              1人あたり平均: <strong className="text-slate-700">{c.avgSkills} 個</strong>
                            </div>
                          </div>

                          <div className="text-right flex items-center space-x-2">
                            <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden hidden sm:block">
                              <div className="bg-indigo-600 h-full" style={{ width: `${c.skillRate}%` }} />
                            </div>
                            <span className={`text-xs font-black px-2 py-0.5 rounded ${
                              c.skillRate >= 70 ? 'bg-emerald-100 text-emerald-800' :
                              c.skillRate >= 60 ? 'bg-indigo-100 text-indigo-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              進捗 {c.skillRate}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {superAdminTab === 'likes' && (
                <div className="space-y-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-xs text-slate-800">全センター いいね（サンクスカード）運用率</h3>
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">全社平均: 81%</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-2">各センターの月間送信枠（月3件）に対する消化率です。</p>

                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {CENTERS_DATA.map((c) => (
                        <div key={c.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 truncate">{c.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            c.likeUsageRate >= 80 ? 'bg-rose-100 text-rose-700' :
                            c.likeUsageRate >= 65 ? 'bg-slate-200 text-slate-700' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {c.likeUsageRate}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-xs text-slate-800">全国サンクスカード メッセージ履歴（全社）</h3>
                      <span className="text-[10px] text-slate-400">最新順</span>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {allMessages.map((m) => (
                        <div key={m.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="bg-slate-800 text-white font-bold text-[9px] px-1.5 py-0.2 rounded">{m.center}</span>
                              <span className="font-bold text-slate-800">{m.fromName} ➔ {m.toName}</span>
                            </div>
                            <span className="text-[9px] text-slate-400">{m.sentAt}</span>
                          </div>
                          <p className="text-slate-600 bg-white p-2 rounded border border-slate-100 leading-tight">{m.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

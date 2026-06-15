import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Briefcase,
  FolderTree,
  Coins,
  Banknote,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const ADMIN_NAV: Array<{ href: string; label: string; icon: LucideIcon; exact?: boolean }> = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
  { href: '/admin/kols/review', label: 'Duyệt KOL', icon: UserCheck },
  { href: '/admin/brands/review', label: 'Duyệt Brand', icon: Building2 },
  { href: '/admin/bookings', label: 'Booking', icon: Briefcase },
  { href: '/admin/categories', label: 'Danh mục', icon: FolderTree },
  { href: '/admin/commission', label: 'Hoa hồng', icon: Coins },
  { href: '/admin/withdrawals', label: 'Rút tiền', icon: Banknote },
];

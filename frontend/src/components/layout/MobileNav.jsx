import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileBarChart, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { to: '/dashboard',      label: 'Home',     icon: LayoutDashboard },
  { to: '/reports/latest', label: 'Reports',  icon: FileBarChart    },
  { to: '/settings',       label: 'Settings', icon: Settings        },
];

export default function MobileNav() {
  return (
    // Spec: glass bottom bar below md breakpoint
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around glass border-t border-[rgba(15,20,30,0.06)] dark:border-[rgba(255,255,255,0.08)] md:hidden"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-all min-h-[44px] min-w-[60px] justify-center px-2',
              isActive
                ? 'text-[#14E0B4]'
                : 'text-text-secondary hover:text-text-primary'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={20}
                className={cn(
                  'transition-colors',
                  isActive ? 'text-[#14E0B4]' : 'text-text-secondary'
                )}
              />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileBarChart, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { to: '/dashboard',      label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reports/latest', label: 'Reports',   icon: FileBarChart    },
  { to: '/settings',       label: 'Settings',  icon: Settings        },
];

export default function Sidebar() {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-border/60 px-3 py-6 md:block">
      <nav className="flex flex-col gap-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-all duration-150 min-h-[44px]',
                isActive
                  // Active: gradient tint, spec signal→agent
                  ? 'bg-gradient-to-r from-[rgba(20,224,180,0.12)] to-[rgba(124,127,251,0.10)] text-text-primary border border-[rgba(124,127,251,0.20)] shadow-subtle'
                  // Inactive: ghost hover with translate
                  : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary hover:translate-x-0.5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={isActive ? 'text-[#7C7FFB]' : 'text-text-secondary'}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

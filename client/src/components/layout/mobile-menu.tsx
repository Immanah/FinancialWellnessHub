import { Link } from "wouter";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  currentPath: string;
  user: Omit<User, "password"> | null;
  onLogout: () => void;
}

export function MobileMenu({ isOpen, onClose, navItems, currentPath, user, onLogout }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg flex flex-col animate-in slide-in-from-left">
        {/* Close button */}
        <div className="p-4 flex justify-between items-center border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-semibold text-lg">B</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">BloomBank</h1>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted"
          >
            <XIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <div 
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 font-medium",
                      currentPath === item.path 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:bg-muted"
                    )}
                    onClick={onClose}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User profile */}
        {user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground font-medium">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="mt-3 w-full py-2 text-sm text-center text-muted-foreground hover:text-primary transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

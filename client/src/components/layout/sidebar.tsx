import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  HomeIcon, 
  CreditCardIcon, 
  BrainCircuitIcon, 
  TargetIcon, 
  SettingsIcon, 
  ChevronRightIcon,
  SmilePlusIcon,
  ShieldIcon,
  MapIcon,
  LeafIcon,
  BriefcaseIcon,
  BarChartIcon,
  CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./mobile-menu";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      path: "/",
      icon: <HomeIcon className="h-5 w-5" />
    },
    {
      name: "My Assistant",
      path: "/ai-assistant",
      icon: <BrainCircuitIcon className="h-5 w-5" />
    },
    {
      name: "Smart Savings",
      path: "/goals",
      icon: <TargetIcon className="h-5 w-5" />
    },
    {
      name: "Mood Budgeting",
      path: "/mood",
      icon: <SmilePlusIcon className="h-5 w-5" />
    },
    {
      name: "Safe Space",
      path: "/safe-space",
      icon: <ShieldIcon className="h-5 w-5" />
    },
    {
      name: "Spending Map",
      path: "/spending-map",
      icon: <MapIcon className="h-5 w-5" />
    },
    {
      name: "Sustainability",
      path: "/sustainability",
      icon: <LeafIcon className="h-5 w-5" />
    },
    {
      name: "Income Coach",
      path: "/income-coach",
      icon: <BriefcaseIcon className="h-5 w-5" />
    },
    {
      name: "Monthly Story",
      path: "/monthly-story",
      icon: <BarChartIcon className="h-5 w-5" />
    },
    {
      name: "My Accounts",
      path: "/accounts",
      icon: <CreditCardIcon className="h-5 w-5" />
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <SettingsIcon className="h-5 w-5" />
    }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden z-20 fixed top-4 left-4">
        <button 
          onClick={toggleMobileMenu}
          className="p-2 rounded-full bg-white shadow-md text-primary"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 12h16M4 18h16" 
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        navItems={navItems} 
        currentPath={location} 
        user={user}
        onLogout={() => logoutMutation.mutate()}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white shadow-md h-full flex-col z-10">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-semibold text-lg">B</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">BloomBank</h1>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="mt-6 flex-grow">
            <ul>
              {navItems.map((item) => (
                <li key={item.path} className="px-4 py-3">
                  <Link href={item.path}>
                    <div 
                      className={cn(
                        "flex items-center space-x-3 font-medium transition-colors",
                        location === item.path 
                          ? "text-primary" 
                          : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                      {location === item.path && (
                        <ChevronRightIcon className="h-4 w-4 ml-auto" />
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User profile */}
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
              onClick={() => logoutMutation.mutate()}
              className="mt-3 w-full text-sm text-left text-muted-foreground hover:text-primary transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

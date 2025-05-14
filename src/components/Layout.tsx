import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

import { Calendar, ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';

const Layout = () => {
  const { subscriptions } = useSubscription();
  const location = useLocation();
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="hidden md:block">
          <SidebarHeader className="p-4">
            <div className="flex items-center space-x-2">
                <img src="icons/maskable_icon.svg" alt="SubTrackr" className="w-6 h-6" />
              <h1 className="text-lg font-bold">SubTrackr</h1>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link 
                        to="/" 
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors ${location.pathname === "/" ? "text-primary font-medium" : ""}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard">
                          <rect width="7" height="9" x="3" y="3" rx="1" />
                          <rect width="7" height="5" x="14" y="3" rx="1" />
                          <rect width="7" height="9" x="14" y="12" rx="1" />
                          <rect width="7" height="5" x="3" y="16" rx="1" />
                        </svg>
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link 
                        to="/subscriptions" 
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors ${location.pathname === "/subscriptions" ? "text-primary font-medium" : ""}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card">
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                        <span>Subscriptions</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link 
                        to="/calendar" 
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors ${location.pathname === "/calendar" ? "text-primary font-medium" : ""}`}
                      >
                        <Calendar />
                        <span>Calendar</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-4 py-2">
                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-medium mb-2">Subscription Stats</h3>
                    <div className="text-sm text-muted-foreground">
                      <p>Total Subscriptions: {subscriptions.length}</p>
                      <div className="h-1 bg-background my-2"></div>
                      <p>Upcoming in 7 days: {
                        subscriptions.filter(sub => {
                          const now = new Date();
                          const sevenDaysLater = new Date();
                          sevenDaysLater.setDate(now.getDate() + 7);
                          return sub.nextPaymentDate >= now && sub.nextPaymentDate <= sevenDaysLater;
                        }).length
                      }</p>
                    </div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="p-4">
            <div className="text-xs text-muted-foreground">
              <p>SubTrackr v1.0</p>
              <p>© {new Date().getFullYear()}</p>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-1 w-full">
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center px-4 md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center space-x-2 md:hidden ml-2">
              <img src="icons/maskable_icon.svg" alt="SubTrackr" className="w-6 h-6" />
              <h1 className="text-lg font-bold">SubTrackr</h1>
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <Link
                to="/add-subscription"
                className="bg-primary text-primary-foreground rounded-full px-3 py-1.5 md:px-4 md:py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Add Subscription
              </Link>
            </div>
          </header>

          <main className="p-3 md:p-6 max-w-7xl mx-auto">
            <Outlet />
          </main>
          
          {showScrollButton && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-4 right-4 bg-primary text-white p-2.5 md:p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
              aria-label="Scroll to top"
            >
              <ArrowUp size={18} className="md:w-5 md:h-5" />
            </button>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;

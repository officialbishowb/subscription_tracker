
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import SubscriptionsView from "@/components/SubscriptionsView";
import CalendarView from "@/components/CalendarView";
import SubscriptionForm from "@/components/SubscriptionForm";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

const queryClient = new QueryClient();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      },
      err => {
        console.log('ServiceWorker registration failed: ', err);
      }
    );
  });
}

const App = () => {
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SubscriptionProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="subscriptions" element={<SubscriptionsView />} />
                <Route path="calendar" element={<CalendarView />} />
                <Route path="add-subscription" element={<SubscriptionForm />} />
                <Route path="edit-subscription/:id" element={<EditSubscriptionPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SubscriptionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Edit subscription page that extracts ID from URL params
const EditSubscriptionPage = () => {
  const id = window.location.pathname.split('/edit-subscription/')[1];
  return <SubscriptionForm editMode subscriptionId={id} />;
};

export default App;

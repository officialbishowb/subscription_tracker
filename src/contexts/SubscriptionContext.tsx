import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Subscription, BillingCycle, SubscriptionCategory } from '@/types';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

interface SubscriptionContextType {
  subscriptions: Subscription[];
  addSubscription: (subscription: Omit<Subscription, 'id' | 'nextPaymentDate'>) => void;
  updateSubscription: (subscription: Subscription) => void;
  deleteSubscription: (id: string) => void;
  calculateNextPaymentDate: (paymentDate: Date, billingCycle: BillingCycle) => Date;
  getTotalMonthlyAmount: () => number;
  getUpcomingPayments: (days: number) => Subscription[];
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const categoryColors: Record<SubscriptionCategory, string> = {
  [SubscriptionCategory.STREAMING]: "#ef4444",
  [SubscriptionCategory.MUSIC]: "#8b5cf6",
  [SubscriptionCategory.GAMING]: "#22c55e",
  [SubscriptionCategory.SOFTWARE]: "#3b82f6",
  [SubscriptionCategory.CLOUD]: "#06b6d4",
  [SubscriptionCategory.FITNESS]: "#f97316",
  [SubscriptionCategory.NEWS]: "#6366f1",
  [SubscriptionCategory.OTHER]: "#64748b",
};

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  
  // Load subscriptions from localStorage on initial load
  useEffect(() => {
    const storedSubscriptions = localStorage.getItem('subscriptions');
    if (storedSubscriptions) {
      try {
        const parsedSubscriptions = JSON.parse(storedSubscriptions);
        
        // Convert string dates back to Date objects
        const processedSubscriptions = parsedSubscriptions.map((sub: any) => ({
          ...sub,
          paymentDate: new Date(sub.paymentDate),
          nextPaymentDate: new Date(sub.nextPaymentDate)
        }));
        
        setSubscriptions(processedSubscriptions);
      } catch (error) {
        console.error('Error parsing subscriptions from localStorage:', error);
        toast.error("Error loading your subscriptions");
      }
    }
  }, []);
  
  // Save subscriptions to localStorage whenever they change
  useEffect(() => {
    if (subscriptions.length > 0) {
      localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    }
  }, [subscriptions]);
  
  // Request notification permission
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ('Notification' in window) {
        // Check if we've already asked for permission
        const hasAskedBefore = localStorage.getItem('notificationPermissionAsked');
        
        if (!hasAskedBefore && Notification.permission === 'default') {
          // Show a toast to explain why we need notifications
          toast.info(
            "Enable notifications to get reminders about upcoming subscription payments",
            {
              duration: 5000,
              action: {
                label: "Enable",
                onClick: async () => {
                  try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                      toast.success("Notifications enabled successfully!");
                    } else {
                      toast.error("Notifications permission denied");
                    }
                  } catch (error) {
                    console.error('Error requesting notification permission:', error);
                    toast.error("Failed to enable notifications");
                  }
                }
              }
            }
          );
          
          // Mark that we've asked for permission
          localStorage.setItem('notificationPermissionAsked', 'true');
        }
      }
    };

    requestNotificationPermission();
  }, []);
  
  // Check for upcoming payments and show notifications (only once per day  for each subscription)
  useEffect(() => {
    const checkUpcomingPayments = () => {
      const upcomingPayments = getUpcomingPayments(3);
      
      if ('Notification' in window && Notification.permission === 'granted' && !isNotificationShown(upcomingPayments)) {
        upcomingPayments.forEach(subscription => {
          const daysUntilPayment = Math.ceil((subscription.nextPaymentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilPayment <= 3 && daysUntilPayment >= 0) {
            const notification = new Notification('Subscription Payment Due', {
              body: `${subscription.name} payment of ${subscription.currency}${subscription.amount.toFixed(2)} due in ${daysUntilPayment} days`,
              icon: subscription.logoUrl || '/icons/icon-192x192.png'
            });
            saveNotification(subscription);
          }
        });
      }

      // Clear notifications for subscriptions that have been paid
      upcomingPayments.forEach(subscription => {
        if (subscription.nextPaymentDate < new Date()) {
          clearNotification(subscription);
        }
      });

    };
    
    // Check for upcoming payments initially and every 6 hours
    checkUpcomingPayments();
    const intervalId = setInterval(checkUpcomingPayments, 1000 * 60 * 60 * 6);
    
    return () => clearInterval(intervalId);
  }, [subscriptions]);
  
  const calculateNextPaymentDate = (paymentDate: Date, billingCycle: BillingCycle): Date => {
    const nextDate = new Date(paymentDate);
    const today = new Date();
    
    // If the payment date is in the future, use it as is
    if (nextDate > today) {
      return nextDate;
    }
    
    // If the payment date is in the past, calculate the next occurrence
    switch (billingCycle) {
      case BillingCycle.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case BillingCycle.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case BillingCycle.BIANNUALLY:
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case BillingCycle.ANNUALLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  };
  
  const addSubscription = (subscriptionData: Omit<Subscription, 'id' | 'nextPaymentDate'>) => {
    const nextPaymentDate = calculateNextPaymentDate(subscriptionData.paymentDate, subscriptionData.billingCycle);
    
    const newSubscription: Subscription = {
      ...subscriptionData,
      id: uuidv4(),
      nextPaymentDate,
      color: categoryColors[subscriptionData.category]
    };
    
    setSubscriptions(prev => [...prev, newSubscription]);
    toast.success(`${newSubscription.name} subscription added`);
  };
  
  const updateSubscription = (updatedSubscription: Subscription) => {
    // Recalculate next payment date based on the updated payment date and billing cycle
    const nextPaymentDate = calculateNextPaymentDate(updatedSubscription.paymentDate, updatedSubscription.billingCycle);
    
    setSubscriptions(prev => prev.map(sub => 
      sub.id === updatedSubscription.id 
        ? { ...updatedSubscription, nextPaymentDate, color: categoryColors[updatedSubscription.category] } 
        : sub
    ));
    toast.success(`${updatedSubscription.name} subscription updated`);
  };
  
  const deleteSubscription = (id: string) => {
    const subscriptionToDelete = subscriptions.find(sub => sub.id === id);
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
    
    if (subscriptionToDelete) {
      toast.success(`${subscriptionToDelete.name} subscription deleted`);
    }
  };
  
  const getTotalMonthlyAmount = (): number => {
    return subscriptions.reduce((total, subscription) => {
      let monthlyAmount = subscription.amount;
      
      // Convert non-monthly billing to monthly equivalent
      switch (subscription.billingCycle) {
        case BillingCycle.QUARTERLY:
          monthlyAmount = subscription.amount / 3;
          break;
        case BillingCycle.BIANNUALLY:
          monthlyAmount = subscription.amount / 6;
          break;
        case BillingCycle.ANNUALLY:
          monthlyAmount = subscription.amount / 12;
          break;
      }
      
      return total + monthlyAmount;
    }, 0);
  };
  
  const getUpcomingPayments = (days: number): Subscription[] => {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);
    
    return subscriptions.filter(subscription => {
      const nextPayment = new Date(subscription.nextPaymentDate);
      return nextPayment >= today && nextPayment <= endDate;
    }).sort((a, b) => a.nextPaymentDate.getTime() - b.nextPaymentDate.getTime());
  };

  const isNotificationShown = (subscriptions: Subscription[]): boolean => {
    return subscriptions.some(subscription => {
      const notifiedList = localStorage.getItem(`notified_list`);
      if (!notifiedList) {
        return false;
      }
      const notifiedListArray = JSON.parse(notifiedList);
      return notifiedListArray.includes(subscription.id);
    });
  };

  const clearNotification = (subscription: Subscription) => {
    const notifiedList = localStorage.getItem(`notified_list`);
    if (!notifiedList) {
      return;
    }
    const notifiedListArray = JSON.parse(notifiedList);
    notifiedListArray.push(subscription.id);
    localStorage.setItem(`notified_list`, JSON.stringify(notifiedListArray));
  };

  const saveNotification = (subscription: Subscription) => {
    const notifiedList = localStorage.getItem(`notified_list`);
    if (!notifiedList) {
      localStorage.setItem(`notified_list`, JSON.stringify([subscription.id]));
    } else {
      const notifiedListArray = JSON.parse(notifiedList);
      notifiedListArray.push(subscription.id);
      localStorage.setItem(`notified_list`, JSON.stringify(notifiedListArray));
    }
  };
  
  const value = {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    calculateNextPaymentDate,
    getTotalMonthlyAmount,
    getUpcomingPayments
  };
  
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  
  return context;
};

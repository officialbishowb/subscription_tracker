
export interface Subscription {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  paymentDate: Date;
  category: SubscriptionCategory;
  color: string;
  logoText: string;
  logoUrl?: string;
  nextPaymentDate: Date;
}

export enum BillingCycle {
  MONTHLY = "Monthly",
  QUARTERLY = "Quarterly",
  BIANNUALLY = "Bi-annually",
  ANNUALLY = "Annually"
}

export enum SubscriptionCategory {
  STREAMING = "Streaming",
  MUSIC = "Music",
  GAMING = "Gaming",
  SOFTWARE = "Software",
  CLOUD = "Cloud",
  FITNESS = "Fitness",
  NEWS = "News",
  TRAVEL = "Travel",
  SHOPPING = "Shopping",
  SUBSCRIPTION = "Subscription",
  INTERNET = "Internet",
  INSURANCE = "Insurance",
  OTHER = "Other"
}

export interface CalendarDay {
  date: Date;
  subscriptions: Subscription[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface MonthData {
  month: Date;
  totalAmount: number;
  subscriptionCount: number;
  subscriptions: Subscription[];
}

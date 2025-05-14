
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionCard from './SubscriptionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, addDays } from 'date-fns';
import { SubscriptionCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { subscriptions, getTotalMonthlyAmount, getUpcomingPayments } = useSubscription();
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | '90days'>('30days');
  
  const upcomingPayments = getUpcomingPayments(timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 90);
  const totalMonthlyAmount = getTotalMonthlyAmount();
  
  // Generate spending by category data
  const categoryData = Object.values(SubscriptionCategory).map(category => {
    const categorySubscriptions = subscriptions.filter(sub => sub.category === category);
    const totalAmount = categorySubscriptions.reduce((sum, sub) => {
      let monthlyAmount = sub.amount;
      
      // Convert non-monthly billing to monthly equivalent
      switch (sub.billingCycle) {
        case 'Quarterly':
          monthlyAmount = sub.amount / 3;
          break;
        case 'Bi-annually':
          monthlyAmount = sub.amount / 6;
          break;
        case 'Annually':
          monthlyAmount = sub.amount / 12;
          break;
      }
      
      return sum + monthlyAmount;
    }, 0);
    
    return {
      name: category,
      value: totalAmount,
      count: categorySubscriptions.length,
    };
  }).filter(item => item.value > 0);
  
  // Colors for pie chart
  const COLORS = ['#ef4444', '#8b5cf6', '#22c55e', '#3b82f6', '#06b6d4', '#f97316', '#6366f1', '#64748b'];
  
  // Generate monthly spending data
  const generateMonthlyData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = format(month, 'MMM');
      
      // Calculate monthly spending for this month
      const monthlyTotal = subscriptions.reduce((sum, sub) => {
        const paymentDate = new Date(sub.paymentDate);
        
        // Check if this subscription was active in this month
        if (paymentDate <= month) {
          let amount = 0;
          
          switch (sub.billingCycle) {
            case 'Monthly':
              amount = sub.amount;
              break;
            case 'Quarterly':
              if ((month.getMonth() - paymentDate.getMonth()) % 3 === 0) {
                amount = sub.amount;
              }
              break;
            case 'Bi-annually':
              if ((month.getMonth() - paymentDate.getMonth()) % 6 === 0) {
                amount = sub.amount;
              }
              break;
            case 'Annually':
              if (month.getMonth() === paymentDate.getMonth()) {
                amount = sub.amount;
              }
              break;
          }
          
          return sum + amount;
        }
        
        return sum;
      }, 0);
      
      data.unshift({
        month: monthName,
        amount: monthlyTotal
      });
    }
    
    return data;
  };
  
  const monthlySpendings = generateMonthlyData();
  
  // Format currency for charts
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };
  
  // Calculate due dates statistics
  const getDueDateStats = () => {
    const today = new Date();
    const dueTomorrow = addDays(today, 1);
    const dueThisWeek = subscriptions.filter(sub => {
      const dueDate = new Date(sub.nextPaymentDate);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;
    const dueToday = subscriptions.filter(sub => 
      format(new Date(sub.nextPaymentDate), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    ).length;
    const dueTomorrowCount = subscriptions.filter(sub => 
      format(new Date(sub.nextPaymentDate), 'yyyy-MM-dd') === format(dueTomorrow, 'yyyy-MM-dd')
    ).length;
    
    return { dueToday, dueTomorrow: dueTomorrowCount, dueThisWeek };
  };
  
  const dueDateStats = getDueDateStats();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Subscription Dashboard</h1>
        <p className="text-muted-foreground">Track and manage your subscriptions</p>
      </div>
      
      {subscriptions.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-primary/20 p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-8 w-8"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Subscriptions Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Start tracking your subscriptions by adding your first one.
              You'll be able to monitor payments and get reminders before they're due.
            </p>
            <Button asChild>
              <Link to="/add-subscription">Add Your First Subscription</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Monthly Spending</CardTitle>
                <CardDescription>Total recurring payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${totalMonthlyAmount.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-1">Across {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Due Payments</CardTitle>
                <CardDescription>Upcoming subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dueDateStats.dueThisWeek}</div>
                <div className="flex flex-col text-sm text-muted-foreground mt-1">
                  <span>{dueDateStats.dueToday > 0 ? `${dueDateStats.dueToday} due today` : 'None due today'}</span>
                  <span>{dueDateStats.dueTomorrow > 0 ? `${dueDateStats.dueTomorrow} due tomorrow` : 'None due tomorrow'}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Calendar View</CardTitle>
                <CardDescription>See your payment schedule</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-semibold">{format(new Date(), 'MMMM')}</div>
                  <p className="text-sm mt-1">View your payment calendar</p>
                </div>
                <Button asChild>
                  <Link to="/calendar">Open Calendar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trends</CardTitle>
                <CardDescription>Your subscription spending over the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySpendings} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                      <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>How your subscriptions are distributed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Monthly Amount']} />
                      <Legend formatter={(value, entry) => `${value} (${categoryData.find(item => item.name === value)?.count})`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Upcoming Payments */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Upcoming Payments</CardTitle>
                  <CardDescription>Subscriptions due soon</CardDescription>
                </div>
                <Tabs value={timeframe} className="w-[400px]" onValueChange={(v) => setTimeframe(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="7days">7 Days</TabsTrigger>
                    <TabsTrigger value="30days">30 Days</TabsTrigger>
                    <TabsTrigger value="90days">90 Days</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingPayments.length > 0 ? (
                <div className="divide-y">
                  {upcomingPayments.map(subscription => (
                    <div key={subscription.id} className="p-4">
                      <SubscriptionCard subscription={subscription} compact />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No upcoming payments in the selected timeframe</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;

import React, { useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionCard from './SubscriptionCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BillingCycle, SubscriptionCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const SubscriptionsView = () => {
  const { subscriptions } = useSubscription();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [billingCycleFilter, setBillingCycleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  
  const filteredAndSortedSubscriptions = subscriptions
    .filter(sub => {
      // Search filter
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           sub.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || sub.category === categoryFilter;
      
      // Billing cycle filter
      const matchesBillingCycle = billingCycleFilter === 'all' || sub.billingCycle === billingCycleFilter;
      
      return matchesSearch && matchesCategory && matchesBillingCycle;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'amount-low':
          return a.amount - b.amount;
        case 'amount-high':
          return b.amount - a.amount;
        case 'date':
          return new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime();
        default:
          return 0;
      }
    });
  
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Your Subscriptions</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage all your subscription services</p>
        </div>
        
        <Button asChild size="sm" className="w-full md:w-auto">
          <Link to="/add-subscription">Add Subscription</Link>
        </Button>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="sm:col-span-2">
          <Input
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.values(SubscriptionCategory).map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={billingCycleFilter} onValueChange={setBillingCycleFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by billing cycle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Billing Cycles</SelectItem>
            {Object.values(BillingCycle).map(cycle => (
              <SelectItem key={cycle} value={cycle}>{cycle}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="sm:col-span-2 md:col-span-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="amount-low">Amount (Low to High)</SelectItem>
              <SelectItem value="amount-high">Amount (High to Low)</SelectItem>
              <SelectItem value="date">Next Payment Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Subscriptions List */}
      {filteredAndSortedSubscriptions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredAndSortedSubscriptions.map(subscription => (
            <SubscriptionCard key={subscription.id} subscription={subscription} />
          ))}
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-6 md:p-8 text-center">
          <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">No subscriptions found</p>
          {searchQuery || categoryFilter !== 'all' || billingCycleFilter !== 'all' ? (
            <Button variant="outline" size="sm" onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setBillingCycleFilter('all');
            }}>
              Clear Filters
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/add-subscription">Add Your First Subscription</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionsView;

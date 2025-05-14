
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { CalendarDay, MonthData } from '@/types';
import SubscriptionCard from './SubscriptionCard';
import { Badge } from '@/components/ui/badge';

const CalendarView = () => {
  const { subscriptions } = useSubscription();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const start = startOfWeek(startOfMonth(date));
    const end = endOfWeek(endOfMonth(date));
    
    let day = start;
    const days: CalendarDay[] = [];
    
    while (day <= end) {
      const subscriptionsOnDay = subscriptions.filter(sub => 
        isSameDay(new Date(sub.nextPaymentDate), day)
      );
      
      days.push({
        date: new Date(day),
        subscriptions: subscriptionsOnDay,
        isCurrentMonth: isSameMonth(day, date),
        isToday: isSameDay(day, new Date())
      });
      
      day = addDays(day, 1);
    }
    
    return days;
  };
  
  const getMonthData = (date: Date): MonthData => {
    const subscriptionsThisMonth = subscriptions.filter(sub => 
      isSameMonth(new Date(sub.nextPaymentDate), date)
    );
    
    const totalAmount = subscriptionsThisMonth.reduce((sum, sub) => sum + sub.amount, 0);
    
    return {
      month: date,
      totalAmount,
      subscriptionCount: subscriptionsThisMonth.length,
      subscriptions: subscriptionsThisMonth
    };
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const days = getDaysInMonth(currentMonth);
  const monthData = getMonthData(currentMonth);
  
  const selectedDayData = days.find(day => isSameDay(day.date, selectedDate));
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendar View</h1>
          <p className="text-muted-foreground">Track your subscription payments by date</p>
        </div>
        
        <Card className="px-4 py-3 w-full md:w-auto">
          <div className="flex justify-between items-center gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Total for {format(currentMonth, 'MMMM yyyy')}</p>
              <p className="text-xl font-bold">${monthData.totalAmount.toFixed(2)}</p>
            </div>
            
            <Badge variant="outline" className="text-sm">
              {monthData.subscriptionCount} Payment{monthData.subscriptionCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Calendar Grid */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-xl">{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>Next</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 text-center py-2 border-b bg-muted/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-sm font-medium py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, i) => (
              <div
                key={i}
                className={`
                  min-h-[100px] p-2 border border-border relative
                  ${!day.isCurrentMonth ? 'bg-muted/40 text-muted-foreground' : ''}
                  ${day.isToday ? 'bg-primary/5' : ''}
                  ${isSameDay(day.date, selectedDate) ? 'ring-2 ring-primary' : ''}
                `}
                onClick={() => setSelectedDate(day.date)}
              >
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-sm
                  ${day.isToday ? 'bg-primary text-primary-foreground' : ''}
                `}>
                  {format(day.date, 'd')}
                </div>
                
                {day.subscriptions.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {day.subscriptions.slice(0, 2).map(sub => (
                      <div 
                        key={sub.id} 
                        className="text-xs font-medium px-1.5 py-0.5 rounded-sm truncate"
                        style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                      >
                        {sub.name}
                      </div>
                    ))}
                    {day.subscriptions.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{day.subscriptions.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Selected Day Details */}
        <div className="bg-card rounded-lg shadow p-4">
          <h3 className="font-medium border-b pb-2">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          
          <div className="mt-4">
            {selectedDayData?.subscriptions.length ? (
              <div className="space-y-3">
                {selectedDayData.subscriptions.map(sub => (
                  <SubscriptionCard key={sub.id} subscription={sub} compact />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No subscriptions due on this date</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;

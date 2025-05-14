import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Subscription } from '@/types';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface SubscriptionCardProps {
  subscription: Subscription;
  compact?: boolean;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription, compact = false }) => {
  const navigate = useNavigate();
  const { deleteSubscription } = useSubscription();
  
  const { 
    id, 
    name, 
    description, 
    amount, 
    currency, 
    billingCycle, 
    category, 
    nextPaymentDate,
    logoText,
    color
  } = subscription;
  
  const isPaymentSoon = () => {
    const today = new Date();
    const paymentDate = new Date(nextPaymentDate);
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };
  
  const isPaymentOverdue = () => {
    const today = new Date();
    const paymentDate = new Date(nextPaymentDate);
    return paymentDate < today;
  };
  
  const handleEdit = () => {
    navigate(`/edit-subscription/${id}`);
  };
  
  const handleDelete = () => {
    deleteSubscription(id);
  };
  
  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-card border hover:shadow-md transition-all">
        <div className="flex items-center">
          <div className="subscription-logo w-8 h-8 md:w-10 md:h-10" style={{ backgroundColor: `${color}20`, color: color }}>
            <span className="text-sm md:text-base">{logoText}</span>
          </div>
          <div className="ml-2 md:ml-3">
            <h4 className="font-medium text-sm md:text-base">{name}</h4>
            <p className="text-xs md:text-sm text-muted-foreground">{format(nextPaymentDate, 'MMM d')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-sm md:text-base">{currency}{amount.toFixed(2)}</p>
          <Badge variant={isPaymentSoon() ? "secondary" : isPaymentOverdue() ? "destructive" : "outline"} className="text-[10px] md:text-xs">
            {isPaymentOverdue() ? "Overdue" : isPaymentSoon() ? "Soon" : billingCycle}
          </Badge>
        </div>
      </div>
    );
  }
  
  return (
    <Card className="subscription-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="subscription-logo w-10 h-10 md:w-12 md:h-12 mr-2 md:mr-3" style={{ backgroundColor: `${color}20`, color: color }}>
              <span className="text-base md:text-lg">{logoText}</span>
            </div>
            <div>
              <h3 className="font-semibold text-base md:text-lg">{name}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{category}</p>
            </div>
          </div>
          <Badge variant={isPaymentSoon() ? "secondary" : isPaymentOverdue() ? "destructive" : "outline"} className="text-xs">
            {isPaymentOverdue() ? "Overdue" : isPaymentSoon() ? "Due Soon" : billingCycle}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {description && (
          <p className="text-xs md:text-sm text-muted-foreground mb-2">{description}</p>
        )}
        
        <div className="flex justify-between items-center mt-2">
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">Next Payment</p>
            <p className="font-medium text-sm md:text-base">{format(nextPaymentDate, 'MMM d, yyyy')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs md:text-sm text-muted-foreground">Amount</p>
            <p className="font-bold text-base md:text-lg">{currency}{amount.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={handleEdit} className="text-xs md:text-sm">
            Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="text-xs md:text-sm">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw] md:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base md:text-lg">Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm md:text-base">
                  This will permanently delete the "{name}" subscription. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs md:text-sm">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="text-xs md:text-sm">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionCard;

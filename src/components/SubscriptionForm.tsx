import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { BillingCycle, SubscriptionCategory } from '@/types';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SubscriptionFormProps {
  editMode?: boolean;
  subscriptionId?: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Subscription name is required"),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  currency: z.literal("€"),
  billingCycle: z.nativeEnum(BillingCycle),
  paymentDate: z.date({
    required_error: "Payment date is required",
  }),
  category: z.nativeEnum(SubscriptionCategory),
  websiteUrl: z.string().url("Please enter a valid URL").or(z.string().length(0)),
  logoUrl: z.string().optional(),
});

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ editMode = false, subscriptionId }) => {
  const navigate = useNavigate();
  const { subscriptions, addSubscription, updateSubscription } = useSubscription();
  const [isExtractingFavicon, setIsExtractingFavicon] = useState(false);
  
  // Find subscription to edit if in edit mode
  const subscriptionToEdit = editMode && subscriptionId 
    ? subscriptions.find(sub => sub.id === subscriptionId) 
    : undefined;
  
  // Set default form values based on edit mode
  const defaultValues = editMode && subscriptionToEdit 
    ? {
        name: subscriptionToEdit.name,
        description: subscriptionToEdit.description,
        amount: subscriptionToEdit.amount,
        currency: subscriptionToEdit.currency,
        billingCycle: subscriptionToEdit.billingCycle,
        paymentDate: new Date(subscriptionToEdit.paymentDate),
        category: subscriptionToEdit.category,
        websiteUrl: subscriptionToEdit.logoUrl ? subscriptionToEdit.logoUrl.replace('https://www.google.com/s2/favicons?domain=', '') : "",
      }
    : {
        name: "",
        description: "",
        amount: 0,
        currency: "€",
        billingCycle: BillingCycle.MONTHLY,
        paymentDate: new Date(),
        category: SubscriptionCategory.OTHER,
        websiteUrl: "",
      };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      currency: "€"
    } as z.infer<typeof formSchema>
  });
  
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const faviconUrl = data.websiteUrl ? `https://www.google.com/s2/favicons?domain=${data.websiteUrl}` : "";
    
    if (editMode && subscriptionToEdit) {
      updateSubscription({
        ...subscriptionToEdit,
        name: data.name,
        description: data.description || "",
        amount: data.amount,
        currency: data.currency,
        billingCycle: data.billingCycle,
        paymentDate: data.paymentDate,
        category: data.category,
        logoUrl: faviconUrl,
        logoText: data.name.substring(0, 2).toUpperCase(),
        nextPaymentDate: new Date(), // This will be recalculated in the context
      });
    } else {
      addSubscription({
        name: data.name,
        description: data.description || "",
        amount: data.amount,
        currency: data.currency,
        billingCycle: data.billingCycle,
        paymentDate: data.paymentDate,
        category: data.category,
        logoUrl: faviconUrl,
        logoText: data.name.substring(0, 2).toUpperCase(),
        color: "", // This will be set based on category in the context
      });
    }
    
    navigate('/subscriptions');
  };

  const extractFavicon = async () => {
    const websiteUrl = form.getValues('websiteUrl');
    if (!websiteUrl) {
      toast.error("Please enter a website URL first");
      return;
    }

    setIsExtractingFavicon(true);
    
    try {
      // Try to get the favicon using multiple methods
      const faviconUrls = [
        // Method 1: Direct favicon.ico
        `${new URL(websiteUrl).origin}/favicon.ico`,
        // Method 2: Apple touch icon
        `${new URL(websiteUrl).origin}/apple-touch-icon.png`,
        // Method 3: Google's favicon service as fallback
        `https://www.google.com/s2/favicons?domain=${websiteUrl}&sz=64`,
      ];

      // Try each URL until we find one that works
      for (const url of faviconUrls) {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            form.setValue('logoUrl', url);
            toast.success("Favicon extracted successfully");
            break;
          }
        } catch (error) {
          console.error(`Failed to fetch favicon from ${url}:`, error);
        }
      }
    } catch (error) {
      console.error('Error extracting favicon:', error);
      toast.error("Failed to extract favicon");
    } finally {
      setIsExtractingFavicon(false);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{editMode ? "Edit Subscription" : "Add New Subscription"}</CardTitle>
        <CardDescription>
          {editMode 
            ? "Update your subscription details below" 
            : "Enter your subscription details below to start tracking it"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Netflix" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input 
                          placeholder="https://example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={extractFavicon}
                        disabled={isExtractingFavicon || !form.getValues('websiteUrl')}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription>
                      Enter the service's website URL to extract its favicon
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Premium subscription plan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="9.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(SubscriptionCategory).map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(BillingCycle).map(cycle => (
                          <SelectItem key={cycle} value={cycle}>{cycle}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The date when the subscription payment is due
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => navigate('/subscriptions')}>
                Cancel
              </Button>
              <Button type="submit">
                {editMode ? "Update Subscription" : "Add Subscription"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SubscriptionForm;

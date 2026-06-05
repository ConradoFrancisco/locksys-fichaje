-- SQL Script to create the subscriptions table
-- Run this in your Supabase SQL Editor

-- 1. Create the subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'suspended', 'cancelled')),
    plan TEXT NOT NULL DEFAULT 'monthly' CHECK (plan IN ('monthly', 'annual')),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    started_at TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    last_payment_at TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);

-- 4. Create RLS Policies
-- Only super_admin and the tenant's admins can see their subscription
CREATE POLICY "Tenants can view their own subscription" 
ON public.subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'super_admin' OR users.tenant_id = subscriptions.tenant_id)
  )
);

-- Only super_admin can update subscriptions
CREATE POLICY "Only super_admin can update subscriptions" 
ON public.subscriptions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
);

-- Only super_admin can insert subscriptions
CREATE POLICY "Only super_admin can insert subscriptions" 
ON public.subscriptions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
);

-- 5. Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_timestamp
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscription_timestamp();

-- SQL Script to create the device_change_requests table and setup security policies.
-- Run this in your Supabase SQL Editor.

-- 0. Add phone column to employees if it doesn't exist
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone TEXT;

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.device_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    old_device_id TEXT,
    new_device_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.device_change_requests ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- policy: Admins can do everything on their tenant's requests
CREATE POLICY "Admins can select and update all requests in tenant" 
ON public.device_change_requests
AS DEFINED BY ROLE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.tenant_id = device_change_requests.tenant_id 
    AND users.role IN ('admin', 'super_admin', 'manager')
  )
);

-- policy: Employees can select their own requests
CREATE POLICY "Employees can view their own requests" 
ON public.device_change_requests
FOR SELECT
USING (auth.uid() = employee_id);

-- policy: Employees can insert their own requests
CREATE POLICY "Employees can insert their own requests" 
ON public.device_change_requests
FOR INSERT
WITH CHECK (auth.uid() = employee_id);

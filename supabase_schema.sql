-- Create Barbearias table
CREATE TABLE IF NOT EXISTS public.barbearias (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL,
    logo TEXT,
    location TEXT,
    phone TEXT,
    "isOnboarded" BOOLEAN DEFAULT false,
    barbers JSONB DEFAULT '[]'::jsonb,
    services JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    "barbeariaId" UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
    "barberId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL
);

-- Set up Row Level Security (RLS) for barbearias
ALTER TABLE public.barbearias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
    ON public.barbearias FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users only"
    ON public.barbearias FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
    ON public.barbearias FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for super admin"
    ON public.barbearias FOR UPDATE
    USING (auth.jwt() ->> 'email' = 'barbersflowbr@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'barbersflowbr@gmail.com');

CREATE POLICY "Enable delete for users based on id"
    ON public.barbearias FOR DELETE
    USING (auth.uid() = id);

CREATE POLICY "Enable delete for super admin"
    ON public.barbearias FOR DELETE
    USING (auth.jwt() ->> 'email' = 'barbersflowbr@gmail.com');

-- Set up Row Level Security (RLS) for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
    ON public.bookings FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all users"
    ON public.bookings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for all users"
    ON public.bookings FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
    ON public.bookings FOR DELETE
    USING (true);

-- Create SuperAdmin Logs table
CREATE TABLE IF NOT EXISTS public.superadmin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "barbeariaId" UUID REFERENCES public.barbearias(id) ON DELETE SET NULL,
    "barbeariaName" TEXT,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    "performedBy" TEXT DEFAULT 'superadmin',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS) for superadmin_logs
ALTER TABLE public.superadmin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for super admin only"
    ON public.superadmin_logs FOR SELECT
    USING (auth.jwt() ->> 'email' = 'barbersflowbr@gmail.com');

CREATE POLICY "Enable insert for all users"
    ON public.superadmin_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable delete for super admin only"
    ON public.superadmin_logs FOR DELETE
    USING (auth.jwt() ->> 'email' = 'barbersflowbr@gmail.com');


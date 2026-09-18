# VintnerLink: Next-Gen Wine Grape Marketplace Architecture Blueprint
## 10-Phase AI-Driven Implementation Strategy & Verification Gates

This document provides a highly structured, enterprise-grade blueprint designed to be fed directly into an AI coding agent (e.g., Cursor, Claude Engineer, or a custom LLM script). It outlines the **Next.js 15 (App Router)**, **Supabase**, and **Vercel** architecture optimized for a modern grape classifieds and crop-planning marketplace, replacing legacy forum boards with a dynamic, data-driven relational web platform.

---

## Technical Stack & Architectural Foundation

*   **Frontend/Backend Framework:** Next.js 15 (App Router, Server Actions, React Server Components)
*   **Styling & UI Components:** Tailwind CSS + Shadcn UI + Lucide React (Icons)
*   **Database & Auth Provider:** Supabase (PostgreSQL, Row-Level Security, Native Auth, Realtime)
*   **Hosting & Deployment:** Vercel (Edge Network, Environment variable sync, Vercel Cron for seasonal triggers)
*   **Form Validation & State:** React Hook Form + Zod Schema Validation

---

## Phase 1: Repo Initialization, Directory Architecture & Environment Configuration
### Objective
Establish a clean, scalable Next.js 15 repository structure configured with standard monorepo-ready patterns, custom aliases, and unified Supabase environment injections.

### AI Prompt Directive
```text
Initialize a new Next.js 15 app using the App Router, TypeScript, ESLint, and Tailwind CSS.
Create the following precise folder structure and populate the configuration files as defined.
Ensure the layout abstracts components into isolated atomic modules, uses clean TypeScript interfaces,
and configures absolute path aliases pointing `@/*` to the project root.
```

### Directory Structure & File Tree
```text
vintnerlink-marketplace/
├── .env.local
├── .env.example
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── (dashboard)/
    │   │   ├── dashboard/page.tsx
    │   │   ├── listings/
    │   │   │   ├── page.tsx
    │   │   │   ├── [id]/page.tsx
    │   │   │   └── create/page.tsx
    │   │   └── planning/page.tsx
    │   └── api/
    │       └── webhooks/supabase/route.ts
    ├── components/
    │   ├── ui/             # Shadcn generated elements
    │   ├── shared/         # Navbar, Footer, Sidebar layouts
    │   ├── marketplace/    # Classified cards, filtering sheets
    │   └── planning/       # Yield estimators, forward-contract graphs
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts   # Browser-safe client
    │   │   ├── server.ts   # Server Component-safe client
    │   │   └── middleware.ts # Route/Auth protection middleware
    │   ├── utils.ts        # Tailwind merge & formatting helpers
    │   └── validation/     # Zod schema definitions
    └── types/
        └── index.ts        # Shared TypeScript interfaces
```

### Configuration Baseplates

#### `.env.example`
```ini
# Core Next.js Deployment Configs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Infrastructure (Replace with your Supabase Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration (Future Scope for Premium Listings/Verifications)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
```

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 🎯 Verification Gate 1
*   **Action:** Execute `npm run dev`. Ensure compiling completes cleanly with no TypeScript path resolution errors.
*   **Audit Check:** Verify `.env.local` contains valid strings and is explicitly omitted via `.gitignore`.

---

## Phase 2: Supabase Relational Schema, Migrations & Row-Level Security (RLS)
### Objective
Design and implement a highly structured relational SQL schema matching growers, buyers, classified listings, and forward-looking crop parameters.

### AI Prompt Directive
```text
Write a raw PostgreSQL migration script for Supabase. 
The schema must support user roles ('grower', 'buyer', 'admin'), a 'profiles' table linked to auth.users via triggers, 
a 'listings' table for grape classifieds, and a 'crop_plans' table for multi-year forecasting. 
Enable strict Row-Level Security (RLS) policies on all tables so users can read public records, 
but modify only their own data.
```

### SQL Database Schema
```sql
-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. Create Enums for Structural Domain Restraints
create type user_role as enum ('grower', 'buyer', 'admin');
create type listing_status as enum ('available', 'pending', 'sold', 'archived');
create type crop_status as enum ('dormant', 'flowering', 'veraison', 'harvested');

-- 2. Profiles Table (Linked to Supabase Auth)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    company_name text not null,
    contact_phone text,
    role user_role not null default 'buyer',
    region_ava text,
    is_verified boolean default false not null
);

-- 3. Grape Classified Listings Table
create table public.listings (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    variety text not null, -- e.g., Cabernet Sauvignon, Chardonnay
    clone text,            -- e.g., Dijon 777, To Kalon Clone 4
    rootstock text,        -- e.g., 110R, SO4
    region_ava text not null,
    estimated_tons numeric(10,2) not null,
    minimum_tons numeric(10,2) default 1.00 not null,
    price_per_ton numeric(10,2) not null,
    brix_target numeric(4,1),
    description text,
    status listing_status default 'available' not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Forward Crop Planning & Futures Alignment Table
create table public.crop_plans (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    harvest_year integer not null, -- e.g., 2027, 2028
    variety text not null,
    block_identifier text,         -- e.g., "North Block Hillside"
    projected_tons numeric(10,2) not null,
    current_status crop_status default 'dormant' not null,
    buyer_aligned_id uuid references public.profiles(id) on delete set null,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Automate Profile Creation on Supabase Auth SignUp
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, company_name, role, region_ava)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'company_name', 'Independent Vineyard/Winery'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer'::user_role),
    new.raw_user_meta_data->>'region_ava'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Row-Level Security (RLS) Multi-Tenant Policies
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.crop_plans enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id);

-- Listings Policies
create policy "Listings are viewable by anyone." on public.listings for select using (true);
create policy "Growers can insert their own listings." on public.listings for insert with check (auth.uid() = user_id);
create policy "Growers can update their own listings." on public.listings for update using (auth.uid() = user_id);

-- Crop Plans Policies
create policy "Users can view their own crop plans." on public.crop_plans for select using (auth.uid() = user_id OR auth.uid() = buyer_aligned_id);
create policy "Growers can modify their own crop plans." on public.crop_plans for all using (auth.uid() = user_id);
```

### 🎯 Verification Gate 2
*   **Action:** Run the SQL block inside the Supabase SQL Editor.
*   **Audit Check:** Verify under Database -> Tables that all 3 custom tables are generated, and RLS displays a shield icon confirming active rules.

---

## Phase 3: High-Performance Server-Side Supabase Client Setup
### Objective
Establish deterministic, cookie-driven server and client abstractions for Supabase to interact securely inside server actions, middleware, and client hooks.

### AI Prompt Directive
```text
Write the integration scripts for Supabase within Next.js using `@supabase/ssr`. 
Implement a file-based pattern separating the browser client, the route-safe server client, 
and edge-compatible middleware configuration that securely refreshes authentication tokens automatically.
```

### Core Supabase Connectors

#### `src/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

#### `src/lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Suppressed down-level exceptions if mutated during a Server Component render
          }
        },
      },
    }
  );
};
```

#### `src/lib/supabase/middleware.ts`
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Route guarding example
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

### 🎯 Verification Gate 3
*   **Action:** Hook middleware up within the core Next.js root middleware file (`src/middleware.ts`).
*   **Audit Check:** Direct a generic browser tab to `/dashboard`. It should gracefully intercept the route and redirect to `/login`.

---

## Phase 4: Secured Multi-Tenant Authentication & Dynamic Onboarding
### Objective
Construct multi-tenant registration that maps additional metadata properties (Company Name, AVA, Role) securely into public.profiles during identity collection.

### AI Prompt Directive
```text
Build a React-Hook-Form configuration wrapped with Zod validation managing registration data.
It must capture: Email, Password, Company Name, Region AVA, and User Role ('grower' or 'buyer').
Use Next.js Server Actions to process the registration through Supabase Auth, passing metadata properties down.
```

### Zod Validation Schema (`src/lib/validation/auth.ts`)
```typescript
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid commercial email address." }),
  password: z.string().min(8, { message: "Security standard requires minimum 8 characters." }),
  companyName: z.string().min(2, { message: "Registered entity name is required." }),
  role: z.enum(['grower', 'buyer'], { message: "Must define a primary marketplace intent." }),
  regionAva: z.string().min(2, { message: "Specify operational AVA region." }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
```

### Server Action Processor (`src/app/(auth)/register/actions.ts`)
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { RegisterSchema, type RegisterInput } from '@/lib/validation/auth';
import { redirect } from 'next/navigation';

export async function handleSignUp(formData: RegisterInput) {
  const validation = RegisterSchema.safeParse(formData);
  if (!validation.success) {
    throw new Error("Data manipulation vector rejected by validation schema.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        company_name: formData.companyName,
        role: formData.role,
        region_ava: formData.regionAva,
      },
    },
  });

  if (error) return { error: error.message };
  
  redirect('/dashboard');
}
```

### 🎯 Verification Gate 4
*   **Action:** Submit a mock user via the web interface.
*   **Audit Check:** Inspect Supabase Dashboard -> Auth. Ensure the user is registered, and check `public.profiles` to confirm the trigger automatically instantiated the profile parameters.

---

## Phase 5: Modern Grape Classifieds Engine (Listing Logic & Server Actions)
### Objective
Implement the multi-criteria classifieds intake pipeline allowing growers to safely publish active yields, clones, pricing structures, and specifications.

### AI Prompt Directive
```text
Write a Server Action to handle creating classified listings.
The fields are: title, variety, clone, rootstock, region_ava, estimated_tons, price_per_ton, brix_target, and description.
Validate input values using Zod, enforce numeric precision, query the user profile to confirm authorization, and insert into public.listings.
```

### Listing Handler (`src/app/(dashboard)/listings/create/actions.ts`)
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const CreateListingSchema = z.object({
  title: z.string().min(5),
  variety: z.string().min(2),
  clone: z.string().optional(),
  rootstock: z.string().optional(),
  region_ava: z.string().min(2),
  estimated_tons: z.number().positive(),
  price_per_ton: z.number().positive(),
  brix_target: z.number().min(10).max(40).optional(),
  description: z.string().min(10),
});

export async function createNewListing(data: z.infer<typeof CreateListingSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized access token context.");

  const validation = CreateListingSchema.safeParse(data);
  if (!validation.success) throw new Error("Invalid payload inputs.");

  const { error } = await supabase
    .from('listings')
    .insert({
      user_id: user.id,
      ...validation.data,
      status: 'available'
    });

  if (error) return { error: error.message };

  revalidatePath('/listings');
  redirect('/listings');
}
```

### 🎯 Verification Gate 5
*   **Action:** Submit a test listing via the server action.
*   **Audit Check:** Verify state update occurs immediately on `/listings` utilizing the native Next.js path caching invalidation method.

---

## Phase 6: Precision Search & Parametric Micro-Filtering UI
### Objective
Construct an intuitive marketplace search portal replacing legacy text interfaces with analytical parameters (AVA filtering, Tonnage ranges, Brix tolerances).

### AI Prompt Directive
```text
Construct a Next.js client component for searching listings. 
Incorporate real-time multi-select filters for Grape Varieties, AVA Regions, Minimum Tonnage, and Price Ceiling.
Pass state alterations cleanly via Next.js `useSearchParams` hook to keep URL state synchronized.
```

### Search Component Context Blueprint (`src/components/marketplace/FilterPanel.tsx`)
```typescript
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export default function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    startTransition(() => {
      router.push(`/listings?${params.toString()}`);
    });
  }

  return (
    <div className="p-4 border rounded-xl bg-white space-y-4">
      <h3 className="font-semibold text-lg">Marketplace Micro-Filters</h3>
      <div>
        <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">AVA Viticultural Region</label>
        <select 
          onChange={(e) => updateFilter('region_ava', e.target.value)}
          defaultValue={searchParams.get('region_ava') || ""}
          className="w-full mt-1 p-2 border rounded-md"
        >
          <option value="">All Regions</option>
          <option value="Napa Valley">Napa Valley</option>
          <option value="Paso Robles">Paso Robles</option>
          <option value="Willamette Valley">Willamette Valley</option>
        </select>
      </div>
      {isPending && <p className="text-xs text-amber-600 animate-pulse">Syncing vineyard options...</p>}
    </div>
  );
}
```

### 🎯 Verification Gate 6
*   **Action:** Choose "Paso Robles" in the dropdown list.
*   **Audit Check:** Ensure the browser URL query string appends `?region_ava=Paso+Robles` dynamically without causing a visible window refresh.

---

## Phase 7: Crop Lifecycle Planning & Forward-Contract Alignment Module
### Objective
Build the cornerstone differentiator from standard classified boards: an internal dashboard enabling growers to chart next year’s blocks and map multi-year alignments with buyers.

### AI Prompt Directive
```text
Build a crop planning component for the dashboard. 
It must list upcoming data points inside `public.crop_plans`, grouping properties by harvest year.
Include a dialog modal component allowing growers to add a forecasted block with fields for 
'projected_tons' and 'current_status' (dormant, flowering, veraison, harvested).
```

### Plan Form Module Structure (`src/components/planning/AddCropPlanDialog.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AddCropPlanDialog() {
  const [variety, setVariety] = useState('');
  const [projectedTons, setProjectedTons] = useState('');
  const [harvestYear, setHarvestYear] = useState(new Date().getFullYear() + 1);

  async function handleCreatePlan() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase.from('crop_plans').insert({
      user_id: user.id,
      variety,
      projected_tons: parseFloat(projectedTons),
      harvest_year: harvestYear,
      current_status: 'dormant'
    });

    window.location.reload();
  }

  return (
    <div className="p-6 border bg-amber-50/50 rounded-xl space-y-4">
      <h3 className="font-bold text-lg text-amber-900">Forecast Next Harvest Crop Cycle</h3>
      <input type="text" placeholder="Variety (e.g. Merlot)" onChange={e => setVariety(e.target.value)} className="p-2 border rounded w-full"/>
      <input type="number" placeholder="Projected Yield (Tons)" onChange={e => setProjectedTons(e.target.value)} className="p-2 border rounded w-full"/>
      <button onClick={handleCreatePlan} className="bg-amber-800 text-white font-medium px-4 py-2 rounded-md">Save Futures Allocation Block</button>
    </div>
  );
}
```

### 🎯 Verification Gate 7
*   **Action:** Insert a planning record targeted for the next calendar year.
*   **Audit Check:** Inspect Supabase Table view to verify column parameters write accurately without integrity violations.

---

## Phase 8: Realtime Notification Engine & Buyer Match Alerts
### Objective
Configure event triggers to automatically alert winemakers via Supabase Realtime when varieties matching their interest parameters are posted.

### AI Prompt Directive
```text
Write a React hook leveraging Supabase Realtime capabilities (`supabase.channel`). 
It must monitor the database and trigger a toast notification or state push whenever a 
new row matching specific variety conditions is appended into the listings table.
```

### Realtime Listener Hook (`src/lib/supabase/useRealtimeListings.ts`)
```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from './client';

export function useRealtimeListings() {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'listings' },
        (payload) => {
          const newRow = payload.new as any;
          setAlertMessage(`New Yield Alert: ${newRow.estimated_tons} Tons of ${newRow.variety} just listed in ${newRow.region_ava}!`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { alertMessage, setAlertMessage };
}
```

### 🎯 Verification Gate 8
*   **Action:** Open the app layout concurrently in an incognito frame. Submit a fresh classified listing on one profile.
*   **Audit Check:** Verify the independent monitoring browser session fires the real-time event hook instantly.

---

## Phase 9: Vercel Target Deployment Optimization & Production Variables
### Objective
Prepare the application for enterprise staging deployment across the Vercel infrastructure network.

### AI Prompt Directive
```text
Configure deployment setups including global production definitions. 
Write a script verification checking production configurations for build consistency, static asset image caching limits, 
and database query pooling structures.
```

### Production Checklist Mapping
1.  **Configure Deployment Pipeline:** Link the GitHub repository structure to the Vercel project control dash.
2.  **Establish Environment Bindings:** Map the exact properties defined inside Phase 1 into **Vercel Settings -> Environment Variables**.
3.  **Supabase Connection Pooling Config:** Point production servers to Supabase’s internal transactional pooler string (`port 6543`) to avoid runtime connection starvation.

### 🎯 Verification Gate 9
*   **Action:** Trigger remote project compilation via `git push origin main`.
*   **Audit Check:** Ensure the deployment log returns a green build status with zero code splitting compilation faults.

---

## Phase 10: Global System E2E Audit & Platform Handshake Verification
### Objective
Perform an end-to-end integration sequence confirming proper data execution across layers before public launch.

### Automated End-to-End System Audit Sequence
1.  **Identity Execution Check:** Create an identity sequence matching a local Grower user on the production client.
2.  **Classified Ingestion Check:** Execute dynamic payload placement containing custom Clone data types.
3.  **Cross-Tenant Check:** Authenticate using an independent Buyer login session, execute search filters targeting that AVA, and view the listing data.
4.  **Forward Asset Ledger Check:** Access the Planning system, alter an internal vineyard block lifecycle marker from `dormant` to `veraison`, and confirm persistent storage updates.

### 🎯 Final Performance Gate 10
*   **Action:** Inspect network transaction traces inside Vercel log analytics.
*   **Audit Check:** Confirm absolute query routing metrics register execution runtimes below **150ms**.
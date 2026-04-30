# SportWear Admin Hub — ERP MVP

A fully functional ERP system built with React + TanStack Router + Supabase.

## Setup

### 1. Configure Supabase

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

Find these values in: **Supabase Dashboard → Project Settings → API**

### 2. Install & Run

```bash
npm install
npm run dev
```

## ERP Workflow (Demo Flow)

```
1. Login         →  Use credentials from your Users table (or any email + 4+ char password for demo mode)
2. Orders page   →  Click "New Order" → Select customer → Add multiple products → Create
3. Orders page   →  Click "Confirm ✓" on the new order
4. Supabase      →  Triggers auto-generate Invoice + update Inventory
5. Invoices page →  See the auto-generated invoice
6. Invoices page →  Click "Pay" → Record payment method + amount
7. Payments page →  Payment logged, invoice marked paid
8. Dashboard     →  KPIs update with live Supabase data
9. Inventory     →  Stock levels reflect trigger-based deductions
```

## Architecture

```
Sales → Orders → OrderItems → Inventory (auto via trigger)
                           → Invoices  (auto via trigger)
                                     → Payments
```

## Database Tables

- **Users** — ERP operators (login)
- **Customers** — buyers
- **Products** — sportswear catalogue
- **Inventory** — stock levels per product
- **Orders** — sales orders (processing → confirmed → shipped → delivered)
- **OrderItems** — line items per order
- **Invoices** — auto-generated when order is confirmed
- **Payments** — payment records against invoices

## Module Pages

| Route | Module | Description |
|---|---|---|
| `/dashboard` | KPIs | Revenue, orders, stock, charts |
| `/orders` | Orders | Create orders with multi-item support |
| `/inventory` | Inventory | Stock levels with low-stock alerts |
| `/invoices` | Finance | Auto-generated invoices, payment trigger |
| `/payments` | Finance | Payment history and totals |

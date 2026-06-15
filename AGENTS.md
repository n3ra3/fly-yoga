# Fly Yoga Studio

## Project Overview

Fly Yoga Studio is a modern yoga studio website located in Chisinau, Moldova.

The website serves three purposes:

1. Attract new clients.
2. Allow users to book yoga classes.
3. Allow users to submit hall rental requests.

The project should be simple to maintain, scalable, secure and inexpensive to host.

---

# Business Information

Studio Name:
Fly Yoga Studio

Location:
Chisinau, Moldova

Studio Type:
Single-location yoga studio

Main Services:

* Fly Yoga
* Yoga classes
* Private sessions
* Hall rental

Target Audience:

* Beginners
* Experienced practitioners
* Men
* Women
* Teenagers
* Adults
* Seniors

Main Languages:

1. Russian (default)
2. Romanian
3. English

---

# Technology Stack

Frontend:

* React
* TypeScript
* Vite
* React Router
* TailwindCSS
* shadcn/ui

Backend:

* Supabase only

Database:

* PostgreSQL (Supabase)

Authentication:

* Supabase Auth

Storage:

* Supabase Storage

Hosting:

* Vercel

Package Manager:

* npm

---

# Architecture Rules

IMPORTANT:

Do NOT create:

* Express.js backend
* NestJS backend
* Custom API server
* Separate backend repository

Use Supabase for:

* Authentication
* Database
* File Storage
* Security Policies

All CRUD operations must use Supabase.

---

# Code Standards

Always use:

* Strict TypeScript
* Functional React Components
* Reusable Components
* Custom Hooks when needed
* Clean Code principles

Avoid:

* Duplicated code
* Large components (>300 lines when possible)
* Hardcoded values
* Inline styles

Use:

* Type-safe code
* Consistent naming
* Modular architecture

---

# Folder Structure

Preferred structure:

src/

components/
pages/
layouts/
hooks/
services/
lib/
types/
contexts/
features/
assets/
i18n/

Do not place business logic inside UI components.

---

# Design Guidelines

Style:

* Minimalistic
* Premium Wellness
* Modern
* Calm
* Elegant

Inspired by:

* Apple
* Airbnb
* Calm
* Headspace
* Alo Yoga

Colors:

* White
* Beige
* Cream
* Light Gray
* Soft Green

Avoid:

* Neon colors
* Heavy gradients
* Excessive shadows
* Outdated UI

Use:

* Large typography
* Spacious layouts
* Clean sections
* Smooth animations

Design should feel trustworthy and premium.

---

# Mobile First

All pages must be designed mobile-first.

Support:

* Mobile phones
* Tablets
* Laptops
* Desktop monitors

Responsive design is mandatory.

---

# Internationalization

Use:

* i18next

Languages:

* RU
* RO
* EN

Requirements:

* Russian is default
* All text must be translatable
* Never hardcode text inside components
* Store translations separately

---

# Database Structure

Core entities:

users
profiles
trainers
classes
bookings
subscriptions
subscription_plans
attendance
reviews
hall_rental_requests

Relationships must be normalized.

Use foreign keys.

Create indexes where needed.

---

# Authentication

Use Supabase Auth only.

Supported:

* Email registration
* Email login
* Password reset

User fields:

* First Name
* Last Name
* Email
* Phone

Never store passwords manually.

---

# User Dashboard

Users should be able to:

* View bookings
* Cancel bookings
* View attendance history
* View active subscription
* Edit profile

---

# Admin Panel

Admin users can:

* Manage trainers
* Manage schedules
* Manage subscriptions
* Manage bookings
* Manage reviews
* Manage rental requests

Admin role must be protected.

---

# Scheduling System

Schedule data must come from Supabase.

Features:

* Daily schedule
* Weekly schedule
* Available seats
* Booking system

Users can:

* Book classes
* Cancel bookings

---

# Hall Rental

Create a dedicated page for hall rental.

Required fields:

* Name
* Phone
* Email
* Event Description
* Preferred Date

Store requests in Supabase.

---

# Gallery

Images should come from Supabase Storage.

While developing:

Use placeholder images.

When creating gallery features:

Explain where images should be uploaded.

---

# SEO

Required:

* SEO-friendly URLs
* Meta tags
* Open Graph
* Sitemap
* Robots.txt

Performance is important.

---

# Security

Must implement:

* Row Level Security (RLS)
* Protected routes
* Input validation
* Secure authentication
* Proper authorization

Never expose secrets.

Never commit API keys.

Use environment variables.

---

# Deployment

Target deployment:

Frontend:
Vercel

Backend:
Supabase

The project must work on free plans.

---

# Development Workflow

Before creating new code:

1. Analyze existing project structure.
2. Reuse existing components.
3. Follow current architecture.
4. Avoid introducing new dependencies unless necessary.

When generating code:

* Explain what files are created.
* Explain where code should be placed.
* Explain why the solution was chosen.

Always prefer maintainability over complexity.

---

# Important Rule

This project is maintained by a solo developer.

Solutions should be:

* Simple
* Readable
* Easy to debug
* Easy to extend

Avoid enterprise-level overengineering.

Favor practical solutions that can be maintained by one developer.

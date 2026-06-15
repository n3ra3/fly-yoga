import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Trainer = Database['public']['Tables']['trainers']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type Schedule = Database['public']['Tables']['schedule']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Attendance = Database['public']['Tables']['attendance']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type HallRentalRequest = Database['public']['Tables']['hall_rental_requests']['Row']

export type Language = 'ru' | 'ro' | 'en'
export type UserRole = 'user' | 'trainer' | 'admin'
export type ClassLevel = 'beginner' | 'intermediate' | 'advanced' | 'all'
export type BookingStatus = 'confirmed' | 'cancelled' | 'attended' | 'no_show'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'
export type RentalStatus = 'new' | 'contacted' | 'confirmed' | 'declined'

export type ScheduleWithRelations = Schedule & {
  classes: Pick<Class, 'id' | 'name_ru' | 'name_ro' | 'name_en' | 'duration_min' | 'level' | 'color'>
  trainers: Pick<Trainer, 'id' | 'first_name' | 'last_name' | 'photo_url'>
}

export type BookingWithSchedule = Booking & {
  schedule: ScheduleWithRelations
}

export type BookingWithUser = Booking & {
  profiles: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'phone' | 'avatar_url'>
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'

import { AuthProvider } from '@/contexts/AuthContext'
import { LotusBackground } from '@/components/LotusBackground'
import { ScrollToTop } from '@/components/ScrollToTop'
import { PublicLayout } from '@/layouts/PublicLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { TrainerLayout } from '@/layouts/TrainerLayout'

import { HomePage } from '@/pages/HomePage'
import { SchedulePage } from '@/pages/SchedulePage'
import { TrainersPage } from '@/pages/TrainersPage'
import { ServicesPage } from '@/pages/ServicesPage'
import { GalleryPage } from '@/pages/GalleryPage'
import { HallRentalPage } from '@/pages/HallRentalPage'
import { ContactPage } from '@/pages/ContactPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { BookingsPage } from '@/pages/BookingsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AdminPage } from '@/pages/AdminPage'
import { AdminTrainersPage } from '@/pages/admin/AdminTrainersPage'
import { TrainerSchedulePage } from '@/pages/trainer/TrainerSchedulePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Прокрутка наверх при переходе между страницами */}
        <ScrollToTop />
        {/* Декоративный лотос на фоне — виден на всех страницах */}
        <LotusBackground />
        <Suspense fallback={null}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/trainers" element={<TrainersPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/hall-rental" element={<HallRentalPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Navigate to="/dashboard/bookings" replace />} />
              <Route path="/dashboard/bookings" element={<BookingsPage />} />
              <Route path="/dashboard/profile" element={<ProfilePage />} />
            </Route>

            <Route element={<TrainerLayout />}>
              <Route path="/trainer" element={<TrainerSchedulePage />} />
            </Route>

            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/trainers" element={<AdminTrainersPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

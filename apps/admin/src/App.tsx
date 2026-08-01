import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CoursesAdminPage } from './pages/CoursesAdminPage';
import { RegistrationsPage } from './pages/RegistrationsPage';
import {
  FaqAdminPage,
  GraduatesAdminPage,
  InstructorsAdminPage,
  TestimonialsAdminPage,
} from './pages/SimpleCrudPages';
import {
  CalendarAdminPage,
  ChatbotAdminPage,
  ContentAdminPage,
  GalleryAdminPage,
  MediaAdminPage,
  MessagesPage,
  SettingsAdminPage,
} from './pages/MoreAdminPages';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="courses" element={<CoursesAdminPage />} />
              <Route path="registrations" element={<RegistrationsPage />} />
              <Route path="instructors" element={<InstructorsAdminPage />} />
              <Route path="faq" element={<FaqAdminPage />} />
              <Route path="testimonials" element={<TestimonialsAdminPage />} />
              <Route path="gallery" element={<GalleryAdminPage />} />
              <Route path="graduates" element={<GraduatesAdminPage />} />
              <Route path="media" element={<MediaAdminPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="content" element={<ContentAdminPage />} />
              <Route path="chatbot" element={<ChatbotAdminPage />} />
              <Route path="knowledge" element={<Navigate to="/chatbot" replace />} />
              <Route path="calendar" element={<CalendarAdminPage />} />
              <Route path="settings" element={<SettingsAdminPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

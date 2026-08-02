import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { SiteLayout } from './components/SiteLayout';
import { HomePage } from './pages/HomePage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import {
  BenefitsPage,
  InstructorsPage,
  GalleryPage,
  GraduatesPage,
  FaqPage,
} from './pages/ContentPages';
import { AboutPage } from './pages/AboutPage';
import { InstructorDetailsPage } from './pages/InstructorDetailsPage';
import { ContactPage } from './pages/ContactPage';
import { ChatPage } from './pages/ChatPage';
import { WorkshopsPage, WorkshopDetailsPage } from './pages/WorkshopsPage';
import { LocaleProvider } from './lib/locale';

const queryClient = new QueryClient();

export default function App() {
  return (
    <LocaleProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route index element={<HomePage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="courses" element={<CoursesPage />} />
                <Route path="courses/:slug" element={<CourseDetailsPage />} />
                <Route path="workshops" element={<WorkshopsPage />} />
                <Route path="workshops/:slug" element={<WorkshopDetailsPage />} />
                <Route path="instructors" element={<InstructorsPage />} />
                <Route path="instructors/:id" element={<InstructorDetailsPage />} />
                <Route path="benefits" element={<BenefitsPage />} />
                <Route path="gallery" element={<GalleryPage />} />
                <Route path="graduates" element={<GraduatesPage />} />
                <Route path="testimonials" element={<Navigate to="/graduates" replace />} />
                <Route path="faq" element={<FaqPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="contact" element={<ContactPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </LocaleProvider>
  );
}

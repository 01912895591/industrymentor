import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useFavicon } from "@/hooks/useFavicon";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Courses = lazy(() => import("@/pages/Courses"));
const Library = lazy(() => import("@/pages/Library"));
const Mentors = lazy(() => import("@/pages/Mentors"));
const Contact = lazy(() => import("@/pages/Contact"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Auth = lazy(() => import("@/pages/Auth"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Blogs = lazy(() => import("@/pages/Blogs"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const CourseEnrollment = lazy(() => import("@/pages/CourseEnrollment"));
const Stopwatch = lazy(() => import("@/pages/Stopwatch"));
const VerifyCertificate = lazy(() => import("@/pages/VerifyCertificate"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const UsersAdmin = lazy(() => import("@/features/admin/UsersAdmin").then(module => ({ default: module.UsersAdmin })));
const CertificatesAdmin = lazy(() => import("@/features/admin/CertificatesAdmin").then(module => ({ default: module.CertificatesAdmin })));
const CoursesAdmin = lazy(() => import("@/features/admin/CoursesAdmin").then(module => ({ default: module.CoursesAdmin })));
const LibraryAdmin = lazy(() => import("@/features/admin/LibraryAdmin").then(module => ({ default: module.LibraryAdmin })));
const FinanceAdmin = lazy(() => import("@/features/admin/FinanceAdmin").then(module => ({ default: module.FinanceAdmin })));
const SettingsAdmin = lazy(() => import("@/features/admin/SettingsAdmin").then(module => ({ default: module.SettingsAdmin })));
const BlogsAdmin = lazy(() => import("@/features/admin/BlogsAdmin").then(module => ({ default: module.BlogsAdmin })));
const MentorsAdmin = lazy(() => import("@/features/admin/MentorsAdmin").then(module => ({ default: module.MentorsAdmin })));
const MessagesAdmin = lazy(() => import("@/features/admin/MessagesAdmin").then(module => ({ default: module.MessagesAdmin })));
const FaviconAdmin = lazy(() => import("@/features/admin/FaviconAdmin").then(module => ({ default: module.FaviconAdmin })));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
  </div>
);

const App = () => {
  // Load dynamic favicon
  useFavicon();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route element={<SiteLayout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/mentors" element={<Mentors />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/contact-us" element={<Contact />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/blogs" element={<Blogs />} />
                    <Route path="/blog" element={<Blogs />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/stopwatch" element={<Stopwatch />} />
                    <Route path="/verify/:id" element={<VerifyCertificate />} />
                    <Route
                      path="/dashboard"
                      element={
                        <RequireAuth>
                          <Dashboard />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/enroll/:courseId"
                      element={
                        <RequireAuth>
                          <CourseEnrollment />
                        </RequireAuth>
                      }
                    />
                  </Route>

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <RequireAdmin>
                        <AdminLayout />
                      </RequireAdmin>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<UsersAdmin />} />
                    <Route path="courses" element={<CoursesAdmin />} />
                    <Route path="blogs" element={<BlogsAdmin />} />
                    <Route path="mentors" element={<MentorsAdmin />} />
                    <Route path="content" element={<LibraryAdmin />} />
                    <Route path="certificates" element={<CertificatesAdmin />} />
                    <Route path="messages" element={<MessagesAdmin />} />
                    <Route path="finance" element={<FinanceAdmin />} />
                    <Route path="favicon" element={<FaviconAdmin />} />
                    <Route path="settings" element={<SettingsAdmin />} />
                  </Route>
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;


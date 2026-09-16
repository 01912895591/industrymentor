import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const CourseLearning = lazy(() => import("@/pages/CourseLearning"));
const Library = lazy(() => import("@/pages/Library"));
const Mentors = lazy(() => import("@/pages/Mentors"));
const MentorProfile = lazy(() => import("@/pages/MentorProfile"));
const Career = lazy(() => import("@/pages/Career"));
const Contact = lazy(() => import("@/pages/Contact"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Auth = lazy(() => import("@/pages/Auth"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Blogs = lazy(() => import("@/pages/Blogs"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const CourseEnrollment = lazy(() => import("@/pages/CourseEnrollment"));
const Stopwatch = lazy(() => import("@/pages/Stopwatch"));
const VerifyCertificate = lazy(() => import("@/pages/VerifyCertificate"));
const CertificatePreview = lazy(() => import("@/pages/CertificatePreview"));
const Projects = lazy(() => import("@/pages/Projects"));
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"));
const ProjectWorkspace = lazy(() => import("@/pages/ProjectWorkspace"));
const PortfolioDashboard = lazy(() => import("@/pages/PortfolioDashboard"));
const PublicPortfolio = lazy(() => import("@/pages/PublicPortfolio"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const UsersAdmin = lazy(() => import("@/features/admin/UsersAdmin").then(module => ({ default: module.UsersAdmin })));
const CertificatesAdmin = lazy(() => import("@/features/admin/CertificatesAdmin").then(module => ({ default: module.CertificatesAdmin })));
const CoursesAdmin = lazy(() => import("@/features/admin/CoursesAdmin").then(module => ({ default: module.CoursesAdmin })));
const EnrollmentsAdmin = lazy(() => import("@/features/admin/EnrollmentsAdmin").then(module => ({ default: module.EnrollmentsAdmin })));
const LibraryAdmin = lazy(() => import("@/features/admin/LibraryAdmin").then(module => ({ default: module.LibraryAdmin })));
const FinanceAdmin = lazy(() => import("@/features/admin/FinanceAdmin").then(module => ({ default: module.FinanceAdmin })));
const SettingsAdmin = lazy(() => import("@/features/admin/SettingsAdmin").then(module => ({ default: module.SettingsAdmin })));
const BlogsAdmin = lazy(() => import("@/features/admin/BlogsAdmin").then(module => ({ default: module.BlogsAdmin })));
const MentorsAdmin = lazy(() => import("@/features/admin/MentorsAdmin").then(module => ({ default: module.MentorsAdmin })));
const MessagesAdmin = lazy(() => import("@/features/admin/MessagesAdmin").then(module => ({ default: module.MessagesAdmin })));
const FaviconAdmin = lazy(() => import("@/features/admin/FaviconAdmin").then(module => ({ default: module.FaviconAdmin })));
const CareerSkillsAdmin = lazy(() => import("@/features/admin/career-skills/CareerSkillsAdmin").then(module => ({ default: module.CareerSkillsAdmin })));
const ProjectsAdmin = lazy(() => import("@/features/admin/projects/ProjectsAdmin").then(module => ({ default: module.ProjectsAdmin })));
const ProjectSubmissionsAdmin = lazy(() => import("@/features/admin/project-submissions/ProjectSubmissionsAdmin").then(module => ({ default: module.ProjectSubmissionsAdmin })));

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
                    <Route path="/courses/:courseId" element={<CourseDetail />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/mentors" element={<Mentors />} />
                    <Route path="/mentors/:mentorId" element={<MentorProfile />} />
                    <Route path="/career" element={<Career />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:slug" element={<ProjectDetail />} />
                    <Route
                      path="/projects/:slug/workspace"
                      element={
                        <RequireAuth>
                          <ProjectWorkspace />
                        </RequireAuth>
                      }
                    />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/contact-us" element={<Contact />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/blogs" element={<Blogs />} />
                    <Route path="/blog" element={<Blogs />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/stopwatch" element={<Stopwatch />} />
                    <Route path="/verify" element={<VerifyCertificate />} />
                    <Route path="/verify/:id" element={<VerifyCertificate />} />
                    <Route path="/certificate-preview" element={<CertificatePreview />} />
                    <Route
                      path="/dashboard"
                      element={
                        <RequireAuth>
                          <Dashboard />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/portfolio"
                      element={
                        <RequireAuth>
                          <PortfolioDashboard />
                        </RequireAuth>
                      }
                    />
                    <Route path="/portfolio/:slug" element={<PublicPortfolio />} />
                    <Route
                      path="/enroll/:courseId"
                      element={
                        <RequireAuth>
                          <CourseEnrollment />
                        </RequireAuth>
                      }
                    />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/terms" element={<Navigate to="/terms-of-service" replace />} />
                    <Route path="/refund-policy" element={<RefundPolicy />} />
                  </Route>

                  {/* Dedicated Enrolled Student Classroom (Distraction-Free LMS) */}
                  <Route
                    path="/learn/:courseId"
                    element={
                      <RequireAuth>
                        <CourseLearning />
                      </RequireAuth>
                    }
                  />

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
                    <Route path="enrollments" element={<EnrollmentsAdmin />} />
                    <Route path="blogs" element={<BlogsAdmin />} />
                    <Route path="mentors" element={<MentorsAdmin />} />
                    <Route path="content" element={<LibraryAdmin />} />
                    <Route path="certificates" element={<CertificatesAdmin />} />
                    <Route path="messages" element={<MessagesAdmin />} />
                    <Route path="finance" element={<FinanceAdmin />} />
                    <Route path="favicon" element={<FaviconAdmin />} />
                    <Route path="settings" element={<SettingsAdmin />} />
                    <Route path="career-skills" element={<CareerSkillsAdmin />} />
                    <Route path="projects" element={<ProjectsAdmin />} />
                    <Route path="project-submissions" element={<ProjectSubmissionsAdmin />} />
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


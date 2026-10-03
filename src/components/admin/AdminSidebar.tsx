import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  MessageSquare,
  Image,
  Compass,
  FolderKanban,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/components/ui/use-toast";
import { ExternalLink } from "lucide-react";
import { useLogo } from "@/hooks/useLogo";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: GraduationCap, label: "Mentors", href: "/admin/mentors" },
  { icon: BookOpen, label: "Courses", href: "/admin/courses" },
  { icon: CreditCard, label: "Enrollments", href: "/admin/enrollments" },
  { icon: Compass, label: "Career & Skills", href: "/admin/career-skills" },
  { icon: FolderKanban, label: "Projects", href: "/admin/projects" },
  { icon: ClipboardCheck, label: "Submissions", href: "/admin/project-submissions" },
  { icon: FileText, label: "Blogs", href: "/admin/blogs" },
  { icon: BookOpen, label: "Content", href: "/admin/content" },
  { icon: Award, label: "Certificates", href: "/admin/certificates" },
  { icon: MessageSquare, label: "Messages", href: "/admin/messages" },
  { icon: DollarSign, label: "Finance", href: "/admin/finance" },
  { icon: Image, label: "Favicon", href: "/admin/favicon" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

interface AdminSidebarProps {
  onClose?: () => void;
  className?: string;
}

export function AdminSidebar({ onClose, className }: AdminSidebarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { logoUrl, isLoading } = useLogo();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    toast({ title: "Signed out successfully" });
  };

  return (
    <aside className={cn("h-screen w-64 flex-col border-r bg-card/95 backdrop-blur-xl flex overflow-y-auto", className)}>
      <div className="flex h-16 items-center border-b px-6 bg-gradient-to-r from-primary/10 to-transparent">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          {isLoading ? (
            <div className="h-16 w-32" />
          ) : logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
          ) : (
            <>
              <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow">
                <span className="text-[10px] text-primary-foreground">IM</span>
              </div>
              <div>
                <span className="text-primary">Industry</span>Mentor
              </div>
            </>
          )}
        </Link>
      </div>
      <div className="flex-1 px-3 py-3 overflow-y-auto">
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-primary/20 text-primary shadow-2xs border border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-2 pt-2 border-t border-border/40">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              View Site
            </Link>
          </div>
        </nav>
      </div>
      <div className="border-t border-border/40 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2.5 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600 font-semibold text-xs sm:text-sm"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

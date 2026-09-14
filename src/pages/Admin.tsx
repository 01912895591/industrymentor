import { AmbientSpotlight } from "@/components/AmbientSpotlight";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoursesAdmin } from "@/features/admin/CoursesAdmin";
import { EnrollmentsAdmin } from "@/features/admin/EnrollmentsAdmin";
import { FinanceAdmin } from "@/features/admin/FinanceAdmin";
import { LibraryAdmin } from "@/features/admin/LibraryAdmin";
import { CertificatesAdmin } from "@/features/admin/CertificatesAdmin";
import { UsersAdmin } from "@/features/admin/UsersAdmin";

export default function Admin() {
  return (
    <AmbientSpotlight>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="rounded-3xl border border-border/60 bg-card/25 p-6 shadow-elev">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">Admin Dashboard</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage courses, enrollments & payments, library resources, certificates, and finance.
              </p>
            </div>
            <Button variant="soft" asChild>
              <a href="#admin" onClick={(e) => e.preventDefault()}>
                Admin mode
              </a>
            </Button>
          </div>
        </header>

        <section className="mt-6">
          <Tabs defaultValue="courses">
            <div className="rounded-3xl border border-border/60 bg-card/25 p-2 shadow-elev">
              <TabsList className="grid w-full grid-cols-2 gap-2 bg-transparent sm:grid-cols-6">
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                <TabsTrigger value="library">Library</TabsTrigger>
                <TabsTrigger value="certificates">Certificates</TabsTrigger>
                <TabsTrigger value="finance">Finance</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-6">
              <TabsContent value="courses" className="mt-0">
                <CoursesAdmin />
              </TabsContent>
              <TabsContent value="enrollments" className="mt-0">
                <EnrollmentsAdmin />
              </TabsContent>
              <TabsContent value="library" className="mt-0">
                <LibraryAdmin />
              </TabsContent>
              <TabsContent value="certificates" className="mt-0">
                <CertificatesAdmin />
              </TabsContent>
              <TabsContent value="finance" className="mt-0">
                <FinanceAdmin />
              </TabsContent>
              <TabsContent value="users" className="mt-0">
                <UsersAdmin />
              </TabsContent>
            </div>
          </Tabs>
        </section>
      </main>
    </AmbientSpotlight>
  );
}

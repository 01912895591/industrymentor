import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-6xl font-black tracking-tight">404</h1>
        <p className="mt-3 text-lg text-muted-foreground">Oops! Page not found.</p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

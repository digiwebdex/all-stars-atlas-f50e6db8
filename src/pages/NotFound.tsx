import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plane, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Plane className="w-10 h-10 text-primary opacity-50" />
        </div>
        <h1 className="text-6xl font-black text-foreground mb-2">404</h1>
        <h2 className="text-xl font-bold text-foreground mb-3">Page Not Found</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Looks like this flight path doesn't exist. The page you're looking for may have been moved or doesn't exist anymore.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="font-bold">
            <Link to="/">
              <Home className="w-4 h-4 mr-1.5" /> Go Home
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

import { Link } from "react-router-dom";
import { ArrowLeft, MapPinOff } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="animate-fade-in mx-auto mt-16 max-w-md text-center">
      <span
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-white"
        style={{ background: "var(--primary)" }}
      >
        <MapPinOff size={30} aria-hidden />
      </span>
      <h1 className="mt-6 font-display text-4xl font-extrabold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-ink-soft">
        That page doesn't exist, or the link is broken.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="btn-primary">
          <ArrowLeft size={16} aria-hidden /> Go home
        </Link>
        <Link to="/analytics" className="btn-ghost">
          Class Analytics
        </Link>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firstNameOf } from "@/lib/format";

const STORAGE_KEY = "paisaflow-welcomed";

/**
 * Animated welcome popup shown once per login session (sessionStorage flag).
 * Never shown before authentication; survives in-app navigation.
 */
export function WelcomeModal({ fullName }: { fullName: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // storage unavailable — skip the popup rather than looping
    }
  }, []);

  function close() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/25 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome"
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-lift"
          >
            <button
              onClick={close}
              aria-label="Close welcome"
              className="absolute right-4 top-4 grid h-8 w-8 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
              className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-button"
            >
              <Sparkles className="h-6 w-6" />
            </motion.span>

            <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {firstNameOf(fullName)}!
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your money, your goals, your progress. Let's make today count.
            </p>

            <Button onClick={close} className="mt-6 w-full" size="lg">
              Let's Get Started
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

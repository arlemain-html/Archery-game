"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectWallet } from "../components/ConnectWallet";
import { useAuthStore } from "../stores/auth.store";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 text-center space-y-8"
      >
        <h1 className="text-6xl md:text-8xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
          ARCHERY<span className="text-primary">FI</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The next generation Web3 archery experience. Collect, trade, and compete in deterministic PvP matches.
        </p>

        <div className="pt-8">
          <ConnectWallet />
        </div>
      </motion.div>
    </div>
  );
}

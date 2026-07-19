"use client";
import { useAccount, useDisconnect } from "wagmi";
import { useAuthContext } from "../context/AuthContext";
import { useAuthStore } from "../stores/auth.store";
import { Button } from "./ui/Button";

export function ConnectWallet() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { login } = useAuthContext();
  const { logout, isAuthenticated, isLoading } = useAuthStore();

  if (isConnected) {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* AppKit Connect Button will show the connected state (Balance, Avatar) */}
        <appkit-button />
        
        {!isAuthenticated ? (
          <Button onClick={login} isLoading={isLoading} size="lg">
            {isLoading ? "Signing..." : "Sign In With Ethereum"}
          </Button>
        ) : (
          <Button onClick={() => { logout(); disconnect(); }} variant="outline">
            Disconnect & Logout
          </Button>
        )}
      </div>
    );
  }

  return (
    // Reown AppKit generic connect button
    <appkit-button />
  );
}

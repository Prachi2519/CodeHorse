"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";

type LogoutProps = {
  children?: ReactNode;
  className?: string;
};

const Logout = ({ children = "Logout", className }: LogoutProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
            router.refresh();
          },
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      disabled={isLoading}
      onClick={handleLogout}
    >
      {isLoading ? "Logging out..." : children}
    </button>
  );
};

export default Logout;

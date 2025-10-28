"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, User, CheckCircle } from "lucide-react";

export default function PostLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState("authenticating");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setStatus("checking_permissions");
        const res = await fetch("/api/auth/role", { cache: "no-store" });
        const { role } = await res.json();
        
        if (role) {
          setIsAdmin(true);
          setStatus("redirecting_admin");
          setTimeout(() => router.replace("/admin"), 1000);
        } else {
          setStatus("redirecting_dashboard");
          setTimeout(() => router.replace("/dashboard"), 1000);
        }
      } catch {
        setStatus("redirecting_dashboard");
        setTimeout(() => router.replace("/dashboard"), 1000);
      }
    })();
  }, [router]);

  const getStatusMessage = () => {
    switch (status) {
      case "authenticating":
        return "Authenticating your session...";
      case "checking_permissions":
        return "Checking your permissions...";
      case "redirecting_admin":
        return "Redirecting to admin dashboard...";
      case "redirecting_dashboard":
        return "Redirecting to your dashboard...";
      default:
        return "Signing you in...";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "authenticating":
        return <Loader2 className="w-8 h-8 animate-spin text-[#2B6DA9]" />;
      case "checking_permissions":
        return <Shield className="w-8 h-8 text-yellow-500" />;
      case "redirecting_admin":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "redirecting_dashboard":
        return <User className="w-8 h-8 text-[#2B6DA9]" />;
      default:
        return <Loader2 className="w-8 h-8 animate-spin text-[#2B6DA9]" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#EBF3FA] to-[#D6E7F5] flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EBF3FA]/50 via-transparent to-purple-50/50"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#93BAD9]/20 to-purple-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-200/20 to-[#93BAD9]/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 text-center space-y-8">
        {/* Logo and title */}
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2B6DA9] to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2B6DA9] via-purple-600 to-[#20527F] bg-clip-text text-transparent">
            Welcome Back!
          </h1>
        </div>

        {/* Loading animation */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20 flex items-center justify-center">
                {getStatusIcon()}
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-[#93BAD9] animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xl font-semibold text-slate-700">
              {getStatusMessage()}
            </p>
            <p className="text-slate-600">
              {isAdmin ? "Admin privileges detected" : "Setting up your dashboard"}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-500 ${
                status === "authenticating" && i === 1
                  ? "bg-[#2B6DA9]"
                  : status === "checking_permissions" && i <= 2
                  ? "bg-yellow-500"
                  : status.includes("redirecting") && i <= 3
                  ? "bg-green-500"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

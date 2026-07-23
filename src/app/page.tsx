'use client';

import { LoginForm } from '@/components/forms/login-form';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { employee, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && employee) {
      router.push('/dashboard');
    }
  }, [isLoading, employee, router]);

  // Don't render blank loading state on login page; display form directly
  if (employee) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-32 -left-32 h-[400px] w-[400px] rounded-full bg-primary/[0.06] blur-[100px]" />
      <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-primary/[0.04] blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/[0.03] blur-[120px]" />

      {/* Floating dots decoration */}
      <div className="absolute top-1/4 right-1/4 h-2 w-2 rounded-full bg-primary/20 animate-float" />
      <div className="absolute bottom-1/3 left-1/3 h-1.5 w-1.5 rounded-full bg-primary/15 animate-float-delayed" />
      <div className="absolute top-2/3 right-1/3 h-1 w-1 rounded-full bg-primary/25 animate-float" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* App branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/[0.06] border border-primary/10 mb-5">
            <div className="h-2 w-2 rounded-full bg-primary pulse-ring" />
            <span className="text-[11px] font-bold text-primary tracking-tight">QA Daily Task Portal</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">
            QA Task Portal
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Track, report, and analyze your daily QA activities
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}

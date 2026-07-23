'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function LoginForm() {
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!employeeId.trim()) {
      setError('Employee ID is required');
      return;
    }
    if (!pin.trim()) {
      setError('PIN is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(employeeId.trim(), pin.trim());
      if (result.success) {
        toast.success('Login successful!', {
          description: 'Welcome to QA Task Portal',
        });
        router.push('/dashboard');
      } else {
        setError(result.error || 'Login failed');
        toast.error('Login failed', {
          description: result.error,
        });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card glow-card overflow-hidden">
      <div className="p-7">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 rounded-2xl shimmer-bg flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Welcome Back</h2>
          <p className="text-[11px] text-muted-foreground font-medium mt-1">Sign in to your QA Task Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId" className="text-xs font-semibold">
              Employee ID
            </Label>
            <Input
              id="employeeId"
              placeholder="e.g. QA001"
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value.toUpperCase());
                setError('');
              }}
              className="h-11 rounded-xl border-border/30 bg-background/60 focus:border-primary/30 text-sm font-medium"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin" className="text-xs font-semibold">
              PIN
            </Label>
            <Input
              id="pin"
              type="password"
              placeholder="Enter your PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              className="h-11 rounded-xl border-border/30 bg-background/60 focus:border-primary/30 text-sm font-medium"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-500/[0.06] px-4 py-2.5 rounded-xl font-medium border border-red-500/10">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 shimmer-bg hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground pt-2 font-medium">
            Default PIN for all users: <code className="bg-primary/[0.06] text-primary px-2 py-0.5 rounded-md text-[11px] font-bold">1234</code>
          </p>
        </form>
      </div>
    </div>
  );
}

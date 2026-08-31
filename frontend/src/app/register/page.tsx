'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { authApi } from '@/lib/api/auth';

const registerSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.register({
        email: values.email,
        password: values.password,
        role: 'VIEWER'
      });
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black overflow-hidden px-4 py-12 font-manrope">
      
      {/* Background Video — Full-Bleed Cosmic Video */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-top opacity-80"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
            type="video/mp4"
          />
        </video>
        
        {/* Subtle Dark Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%)',
          }}
        />
      </div>

      {/* Floating Header Bar */}
      <header className="fixed top-6 left-0 right-0 z-50 px-6 sm:px-12 flex items-center justify-between pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-black/40 backdrop-blur-lg px-4 py-2 border border-white/15 shadow-xl transition-transform hover:scale-[1.02]"
        >
          <svg className="w-5 h-5 fill-white" viewBox="0 0 256 256">
            <path d="M 128 128 C 128 198.692 70.692 256 0 256 C 0 185.308 57.308 128 128 128 Z M 128 128 C 198.692 128 256 185.308 256 256 C 185.308 256 128 198.692 128 128 Z M 0 0 C 70.692 0 128 57.308 128 128 C 57.308 128 0 70.692 0 0 Z M 256 0 C 256 70.692 198.692 128 128 128 C 128 57.308 185.308 0 256 0 Z" />
          </svg>
          <span className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5 font-geist">
            <span>predictx</span>
            <span className="w-1.5 h-1.5 rounded-full bg-swiss-red animate-pulse" />
          </span>
        </Link>

        <Link
          href="/login"
          className="pointer-events-auto rounded-full bg-white/10 backdrop-blur-lg px-4 py-2 text-xs font-medium text-white hover:bg-white/20 border border-white/15 transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Main Liquid-Glass Registration Card */}
      <div className="relative z-10 w-full max-w-md liquid-glass rounded-[2rem] p-8 sm:p-10 shadow-2xl text-left border border-white/20 my-auto">
        
        {/* Card Header with Instrument Serif Title */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 border border-white/15 text-[11px] font-mono text-white/80 uppercase tracking-widest mb-1">
            <Sparkles className="w-3 h-3 text-white/80" />
            <span>DEPLOYMENT ACCESS</span>
          </div>
          <h1 className="font-instrument italic text-4xl sm:text-5xl text-white font-normal leading-tight [text-shadow:_0_2px_16px_rgba(0,0,0,0.8)]">
            Create an account.
          </h1>
          <p className="text-xs sm:text-sm text-white/70">
            Sign up to start monitoring your infrastructure in real time
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-2xl bg-swiss-red/20 border border-swiss-red/40 p-3.5 text-xs text-white">
            <AlertCircle className="w-4 h-4 text-swiss-red shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-medium text-white/80">Email Address</FormLabel>
                  <FormControl>
                    <input
                      type="email"
                      placeholder="engineer@predictx.io"
                      className="w-full rounded-full bg-white/5 border border-white/15 px-5 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/50 focus:bg-white/10 focus:outline-none backdrop-blur-md transition-all shadow-inner"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-swiss-red" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-medium text-white/80">Password</FormLabel>
                  <FormControl>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      className="w-full rounded-full bg-white/5 border border-white/15 px-5 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/50 focus:bg-white/10 focus:outline-none backdrop-blur-md transition-all shadow-inner"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-swiss-red" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-medium text-white/80">Confirm Password</FormLabel>
                  <FormControl>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      className="w-full rounded-full bg-white/5 border border-white/15 px-5 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/50 focus:bg-white/10 focus:outline-none backdrop-blur-md transition-all shadow-inner"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-swiss-red" />
                </FormItem>
              )}
            />

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-white text-black font-semibold text-sm py-3.5 mt-3 hover:bg-white/90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Creating Workspace...' : 'Create Account'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </Form>

        {/* Footer Link */}
        <div className="text-center text-xs text-white/60 mt-6 pt-5 border-t border-white/10">
          <span>Already have an account? </span>
          <Link href="/login" className="text-white font-medium hover:underline underline-offset-4">
            Sign in
          </Link>
        </div>

      </div>

    </div>
  );
}

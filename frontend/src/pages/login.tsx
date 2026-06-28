import { Suspense, lazy } from "react";
import { useLogin } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getHomePath } from "@/lib/roles";

const InteractiveLoginBackground = lazy(() =>
  import("@/components/3d/InteractiveBackground").then((m) => ({
    default: m.InteractiveLoginBackground,
  })),
);

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.token, res.user);
          setLocation(getHomePath(res.user.role));
        },
        onError: () => {
          toast({
            title: "Login failed",
            description: "Please check your credentials and try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left — dark cinematic 3D */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-gradient-to-br from-[#111315] via-[#1A1D21] to-[#111315] overflow-hidden">
        <Suspense fallback={null}>
          <InteractiveLoginBackground />
        </Suspense>
        <div className="absolute inset-0 bg-gradient-to-t from-[#111315]/90 via-[#111315]/40 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E87722] to-[#F97316] flex items-center justify-center font-bold text-white shadow-[0_0_32px_rgba(232,119,34,0.4)] mb-6">
              A
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
              Enterprise paid ads command center
            </h2>
            <p className="text-[#B9BDC5] text-base max-w-md leading-relaxed">
              Manage millions in ad spend with premium analytics, Meta integration, and AI-powered insights.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right — white glass login */}
      <div className="flex-1 flex items-center justify-center bg-ivory p-6 sm:p-10 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(232,119,34,0.06)_0%,_transparent_60%)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative z-10"
        >
          <div className="mb-8 lg:hidden text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#E87722] to-[#F97316] flex items-center justify-center shadow-lg mb-4">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] tracking-tight">Welcome back</h1>
            <p className="text-[#5B5B5B] text-sm mt-2">Sign in to your AgencyOS workspace</p>
          </div>

          <div className="glass-dialog p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#5B5B5B]">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@agency.com"
                          {...field}
                          className="bg-white border-[#E8E2D8] h-11 rounded-xl focus-visible:ring-[#E87722]/30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#5B5B5B]">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="bg-white border-[#E8E2D8] h-11 rounded-xl focus-visible:ring-[#E87722]/30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#E87722] hover:bg-[#F28C3A] text-white font-semibold shadow-[0_4px_20px_rgba(232,119,34,0.3)] transition-all duration-300 hover:scale-[1.01]"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Authenticating…" : "Sign In"}
                </Button>
              </form>
            </Form>
          </div>

          <p className="text-center text-[#7A7A7A] text-xs mt-6">
            Demo: admin@agencyos.com · password123
          </p>
        </motion.div>
      </div>
    </div>
  );
}

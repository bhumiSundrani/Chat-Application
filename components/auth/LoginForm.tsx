"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof LoginSchema>) {
    setLoading(true);

    try {
      // Normalize email (lowercase and trim)
      const normalizedEmail = values.email.toLowerCase().trim();
      
      const res = await signIn("credentials", {
        email: normalizedEmail,
        password: values.password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Login failed", {
          description: res.error || "Invalid email or password"
        });
        setLoading(false);
        return;
      }

      if (res?.ok) {
        router.push("/");
        router.refresh();
      } else {
        toast.error("Login failed", {
          description: "An unexpected error occurred. Please try again."
        });
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Login failed", {
        description: error.message || "An unexpected error occurred"
      });
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} placeholder="john@gmail.com" />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} placeholder="******" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </Form>
  );
}

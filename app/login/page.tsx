"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import { useLogin } from "@/hooks/use-auth"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema } from "@/lib/validations"
import type { z } from "zod"

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const loginMutation = useLogin()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phoneNumber: "",
      dateOfBirth: "",
    },
  })

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        router.push("/dashboard")
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-secondary via-background to-primary p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Staff Login</h1>
          <p className="text-muted-foreground">Enter your credentials to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number (Username)</Label>
            <Input
              id="phoneNumber"
              type="tel"
              {...register("phoneNumber")}
              placeholder="08123456789"
            />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth (Password)</Label>
            <div className="relative">
              <Input
                id="dateOfBirth"
                type={showPassword ? "text" : "password"}
                {...register("dateOfBirth")}
                placeholder="MM/DD/YY or YYYY-MM-DD"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.dateOfBirth && (
              <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Format: MM/DD/YY (e.g., 01/15/90) or YYYY-MM-DD</p>
          </div>

          {loginMutation.error && (
            <p className="text-sm text-destructive">{loginMutation.error.message}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-linear-to-r from-primary to-accent"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-md text-sm">
          <p className="font-medium">Test Credentials:</p>
          <p><span className="text-muted-foreground">Phone:</span> 08123456789</p>
          <p><span className="text-muted-foreground">DOB:</span> 01/15/90 or 1990-01-15</p>
          <p className="text-xs text-muted-foreground mt-2">Use your staff member's actual DOB for login</p>
        </div>
      </Card>
    </div>
  )
}

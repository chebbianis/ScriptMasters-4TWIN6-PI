import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useAuthContext } from '@/context/auth-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Logo from "@/components/logo";
import GoogleOauthButton from "@/components/auth/google-oauth-button";
import { useMutation } from "@tanstack/react-query";
import { loginMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { AUTH_ROUTES } from "@/routes/common/routePaths"; // Vérifie le bon chemin
import { useState } from "react";
import FaceAuth from "@/components/auth/face-auth";

const SignIn = () => {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [emailForFaceAuth, setEmailForFaceAuth] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: loginMutationFn,
    onError: (error: any) => {
      const errorMessage = error.response?.status === 401
        ? "Invalid account or credentials"
        : error.message;

      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });

      form.setError("email", {
        type: "manual",
        message: "Invalid account or credentials"
      });
      form.setError("password", {
        type: "manual",
        message: " " // Empty space to maintain form layout
      });
    }
  });

  const formSchema = z.object({
    email: z.string().trim().email("Invalid email address").min(1, {
      message: "Email is required",
    }),
    password: z.string().trim().min(1, {
      message: "Password is required",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;

    mutate(values, {
      onSuccess: (data) => {
        if (!data.isActive) {
          toast({
            title: "Account not activated",
            description: "Your account is not yet confirmed. Please wait for administrator approval.",
            variant: "destructive",
          });
          return;
        }

        login({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.isActive,
          lastLogin: data.lastLogin,
          WorkspaceId: data.WorkspaceId,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        });

        const decodedUrl = returnUrl ? decodeURIComponent(returnUrl) : null;
        const redirectPath = data.WorkspaceId
          ? `/workspace/${data.WorkspaceId}`
          : '/create-workspace';

        navigate(decodedUrl || redirectPath);
      }
    });
  };

  const handleTryFaceAuth = () => {
    const email = form.getValues("email");
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email to use facial authentication",
        variant: "destructive",
      });
      return;
    }

    setEmailForFaceAuth(email);
    setShowFaceAuth(true);
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Logo />
          Team Sync.
        </Link>
        <div className="flex flex-col gap-6">
          {showFaceAuth ? (
            <FaceAuth
              email={emailForFaceAuth}
              onCancel={() => setShowFaceAuth(false)}
            />
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Welcome back</CardTitle>
                <CardDescription>
                  Login with your Email or Google account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid gap-6">
                      <div className="flex flex-col gap-4">
                        <GoogleOauthButton label="Login" />
                      </div>
                      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                        <span className="relative z-10 bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                      <div className="grid gap-3">
                        <div className="grid gap-2">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                                  Email
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="m@example.com"
                                    className="!h-[48px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage>
                                  {form.formState.errors.email?.message}
                                </FormMessage>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid gap-2">
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center">
                                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                                    Password
                                  </FormLabel>
                                  <Link to={AUTH_ROUTES.FORGOT_PASSWORD} className="ml-auto text-sm underline-offset-4 hover:underline">
                                    Forgot your password?
                                  </Link>
                                </div>
                                <FormControl>
                                  <Input
                                    type="password"
                                    className="!h-[48px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            disabled={isPending}
                            type="submit"
                            className="w-full"
                          >
                            {isPending && <Loader className="animate-spin mr-2" />}
                            Login
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                            onClick={handleTryFaceAuth}
                          >
                            Login with face
                          </Button>
                        </div>

                        <div className="text-center text-sm">
                          Don&apos;t have an account?{" "}
                          <Link
                            to="/sign-up"
                            className="underline underline-offset-4"
                          >
                            Sign up
                          </Link>
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
            By clicking continue, you agree to our{" "}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { registerMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { useState } from "react";
import FaceRegister from "@/components/auth/face-register";

// Type pour les données du formulaire
type FormValues = {
  name: string;
  email: string;
  password: string;
};

const SignUp = () => {
  const navigate = useNavigate();
  const [showFaceRegister, setShowFaceRegister] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string>("");
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [formValidated, setFormValidated] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: registerMutationFn,
  });

  // Correction du message d'erreur pour l'email
  const formSchema = z.object({
    name: z.string().trim().min(1, {
      message: "Name is required",
    }),
    email: z.string().trim().email("Invalid email address").min(1, {
      message: "Email is required", // Corrigé le message
    }),
    password: z.string().trim().min(1, {
      message: "Password is required",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  // Validation du formulaire sans soumission immédiate
  const validateForm = (data: z.infer<typeof formSchema>) => {
    setFormData(data);
    setFormValidated(true);
    toast({
      title: "Form validated",
      description: "You can now choose to register with or without facial recognition",
    });
  };

  // Soumission du formulaire sans reconnaissance faciale
  const submitWithoutFace = () => {
    if (!formData) return;

    mutate(formData, {
      onSuccess: (response) => {
        console.log("Registration response:", response);

        toast({
          title: "Registration successful",
          description: "You can now log in with your credentials",
        });
        navigate("/");
      },
      onError: (error) => {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
        setFormValidated(false);
      },
    });
  };

  // Soumission avec reconnaissance faciale
  const submitWithFace = () => {
    if (!formData) return;

    mutate(formData, {
      onSuccess: (response) => {
        console.log("Registration response:", response);

        // La réponse d'API est directement dans response.data
        const userId = response.data?.id || "";

        if (userId) {
          setRegisteredUserId(userId);
          setShowFaceRegister(true);
        } else {
          toast({
            title: "Error",
            description: "Unable to retrieve user ID for facial registration",
            variant: "destructive",
          });
          navigate("/");
        }
      },
      onError: (error) => {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
        setFormValidated(false);
      },
    });
  };

  const handleFaceRegisterSuccess = () => {
    toast({
      title: "Setup complete",
      description: "Your face has been successfully registered. You can use it to log in.",
    });
    navigate("/");
  };

  const handleFaceRegisterCancel = () => {
    toast({
      title: "Registration successful",
      description: "You can now log in with your credentials",
    });
    navigate("/");
  };

  const resetFormState = () => {
    setFormValidated(false);
    setFormData(null);
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link to="/" className="flex items-center gap-2 self-center font-medium">
          <Logo />
          Team Sync.
        </Link>
        <div className="flex flex-col gap-6">
          {showFaceRegister ? (
            <FaceRegister
              userId={registeredUserId}
              onSuccess={handleFaceRegisterSuccess}
              onCancel={handleFaceRegisterCancel}
            />
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Create an account</CardTitle>
                <CardDescription>
                  Signup with your Email or Google account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(validateForm)}>
                    <div className="grid gap-6">
                      <div className="flex flex-col gap-4">
                        <GoogleOauthButton label="Signup" />
                      </div>
                      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                        <span className="relative z-10 bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid gap-2">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                                  Name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="John Doe"
                                    className="!h-[48px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
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
                                <FormMessage />
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
                                <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                                  Password
                                </FormLabel>
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

                        {!formValidated ? (
                          <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full"
                          >
                            {isPending && <Loader className="animate-spin mr-2" />}
                            Validate form
                          </Button>
                        ) : (
                          <div className="grid gap-2">
                            <div className="flex flex-col gap-2">
                              <Button
                                disabled={isPending}
                                onClick={submitWithFace}
                                className="w-full"
                              >
                                {isPending && <Loader className="animate-spin mr-2" />}
                                Register with facial recognition
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                onClick={submitWithoutFace}
                                className="w-full"
                              >
                                Register without facial recognition
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                onClick={resetFormState}
                                className="w-full"
                              >
                                Cancel and modify information
                              </Button>
                            </div>

                            <div className="text-center text-sm">
                              Already have an account?{" "}
                              <Link
                                to="/"
                                className="underline underline-offset-4"
                              >
                                Login
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
                        By clicking continue, you agree to our{" "}
                        <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
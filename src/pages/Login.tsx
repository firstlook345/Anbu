import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, isAdminEmail } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { AlertCircle, User, Lock, X } from "lucide-react";
import { toast } from "sonner";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, loginWithGoogle, resetPassword, skipLogin } = useAuth();
  const navigate = useNavigate();

  const goAfterLogin = (userEmail: string) => {
    if (isAdminEmail(userEmail)) {
      toast.success("Logged in as Admin.");
      navigate("/admin");
    } else {
      toast.success("Logged in successfully.");
      navigate("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) {
      setError("Please fill in all fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        const result = await register(cleanEmail, cleanPassword);
        if (result === true) {
          toast.success("Account created successfully.");
          navigate("/");
        } else {
          setError(typeof result === "string" ? result : "Registration failed.");
        }
      } else {
        const success = await login(cleanEmail, cleanPassword);
        if (success) {
          goAfterLogin(cleanEmail);
        } else {
          setError("Invalid email or password.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const result = await loginWithGoogle();
      if (result.ok) {
        goAfterLogin(result.email);
      } else if (result.error) {
        setError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Enter your email above, then click Forgot password.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const result = await resetPassword(cleanEmail);
      if (result === true) {
        toast.success("If an account exists for this email, a reset link has been sent. Check your inbox and spam folder.");
      } else {
        setError(result);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    skipLogin();
    navigate("/");
  };

  return (
    <div className="relative min-h-screen min-h-dvh w-full flex items-center justify-center p-2 sm:p-6 bg-muted/40 modal-scrollable">

      <div className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto relative animate-fade-in-up my-auto shadow-2xl rounded-3xl">
        {/* Cancel button inside card context */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 rounded-full bg-background/20 backdrop-blur-md shadow-sm hover:bg-background/40 text-foreground transition-all"
          onClick={handleCancel}
          title="Close"
        >
          <X className="h-5 w-5" />
        </Button>
        <div className="w-full rounded-3xl overflow-hidden bg-background flex flex-col md:flex-row">
        {/* Left Side: Login Form */}
        <div className="flex-1 p-5 sm:p-8 md:p-10 flex flex-col justify-center relative">
          
          <div className="max-w-md w-full mx-auto space-y-6 sm:space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight mb-1">
                  {isRegistering ? "Create Account" : "Welcome"}
                </h1>
                <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {isRegistering ? "Join our hardware community today" : "We are glad to see you back with us"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <User className="h-5 w-5" />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 h-10 bg-muted/30 border-none rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 h-10 bg-muted/30 border-none rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                  />
                </div>

                {!isRegistering && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isSubmitting}
                      className="text-xs font-medium text-sky-500 hover:text-sky-400 hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={isSubmitting} className="w-full h-10 rounded-xl text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-all active:scale-[0.98]">
                  {isSubmitting ? "Please wait..." : isRegistering ? "CREATE ACCOUNT" : "LOGIN"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-10 rounded-xl text-sm font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/30 hover:bg-sky-600 hover:text-white hover:border-sky-600 shadow-sm transition-all active:scale-[0.98] cursor-pointer" 
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError("");
                  }}
                >
                  {isRegistering ? "LOGIN INSTEAD" : "REGISTER"}
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium text-muted-foreground">OR</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Google OAuth */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={handleGoogle}
                  className="w-full h-10 rounded-xl text-sm font-semibold gap-2 bg-background border border-border hover:bg-muted/50 text-foreground shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <GoogleIcon />
                  Continue with Google
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Showcase Graphic */}
        <div className="hidden md:flex flex-1 p-4 bg-background">
          <div className="w-full h-full relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 to-zinc-900 shadow-inner flex items-center justify-center">
            {/* High-end working gaming PC image */}
            <img 
              src="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=1000&auto=format&fit=crop" 
              alt="Elite Gaming PC" 
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-90 transition-transform duration-1000 hover:scale-105"
            />
            {/* Dark overlay shift matching the tech design */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            
            <div className="relative z-10 text-center p-8 text-white space-y-4 absolute bottom-12 w-full">
               <h2 className="text-3xl font-extrabold drop-shadow-lg tracking-tight">Ultimate Hardware</h2>
               <p className="text-gray-300 font-medium">Powering your next generation of gaming and creativity.</p>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
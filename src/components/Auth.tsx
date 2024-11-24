import { useState } from "react";
import { Button } from "../components/ui/button";
import supabase from "../lib/createClient";

import { Icons } from "../components/ui/icons";

const getRedirectURL = () => {
  let url =
    import.meta.env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    import.meta.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:5173/";
  // Make sure to include `https://` when not localhost.
  url = url.startsWith("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.endsWith("/") ? url : `${url}/`;
  return url;
};

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectURL(),
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col justify-start text-left">
        <h1 className="text-2xl font-bold pb-3">Spain 2024 Cost Calculator</h1>
        <Button
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          aria-label="Sign in with Google"
        >
          {isLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}
          Sign in with Google
        </Button>
        <p className="text-[9px] pt-1 text-gray-500">
          Use your Google account to sign in
        </p>
      </div>
    </div>
  );
};

export default Auth;

import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Renders Google's official "Sign in with Google" button inside the
 * returned ref element, and calls onCredential(credential) once the
 * person completes sign-in. Google's script owns the button's markup;
 * we only theme the container around it.
 */
export function useGoogleButton(onCredential) {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function render() {
      if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;

      if (!CLIENT_ID) {
        console.error("VITE_GOOGLE_CLIENT_ID is not set. Copy client/.env.example to client/.env.");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => onCredential(response.credential)
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 280
      });
    }

    if (window.google?.accounts?.id) {
      render();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          render();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      cancelled = true;
    };
  }, [onCredential]);

  return containerRef;
}

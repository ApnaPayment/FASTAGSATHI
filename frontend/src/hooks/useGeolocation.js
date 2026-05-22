import { useCallback, useEffect, useState } from "react";

// Wrapper around navigator.geolocation with permission status + fallback.
// state.status: 'idle' | 'prompting' | 'granted' | 'denied' | 'unavailable' | 'fallback'
export default function useGeolocation() {
  const [state, setState] = useState({ status: "idle", coords: null, error: null });

  const request = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable", coords: null, error: "Geolocation not supported in this browser." });
      return;
    }
    setState({ status: "prompting", coords: null, error: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ status: "granted", coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, error: null }),
      (err) => setState({ status: "denied", coords: null, error: err.message || "Location permission denied." }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  }, []);

  const setFallback = useCallback((lat, lng, label) => {
    setState({ status: "fallback", coords: { lat, lng, label }, error: null });
  }, []);

  return { ...state, request, setFallback };
}

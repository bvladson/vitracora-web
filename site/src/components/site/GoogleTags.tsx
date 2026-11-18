import { useEffect } from "react";
import {
  captureAttribution,
  getCookieConsent,
  getAdvertisingConsent,
  trackEvent,
} from "@/lib/analytics";

// Scripts are installed once in the document shell. This component only
// synchronizes the visitor's choices, including revocation after loading.
export function GoogleTags() {
  useEffect(() => {
    let previouslyAccepted = getCookieConsent() === "accepted";
    const update = () => {
      const accepted = getCookieConsent() === "accepted";
      const advertising = getAdvertisingConsent() === "accepted";
      window.gtag?.("consent", "update", {
        analytics_storage: accepted ? "granted" : "denied",
        ad_storage: advertising ? "granted" : "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.requestNonPersonalizedAds = 1;
      window.adsbygoogle.pauseAdRequests = advertising ? 0 : 1;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "vsb_consent_updated",
        analytics_allowed: accepted,
        advertising_allowed: advertising,
      });
      if (accepted && !previouslyAccepted) {
        captureAttribution();
        trackEvent("page_view", { path: window.location.pathname });
      }
      previouslyAccepted = accepted;
    };
    window.addEventListener("vsb:consent-updated", update);
    return () => window.removeEventListener("vsb:consent-updated", update);
  }, []);
  return null;
}

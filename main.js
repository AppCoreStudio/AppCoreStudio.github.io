import { initReviews } from "./reviews.js?v=20261007d";

const sb = window.supabase.createClient();

function getReferralVisitorId() {
  const key = "appcore_referral_visitor_id";
  try {
    let id = localStorage.getItem(key);
    if (id) return id;

    if (window.crypto && typeof crypto.randomUUID === "function") {
      id = crypto.randomUUID();
    } else {
      id = "visitor-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    }

    localStorage.setItem(key, id);
    return id;
  } catch {
    return "visitor-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  }
}

async function trackReferralClick() {
  const code = new URLSearchParams(window.location.search).get("ref");
  if (!code) return;

  try {
    await sb.rpc("track_referral_click", {
      p_referral_code: code.trim().toUpperCase(),
      p_visitor_id: getReferralVisitorId()
    });
  } catch (error) {
    console.warn("Referral click tracking:", error?.message || error);
  }
}

trackReferralClick();

initReviews(sb);

document.getElementById("tabProfile").addEventListener("click", () => {
  window.location.href = "profile.html";
});

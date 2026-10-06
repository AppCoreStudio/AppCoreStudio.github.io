import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";
import { initReviews } from "./reviews.js";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

initReviews(sb);

document.getElementById("tabProfile").addEventListener("click", () => {
  window.location.href = "profile.html";
});

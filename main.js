import { initReviews } from "./reviews.js";

const sb = window.supabase.createClient();

initReviews(sb);

document.getElementById("tabProfile").addEventListener("click", () => {
  window.location.href = "profile.html";
});

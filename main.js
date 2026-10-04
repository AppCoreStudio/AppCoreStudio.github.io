import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";
import { initOrbit } from "./orbit.js";
import { initReviews } from "./reviews.js";
import { toast } from "./ui.js";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

initOrbit(document.getElementById("orbit"));
initReviews(sb);

// Профиль появится на следующем этапе (нужна авторизация с хранением на сервере)
document.getElementById("tabProfile").addEventListener("click", () => toast("Профиль появится в следующем обновлении"));

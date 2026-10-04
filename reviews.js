import { toast } from "./ui.js";

const $ = id => document.getElementById(id);

function note(text) {
  const el = document.createElement("div");
  el.className = "note";
  el.textContent = text;
  return el;
}

function card(r) {
  const el = document.createElement("div");
  el.className = "review";

  const stars = document.createElement("div");
  stars.className = "stars";
  stars.textContent = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);

  const text = document.createElement("p");
  text.textContent = r.text;

  const author = document.createElement("span");
  author.textContent = r.author;

  el.append(stars, text, author);
  return el;
}

function plural(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "отзыв";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "отзыва";
  return "отзывов";
}

function renderSummary(ratings) {
  const box = $("ratingSummary");
  if (!box) return;

  if (!ratings.length) {
    box.hidden = true;
    return;
  }

  const total = ratings.length;
  const counts = [0, 0, 0, 0, 0, 0];
  ratings.forEach(r => { counts[r]++; });

  const avg = ratings.reduce((sum, r) => sum + r, 0) / total;
  const full = Math.round(avg);

  $("ratingAvg").textContent = avg.toFixed(1).replace(".", ",");
  $("ratingStars").textContent = "★".repeat(full) + "☆".repeat(5 - full);
  $("ratingCount").textContent = total + " " + plural(total);

  const bars = $("ratingBars");
  bars.replaceChildren();

  for (let s = 5; s >= 1; s--) {
    const pct = Math.round((counts[s] / total) * 100);

    const row = document.createElement("div");
    row.className = "bar-row";
    row.title = counts[s] + " " + plural(counts[s]);

    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = s + " ★";

    const track = document.createElement("div");
    track.className = "bar-track";

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = pct + "%";
    track.append(fill);

    const value = document.createElement("span");
    value.className = "bar-pct";
    value.textContent = pct + "%";

    row.append(label, track, value);
    bars.append(row);
  }

  box.hidden = false;
}

async function loadReviews(sb) {
  const slider = $("reviewsSlider");

  try {
    const { data, error } = await sb
      .from("reviews")
      .select("id,author,rating,text,created_at")
      .eq("status", "approved")
      .limit(1000);

    if (error) throw error;

    const all = data || [];

    // Рейтинг считается по ВСЕМ одобренным отзывам
    renderSummary(all.map(r => r.rating));

    // Положительные (высокая оценка) — первыми, внутри оценки — свежие выше
    const list = all
      .sort((a, b) => b.rating - a.rating || new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50);

    slider.replaceChildren(
      ...(list.length ? list.map(card) : [note("Пока нет отзывов — станьте первым!")])
    );
  } catch (e) {
    console.error(e);
    slider.replaceChildren(note("Не удалось загрузить отзывы"));
  }
}

function initForm(sb) {
  const modal = $("reviewModal");
  const form = $("reviewForm");
  const stars = [...document.querySelectorAll("#starPick button")];
  let rating = 5;

  const paint = () => stars.forEach((b, i) => b.classList.toggle("on", i < rating));
  stars.forEach((b, i) => b.addEventListener("click", () => { rating = i + 1; paint(); }));
  paint();

  $("reviewOpen").addEventListener("click", () => modal.classList.add("show"));
  $("reviewClose").addEventListener("click", () => modal.classList.remove("show"));
  modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("show"); });

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const author = form.elements.author.value.trim() || "Клиент";
    const text = form.elements.text.value.trim();

    if (text.length < 10) return toast("Напишите хотя бы 10 символов");

    const button = form.querySelector("[type=submit]");
    button.disabled = true;

    const { error } = await sb
      .from("reviews")
      .insert([{ author: author.slice(0, 40), rating, text: text.slice(0, 500) }]);

    button.disabled = false;

    if (error) {
      console.error(error);
      return toast("Не удалось отправить, попробуйте позже");
    }

    form.reset();
    rating = 5;
    paint();
    modal.classList.remove("show");
    toast("Спасибо! Отзыв появится после проверки");
  });
}

export function initReviews(sb) {
  loadReviews(sb);
  initForm(sb);
}

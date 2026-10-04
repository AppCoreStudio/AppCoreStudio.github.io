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

async function loadReviews(sb) {
  const slider = $("reviewsSlider");

  try {
    const { data, error } = await sb
      .from("reviews")
      .select("id,author,rating,text,created_at")
      .eq("status", "approved")
      .limit(50);

    if (error) throw error;

    // Положительные (высокая оценка) — первыми, внутри оценки — свежие выше
    const list = (data || []).sort(
      (a, b) => b.rating - a.rating || new Date(b.created_at) - new Date(a.created_at)
    );

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

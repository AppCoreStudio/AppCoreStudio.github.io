const PARTNERS = [
  { name: "Сбербанк", icon: "sberbank", bg: "#25b86c" },
  { name: "ВТБ", icon: "vtb", bg: "#1685ff" },
  { name: "Авито", icon: "avito", bg: "#00a86b" },
  { name: "ChatGPT", icon: "openai", bg: "#10a37f" },
  { name: "Т-Банк", icon: "tbank", bg: "#ffd500", dark: true },
  { name: "Альфа-Банк", icon: "alfabank", bg: "#ef3124" },
  { name: "VK", icon: "vk", bg: "#0077ff" },
  { name: "Rutube", icon: "rutube", bg: "#ff3b30" }
];

const RADIUS = 108;

export function initOrbit(ring) {
  PARTNERS.forEach((p, i) => {
    const angle = (360 / PARTNERS.length) * i;

    const pos = document.createElement("div");
    pos.className = "pos";
    pos.style.transform = `rotate(${angle}deg) translateX(${RADIUS}px) rotate(${-angle}deg)`;

    const sat = document.createElement("div");
    sat.className = "sat";
    sat.style.background = p.bg;
    sat.style.color = p.dark ? "#111" : "#fff";
    sat.title = p.name;
    sat.textContent = p.name.slice(0, 2).toUpperCase();

    const img = new Image();
    img.alt = "";
    img.src = `https://cdn.simpleicons.org/${p.icon}/${p.dark ? "111111" : "ffffff"}`;
    img.onload = () => { sat.textContent = ""; sat.append(img); };

    pos.append(sat);
    ring.append(pos);
  });
}

/* Подставляет локальные логотипы logos/<id>.png и перерисовывает список */
(function(){
  apps.forEach(function(a){
    // Имя файла логотипа VK Музыки исторически записано слитно.
    const fileName = a.id === "vk-music" ? "vkmusic" : a.id;
    a.logo = "logos/" + fileName + ".png";

    // Для новых логотипов используем подготовленные версии 1x, 2x и 3x.
    if (["t2", "yandex-pay", "t-invest"].includes(a.id)) {
      a.logo2x = "logos/" + fileName + "@2x.png";
      a.logo3x = "logos/" + fileName + "@3x.png";
    }
  });
  render();
})();
/* Подставляет локальные логотипы logos/<id>.png и перерисовывает список */
(function(){
  apps.forEach(function(a){
    // Имя файла логотипа VK Музыки исторически записано слитно.
    const fileName = a.id === "vk-music" ? "vkmusic" : a.id;
    a.logo = "logos/" + fileName + ".png";
  });
  render();
})();
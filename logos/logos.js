/* Подставляет локальные логотипы logos/<id>.png и перерисовывает список */
(function(){
  apps.forEach(function(a){ a.logo = "logos/" + a.id + ".png"; });
  render();
})();

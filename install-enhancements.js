
(function(){
  var OPENED_KEY="appcore_opened_apps";
  var installList=document.getElementById("installList");
  var installPanel=document.getElementById("installPanel");
  var installedBtn=document.getElementById("installedButton");
  var activationPanel=document.getElementById("activationPanel");
  var returnOverlay=document.getElementById("returnOverlay");

  var steps=document.createElement("div");
  steps.className="install-steps";
  steps.innerHTML=
    '<div class="install-steps-title">⚠️ Как получить приложения</div>'+
    '<div class="install-step"><b>1</b><span>Нажмите «Установить» у каждого приложения и дождитесь установки</span></div>'+
    '<div class="install-step"><b>2</b><span>Вернитесь на эту страницу (закройте вкладку установки)</span></div>'+
    '<div class="install-step"><b>3</b><span>Нажмите «Я установил» и получите активацию</span></div>';
  installList.parentNode.insertBefore(steps,installList);

  function orderNum(){
    try{return currentOrder&&currentOrder.order_number||null;}catch(e){return null;}
  }

  function getOpened(num){
    try{
      var d=JSON.parse(localStorage.getItem(OPENED_KEY)||"null");
      return d&&d.order===num&&Array.isArray(d.ids)?d.ids:[];
    }catch(e){return[];}
  }

  function markOpened(num,id){
    try{
      var ids=getOpened(num);
      if(ids.indexOf(id)===-1)ids.push(id);
      localStorage.setItem(OPENED_KEY,JSON.stringify({order:num,ids:ids}));
    }catch(e){}
  }

  function enhance(){
    var num=orderNum();
    if(!num)return;
    var opened=getOpened(num);
    installList.querySelectorAll("a.install-button").forEach(function(a){
      if(opened.indexOf(a.href)>-1){
        a.textContent="✓ Открыто";
        a.classList.add("opened");
      }
      if(!a.dataset.bound){
        a.dataset.bound="1";
        a.addEventListener("click",function(){
          markOpened(orderNum(),a.href);
          a.textContent="✓ Открыто";
          a.classList.add("opened");
        });
      }
    });
  }

  new MutationObserver(enhance).observe(installList,{childList:true});
  enhance();

  function allOpened(num){
    var links=installList.querySelectorAll("a.install-button");
    if(!links.length)return false;
    var opened=getOpened(num);
    for(var i=0;i<links.length;i++){
      if(opened.indexOf(links[i].href)===-1)return false;
    }
    return true;
  }

  function showReturnModal(){
    var num=orderNum();
    if(!num)return;
    if(!installPanel.classList.contains("show"))return;
    if(installedBtn.disabled)return;
    if(!allOpened(num))return;
    returnOverlay.classList.add("show");
  }

  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState==="visible")showReturnModal();
  });
  window.addEventListener("pageshow",function(e){
    if(e.persisted)showReturnModal();
  });

  document.getElementById("returnLater").addEventListener("click",function(){
    returnOverlay.classList.remove("show");
  });

  document.getElementById("returnYes").addEventListener("click",function(){
    returnOverlay.classList.remove("show");
    installedBtn.click();
    setTimeout(function(){
      activationPanel.scrollIntoView({behavior:"smooth",block:"center"});
    },150);
  });
})();
/* =========================
   REFERRAL REDIRECT
========================= */

const referralBanner =
  document.getElementById("referralBanner");

if(referralBanner){

  referralBanner.addEventListener(
    "click",
    function(){

      window.location.href =
        "https://appcorestudio.github.io/referral/";

    }
  );

}

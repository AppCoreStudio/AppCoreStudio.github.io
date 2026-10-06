const SUPABASE_URL="https://dkgipfotfjntlhabakns.supabase.co";
const SUPABASE_KEY="sb_publishable_Yqtu6SOTncAsze5_whAAFQ_KjTUbK_6";

let supabaseClient=null;

async function rpc(functionName, params){
  const response = await fetch(
    SUPABASE_URL + "/rest/v1/rpc/" + encodeURIComponent(functionName),
    {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params || {})
    }
  );
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch (e) {}
  if (!response.ok) {
    return {
      data: null,
      error: {
        message: (data && (data.message || data.error || data.hint)) || ("HTTP " + response.status)
      }
    };
  }
  return { data, error: null };
}
  const referralUserId =
  localStorage.getItem("referral_user_id") ||
  "user_" + Date.now() + "_" +
  Math.random().toString(36).slice(2,10);

localStorage.setItem(
  "referral_user_id",
  referralUserId
);

/*
 * Сохраняем первого реферера.
 * Последующий ?ref=... не перезаписывает
 * уже сохранённый реферальный код.
 */

const REFERRAL_CODE_KEY =
  "appcore_referral_code";

const savedReferralCode =
  localStorage.getItem(
    REFERRAL_CODE_KEY
  ) ||
  localStorage.getItem(
    "referral_code"
  );

const incomingReferralCode =
  new URLSearchParams(
    window.location.search
  ).get("ref");

function isValidReferralCode(code){

  return (
    typeof code === "string" &&
    /^[A-Za-z0-9_-]{3,64}$/.test(
      code.trim()
    )
  );
}

if(
  savedReferralCode &&
  isValidReferralCode(savedReferralCode)
){

  localStorage.setItem(
    REFERRAL_CODE_KEY,
    savedReferralCode.trim()
  );

}else if(
  incomingReferralCode &&
  isValidReferralCode(
    incomingReferralCode
  )
){

  localStorage.setItem(
    REFERRAL_CODE_KEY,
    incomingReferralCode.trim()
  );

  localStorage.setItem(
    "referral_code",
    incomingReferralCode.trim()
  );
}



"use strict";

const PRICE=500;

const CLIENT_ORDER_KEY="appcore_client_order";
const CLIENT_ORDER_TIME_KEY="appcore_client_order_time";
const INSTALLED_ORDER_KEY="appcore_installed_order";

/*
 * Один клиент может оформить новый заказ
 * только через 12 часов после создания предыдущего.
 */

const WHATSAPP_NUMBER="79289480706";

const apps=[
{id:"sberbank",name:"Сбербанк",type:"Банк",category:"finance",logo:"https://cdn.simpleicons.org/sberbank",color:"#21a366",gradient:"linear-gradient(135deg,#25b86c,#08783e)"},
{id:"sber-invest",name:"СберИнвестиции",type:"Инвестиции",category:"finance",logo:"https://cdn.simpleicons.org/sberbank",color:"#18a765",gradient:"linear-gradient(135deg,#2ac979,#087c46)"},
{id:"tbank",name:"Т-Банк",type:"Банк",category:"finance",logo:"https://cdn.simpleicons.org/tbank",color:"#ffd500",gradient:"linear-gradient(135deg,#ffe33e,#e7b900)"},
{id:"t-invest",name:"Т-Инвестиции",type:"Инвестиции",category:"finance",logo:"https://cdn.simpleicons.org/tbank",color:"#f3ca00",gradient:"linear-gradient(135deg,#ffe64a,#d9a900)"},
{id:"alfa",name:"Альфа-Банк",type:"Банк",category:"finance",logo:"https://cdn.simpleicons.org/alfabank",color:"#ef3124",gradient:"linear-gradient(135deg,#ff5145,#c70d09)"},
{id:"alfa-invest",name:"Альфа-Инвестиции",type:"Инвестиции",category:"finance",logo:"https://cdn.simpleicons.org/alfabank",color:"#e93027",gradient:"linear-gradient(135deg,#ff5b4f,#bb1009)"},
{id:"vtb",name:"ВТБ",type:"Банк",category:"finance",logo:"https://cdn.simpleicons.org/vtb",color:"#1685ff",gradient:"linear-gradient(135deg,#36a4ff,#0757d9)"},
{id:"vtb-invest",name:"ВТБ Мои Инвестиции",type:"Инвестиции",category:"finance",logo:"https://cdn.simpleicons.org/vtb",color:"#1a82ed",gradient:"linear-gradient(135deg,#3ca8ff,#0a4fc2)"},
{id:"gazprom",name:"Газпромбанк",type:"Банк",category:"finance",logo:"https://cdn.simpleicons.org/gazprombank",color:"#3b78ff",gradient:"linear-gradient(135deg,#55a1ff,#154bc9)"},
{id:"gazprom-invest",name:"Газпромбанк Инвестиции",type:"Инвестиции",category:"finance",logo:"https://cdn.simpleicons.org/gazprombank",color:"#3673ff",gradient:"linear-gradient(135deg,#58a9ff,#164ac8)"},
{id:"rshb",name:"Россельхозбанк",type:"Банк",category:"finance",logo:"https://cdn.simpleicons.org/rosselkhozbank",color:"#48a93f",gradient:"linear-gradient(135deg,#6bd35c,#1e7427)"},
{id:"psb",name:"ПСБ",type:"Банк",category:"finance",logo:"https://cdn.simpleicons.org/psbank",color:"#e1262d",gradient:"linear-gradient(135deg,#ff4c50,#b90c14)"},
{id:"yandex-pay",name:"Яндекс Пэй",type:"Сервис",category:"finance",logo:"https://cdn.simpleicons.org/yandex",color:"#ff3d00",gradient:"linear-gradient(135deg,#ff7043,#e52c00)"},
{id:"vk",name:"VK",type:"Социальная сеть",category:"social",logo:"https://cdn.simpleicons.org/vk",color:"#0077ff",gradient:"linear-gradient(135deg,#3c9aff,#0056cf)"},
{id:"vk-video",name:"VK Видео",type:"Видео",category:"social",logo:"https://cdn.simpleicons.org/vk",color:"#5d65ff",gradient:"linear-gradient(135deg,#7984ff,#3b42d8)"},
{id:"vk-messenger",name:"VK Мессенджер",type:"Мессенджер",category:"social",logo:"https://cdn.simpleicons.org/vk",color:"#7b61ff",gradient:"linear-gradient(135deg,#957cff,#5540d6)"},
{id:"max",name:"MAX",type:"Мессенджер",category:"social",logo:"https://cdn.simpleicons.org/max",color:"#6f5cff",gradient:"linear-gradient(135deg,#927cff,#4b36d8)"},
{id:"avito",name:"Авито",type:"Сервис",category:"social",logo:"https://cdn.simpleicons.org/avito",color:"#00a86b",gradient:"linear-gradient(135deg,#27d18c,#00804e)"},
{id:"rave",name:"Rave",type:"Видео",category:"social",logo:"https://cdn.simpleicons.org/rave",color:"#ff4d91",gradient:"linear-gradient(135deg,#ff70aa,#d3226b)"},
{id:"rutube",name:"Rutube",type:"Видео",category:"social",logo:"https://cdn.simpleicons.org/rutube",color:"#ff3b30",gradient:"linear-gradient(135deg,#ff665e,#cf160e)"},
{id:"happ",name:"Happ",type:"Сервис",category:"useful",logo:"https://cdn.simpleicons.org/happ",color:"#815cff",gradient:"linear-gradient(135deg,#a083ff,#5230d9)"},
{id:"v2raytun",name:"v2RayTun",type:"Сервис",category:"useful",logo:"",color:"#5d65ff",gradient:"linear-gradient(135deg,#7984ff,#3b42d8)"},
{id:"chatgpt",name:"ChatGPT",type:"Сервис",category:"useful",logo:"https://cdn.simpleicons.org/openai",color:"#10a37f",gradient:"linear-gradient(135deg,#20c997,#087c60)"}
];

let selected=new Set();
let currentCategory="all";
let query="";
let currentOrder=null;
let isCreatingOrder=false;
let statusTimer=null;
let lockTimer=null;
let toastTimer=null;

const $=id=>document.getElementById(id);

const appList=$("appList");
const empty=$("empty");
const search=$("search");
const clear=$("clear");
const categories=$("categories");
const pricePanel=$("pricePanel");
const countEl=$("count");
const originalEl=$("original");
const discountEl=$("discount");
const totalEl=$("total");
const continueButton=$("continue");
const toast=$("toast");

const paymentOverlay=$("paymentOverlay");
const paymentClose=$("paymentClose");
const paymentDone=$("paymentDone");
const selectedApps=$("selectedApps");
const paymentTotal=$("paymentTotal");
const nameInput=$("nameInput");
const phoneInput=$("phoneInput");

const statusPanel=$("statusPanel");
const statusTitle=$("statusTitle");
const statusText=$("statusText");
const orderNumberDisplay=$("orderNumberDisplay");

const installPanel=$("installPanel");
const installList=$("installList");
const installedButton=$("installedButton");
const activationPanel=$("activationPanel");
const activationWhatsapp=$("activationWhatsapp");

const supportTopButton=$("supportTopButton");
const statusSupportButton=$("statusSupportButton");

const cancelledPanel=$("cancelledPanel");
const cancelledOrderNumber=$("cancelledOrderNumber");


const confirmOverlay=$("confirmOverlay");
const confirmClose=$("confirmClose");
const confirmCancel=$("confirmCancel");
const confirmYes=$("confirmYes");

function getDiscount(count){
  if(count>=5)return 20;
  if(count===4)return 15;
  if(count===3)return 10;
  if(count===2)return 5;
  return 0;
}

function calculatePrice(count){

  const original=count*PRICE;
  const discountPercent=getDiscount(count);
  const discountAmount=original*discountPercent/100;

  return{
    original,
    discountPercent,
    discountAmount,
    total:original-discountAmount
  };
}

function money(value){
  return Math.round(value).toLocaleString("ru-RU")+" ₽";
}

function initials(name){

  const words=name
    .replace(/[^а-яА-Яa-zA-Z0-9\s]/g,"")
    .trim()
    .split(/\s+/);

  if(words.length>=2){
    return(words[0][0]+words[1][0]).toUpperCase();
  }

  return name
    .replace(/[^а-яА-Яa-zA-Z0-9]/g,"")
    .substring(0,2)
    .toUpperCase();
}

function updatePrice(){

  const count=selected.size;

  if(!count){

    pricePanel.classList.remove("visible");

    countEl.textContent="0";
    originalEl.textContent="0 ₽";
    discountEl.textContent="0%";
    totalEl.textContent="0 ₽";

    continueButton.disabled=true;
    continueButton.textContent="Выберите приложение";

    return;
  }

  const price=calculatePrice(count);

  pricePanel.classList.add("visible");

  countEl.textContent=count;
  originalEl.textContent=money(price.original);
  discountEl.textContent=price.discountPercent+"%";
  totalEl.textContent=money(price.total);

  continueButton.disabled=false;
  continueButton.textContent=count===1?"Заказать приложение":"Заказать приложения";
}

function render(){

  const searchText=query.trim().toLowerCase();
  const hasSearch=searchText.length>0;

  const filtered=apps.filter(app=>{

    const categoryOk=
      currentCategory==="all"||
      app.category===currentCategory;

    const searchOk=
      !hasSearch||
      app.name.toLowerCase().includes(searchText)||
      app.type.toLowerCase().includes(searchText);

    return categoryOk&&searchOk;
  });

  appList.innerHTML="";

  if(!filtered.length){

    empty.classList.add("show");
    return;
  }

  empty.classList.remove("show");

  const grid=document.createElement("div");
  grid.className="grid";

  filtered.forEach(app=>{

    const card=document.createElement("div");
    card.className="app-card";

    if(selected.has(app.id)){
      card.classList.add("selected");
    }

    card.style.setProperty("--app-color",app.color);
    card.style.setProperty("--app-gradient",app.gradient);

    const check=document.createElement("div");
    check.className="check";
    check.textContent="✓";

    const icon=document.createElement("div");
    icon.className="app-icon";

    const fallback=document.createElement("span");
    fallback.className="fallback";
    fallback.textContent=initials(app.name);

    icon.appendChild(fallback);

    if(app.logo){

      const img=document.createElement("img");

      img.src=app.logo;
      img.alt="";

      img.onload=()=>{
        fallback.style.display="none";
      };

      img.onerror=()=>{
        img.remove();
      };

      icon.appendChild(img);
    }

    const name=document.createElement("div");
    name.className="app-name";
    name.textContent=app.name;

    card.append(check,icon,name);

    card.addEventListener("click",()=>{

      selected.has(app.id)
        ?selected.delete(app.id)
        :selected.add(app.id);

      render();
      updatePrice();
    });

    grid.appendChild(card);
  });

  appList.appendChild(grid);
}

function showToast(message){

  toast.textContent=message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer=setTimeout(()=>{
    toast.classList.remove("show");
  },3000);
}

function generateProfileToken(){
  try{
    if(window.crypto && crypto.randomUUID){
      return crypto.randomUUID();
    }
  }catch(error){}
  return "ac_"+Date.now()+"_"+Math.random().toString(36).slice(2,18);
}

function getProfileToken(){
  try{
    const saved=localStorage.getItem("appcore_profile_token");
    if(saved && /^[A-Za-z0-9_-]{20,80}$/.test(saved)){
      return saved;
    }
  }catch(error){}
  const token=generateProfileToken();
  try{
    localStorage.setItem("appcore_profile_token",token);
  }catch(error){}
  return token;
}

function generateOrderNumber(){
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes=new Uint8Array(10);
  if(window.crypto && crypto.getRandomValues){
    crypto.getRandomValues(bytes);
  }else{
    for(let i=0;i<bytes.length;i++) bytes[i]=Math.floor(Math.random()*256);
  }
  let value="";
  for(const byte of bytes) value+=alphabet[byte%alphabet.length];
  return "AC-"+value;
}

function normalizePhone(value){
  return value.replace(/[^\d+]/g,"").trim();
}

function isValidPhone(phone){

  const digits=phone.replace(/\D/g,"");

  return digits.length>=10&&digits.length<=15;
}

/*
 * Проверяем, что сохранённый заказ действительно
 * соответствует структуре нашего приложения.
 */
function isValidSavedOrder(order){

  if(!order||typeof order!=="object"){
    return false;
  }

  if(
    typeof order.order_number!=="string"||
    !order.order_number.trim()
  ){
    return false;
  }

  if(
    typeof order.client_phone!=="string"||
    !isValidPhone(order.client_phone)
  ){
    return false;
  }

  if(
    !Array.isArray(order.apps)||
    order.apps.length<1||
    order.apps.length>apps.length
  ){
    return false;
  }

  const ids=order.apps.map(app=>app&&app.id);

  if(
    ids.some(id=>typeof id!=="string")||
    new Set(ids).size!==ids.length
  ){
    return false;
  }

  if(
    ids.some(id=>!apps.some(app=>app.id===id))
  ){
    return false;
  }

  if(
    !Array.isArray(order.app_ids)||
    order.app_ids.length!==order.apps.length
  ){
    return false;
  }

  if(
    order.app_ids.some(id=>!ids.includes(id))
  ){
    return false;
  }

  if(
    typeof order.total!=="number"||
    !Number.isFinite(order.total)||
    order.total<0
  ){
    return false;
  }

  return true;
}

function getInstalledOrders(){
  try{
    const raw=localStorage.getItem(INSTALLED_ORDER_KEY);
    const list=raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }catch(error){
    return [];
  }
}

function markAppsInstalled(order){
  try{
    const list=getInstalledOrders();
    if(!list.includes(order.order_number)) list.push(order.order_number);
    localStorage.setItem(INSTALLED_ORDER_KEY,JSON.stringify(list));
  }catch(error){
    console.log("Installed state save error:",error);
  }
}

function isAppsInstalled(order){
  return getInstalledOrders().includes(order.order_number);
}

function saveClientOrder(order,createdAt=Date.now()){

  try{

    localStorage.setItem(
      CLIENT_ORDER_KEY,
      JSON.stringify(order)
    );

    localStorage.setItem(
      CLIENT_ORDER_TIME_KEY,
      String(createdAt)
    );

    return true;

  }catch(error){

    console.log(
      "Client order save error:",
      error
    );

    return false;
  }
}

function getClientOrder(){

  try{

    const saved=
      localStorage.getItem(
        CLIENT_ORDER_KEY
      );

    if(!saved)return null;

    const order=JSON.parse(saved);

    if(!isValidSavedOrder(order)){
      return null;
    }

    return order;

  }catch(error){

    return null;
  }
}

/*
 * Дополнительное восстановление через CLIENT_ORDER_KEY.
 * Используется только если запись ещё находится
 * внутри 12-часового периода.
 */
function clearOrderStorage(){
  try{
    localStorage.removeItem(CLIENT_ORDER_KEY);
    localStorage.removeItem(CLIENT_ORDER_TIME_KEY);
    localStorage.removeItem(INSTALLED_ORDER_KEY);
  }catch(error){}
}

function resetExpiredOrder(){
  if(statusTimer){
    clearInterval(statusTimer);
    statusTimer=null;
  }
  clearTimeout(lockTimer);
  lockTimer=null;
  currentOrder=null;
  selected.clear();
  statusPanel.classList.remove("show");
  cancelledPanel.classList.remove("show");
  installPanel.classList.remove("show");
  activationPanel.classList.remove("show");
  clearOrderStorage();
  render();
  updatePrice();
  updateWhatsAppLinks();
  showToast("Заказ завершён — можно оформить новый.");
}

function restoreOrderLock(){
  // Повторные покупки не блокируются. Восстанавливаем только последний заказ,
  // чтобы клиент мог продолжить отслеживать его статус после обновления страницы.
  const order=getClientOrder();
  if(!order){
    currentOrder=null;
    return;
  }
  currentOrder=order;
}

function openNewOrderConfirmation(){

  confirmOverlay.classList.add("show");

  document.body.style.overflow="hidden";
}

function closeNewOrderConfirmation(){

  confirmOverlay.classList.remove("show");

  document.body.style.overflow="";
}

function startNewOrder(){

  if(statusTimer){

    clearInterval(statusTimer);
    statusTimer=null;
  }

  clearTimeout(lockTimer);
  lockTimer=null;

  currentOrder=null;
  selected.clear();
  isCreatingOrder=false;

  clearOrderStorage();

  statusPanel.classList.remove("show");
  cancelledPanel.classList.remove("show");
  installPanel.classList.remove("show");
  activationPanel.classList.remove("show");

  paymentOverlay.classList.remove("show");

  nameInput.value="";
  phoneInput.value="";

  document.body.style.overflow="";

  render();
  updatePrice();
  updateWhatsAppLinks();

  closeNewOrderConfirmation();

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

  showToast(
    "Готово. Можно создать новый заказ."
  );
}

/*
 * Возвращает только безопасный список выбранных приложений.
 */
function getSafeSelectedApps(){

  const count=Number(selected.size);

  if(
    !Number.isInteger(count)||
    count<1||
    count>apps.length
  ){
    return null;
  }

  const selectedList=
    apps.filter(app=>selected.has(app.id));

  if(
    selectedList.length!==count||
    selectedList.length<1||
    selectedList.length>apps.length
  ){
    return null;
  }

  const ids=
    selectedList.map(app=>app.id);

  if(
    new Set(ids).size!==ids.length
  ){
    return null;
  }

  return selectedList;
}

function openPaymentModal(){

  const selectedList=
    getSafeSelectedApps();

  if(!selectedList){

    selected.clear();
    render();
    updatePrice();

    showToast(
      "Некорректное количество приложений"
    );

    return;
  }

  const price=
    calculatePrice(selectedList.length);

  selectedApps.innerHTML="";

  selectedList.forEach(app=>{

    const row=document.createElement("div");
    row.className="selected-app";

    const name=document.createElement("span");
    name.className="selected-app-name";
    name.textContent=app.name;

    const appPrice=document.createElement("span");
    appPrice.className="selected-app-price";
    appPrice.textContent=money(PRICE);

    row.append(name,appPrice);

    selectedApps.appendChild(row);
  });

  paymentTotal.textContent=
    money(price.total);

  paymentOverlay.classList.add("show");
  document.body.classList.add("checkout-open");

  document.body.style.overflow="hidden";
}

function closePaymentModal(){

  paymentOverlay.classList.remove("show");
  document.body.classList.remove("checkout-open");

  document.body.style.overflow="";
}

function humanStatus(status){

  switch(status){

    case"paid":
      return"Оплата подтверждена";

    case"completed":
      return"Заказ выполнен";

    case"cancelled":
      return"Заказ отменён";

    default:
      return"Ожидает проверки оплаты";
  }
}

function buildWhatsAppMessage(type){

  const order=
    currentOrder||
    getClientOrder();

  if(type==="support"){

    let text=
      "Здравствуйте!\n\n"+
      "Мне нужна техническая поддержка.\n\n";

    if(order){

      const appNames=
        (order.apps||[])
          .map(app=>app.name)
          .join(", ");

      text+=
        `Номер заказа: ${order.order_number}\n`+
        `Телефон клиента: ${order.client_phone}\n`+
        `Приложения: ${appNames||"—"}\n`+
        `Исходная сумма: ${money(order.original||0)}\n`+
        `Скидка: ${money(order.discount||0)}\n`+
        `Бесплатных приложений: ${order.free_apps||0}\n`+
        `Количество приложений: ${(order.apps||[]).length}\n`+
        `Сумма заказа: ${money(order.total||0)}\n`+
        `Статус: ${humanStatus(order.status)}\n\n`+
        "Опишите, пожалуйста, проблему.";

    }else{

      text+=
        "Заказ ещё не создан.\n\n"+
        "Опишите, пожалуйста, проблему.";
    }

    return text;
  }

  if(type==="status"){

    if(!order){

      return(
        "Здравствуйте!\n\n"+
        "Не обновляется статус заказа.\n\n"+
        "Заказ ещё не найден.\n\n"+
        "Проверьте, пожалуйста, статус заказа."
      );
    }

    const appNames=
      (order.apps||[])
        .map(app=>app.name)
        .join(", ");

    return(
      "Здравствуйте!\n\n"+
      "Не обновляется статус заказа.\n\n"+
      `Номер заказа: ${order.order_number}\n`+
      `Телефон клиента: ${order.client_phone}\n`+
      `Приложения: ${appNames||"—"}\n`+
      `Исходная сумма: ${money(order.original||0)}\n`+
      `Скидка: ${money(order.discount||0)}\n`+
      `Бесплатных приложений: ${order.free_apps||0}\n`+
      `Количество приложений: ${(order.apps||[]).length}\n`+
      `Сумма заказа: ${money(order.total||0)}\n`+
      `Статус: ${humanStatus(order.status)}\n\n`+
      "Пожалуйста, проверьте мой заказ."
    );
  }

  if(!order){

    return(
      "Здравствуйте!\n\n"+
      "Хочу активировать приложения.\n\n"+
      "Заказ ещё не найден."
    );
  }

  const appNames=
    (order.apps||[])
      .map(app=>app.name)
      .join(", ");

  return(
    "Здравствуйте!\n\n"+
    "Хочу активировать приложения.\n\n"+
    `Номер заказа: ${order.order_number}\n`+
    `Телефон клиента: ${order.client_phone}\n`+
    `Приложения: ${appNames||"—"}\n`+
    `Сумма заказа: ${money(order.total||0)}\n`+
    "Статус: Оплата подтверждена\n\n"+
    "Все приложения установлены."
  );
}

function updateWhatsAppLinks(){

  const supportUrl=
    "https://wa.me/"+
    WHATSAPP_NUMBER+
    "?text="+
    encodeURIComponent(
      buildWhatsAppMessage("support")
    );

  supportTopButton.href=supportUrl;

  statusSupportButton.href=
    "https://wa.me/"+
    WHATSAPP_NUMBER+
    "?text="+
    encodeURIComponent(
      buildWhatsAppMessage("status")
    );

  activationWhatsapp.href=
    "https://wa.me/"+
    WHATSAPP_NUMBER+
    "?text="+
    encodeURIComponent(
      buildWhatsAppMessage("activation")
    );
}

async function createOrder(){

  if(isCreatingOrder){

    showToast(
      "Заказ уже отправляется…"
    );

    return false;
  }

  const name=nameInput.value.trim().slice(0,60);

  if(!name){

    showToast("Введите имя");

    nameInput.focus();

    return false;
  }

  const phone=
    normalizePhone(
      phoneInput.value
    );

  if(!isValidPhone(phone)){

    showToast(
      "Введите корректный номер телефона"
    );

    phoneInput.focus();

    return false;
  }

  const selectedList=
    getSafeSelectedApps();

  if(!selectedList){

    showToast(
      "Некорректное количество приложений"
    );

    selected.clear();
    render();
    updatePrice();

    return false;
  }

  /*
   * Дополнительная проверка перед отправкой.
   */
  if(
    selectedList.length<1||
    selectedList.length>apps.length
  ){

    showToast(
      "Некорректное количество приложений"
    );

    return false;
  }

  const price=calculatePrice(selectedList.length);

  isCreatingOrder=true;

  paymentDone.disabled=true;

  paymentDone.textContent=
    "Сохраняем заказ…";

  try{

    const savedOrderReferralCode =
      localStorage.getItem(REFERRAL_CODE_KEY) ||
      localStorage.getItem("referral_code") ||
      null;

    const {
      data: createdOrder,
      error
    } = await rpc(
      "create_order",
      {
        p_client_name: name,
        p_client_phone: phone,
        p_app_ids: selectedList.map(app=>app.id),
        p_profile_token: getProfileToken(),
        p_referral_code: isValidReferralCode(savedOrderReferralCode)
          ? savedOrderReferralCode.trim()
          : null
      }
    );

    if(error){

      console.error(error);

      const message=error.message||"";

      if(message.includes("RATE_LIMIT:")){
        showToast(
          "Лимит заказов достигнут. Попробуйте снова через 10 минут."
        );
      }else{
        showToast(
          "Ошибка создания заказа: "+
          (message||"неизвестная ошибка")
        );
      }

      return false;
    }

    const createdAt=Date.now();
    currentOrder=createdOrder;

    saveClientOrder(
      createdOrder,
      createdAt
    );

    closePaymentModal();

    selected.clear();

    render();
    updatePrice();

    showOrderStatus(
      createdOrder,
      true
    );

    startStatusChecking();

    updateWhatsAppLinks();

    showToast(
      "Заказ "+
      createdOrder.order_number+
      " создан"
    );

    const orderApps =
      Array.isArray(createdOrder.apps)
        ? createdOrder.apps.map(app=>app.name).filter(Boolean).join(", ")
        : selectedList.map(app=>app.name).join(", ");

    // ВАЖНО: текст строится только из ASCII + \uXXXX escape-последовательностей.
    // Это исключает повреждение emoji в исходнике JS. Для WhatsApp используем
    // официальный api.whatsapp.com/send URL и encodeURIComponent (UTF-8).
    let whatsappText =
      "Здравствуйте! Хочу оформить заказ.\n\n" +
      "\u{1F4E6} ЗАКАЗ\n" +
      `Номер заказа: ${createdOrder.order_number}\n` +
      `\u{1F4F1} Приложение: ${orderApps}\n` +
      `\u{1F464} Клиент: ${createdOrder.client_name}\n` +
      `\u{1F4DE} Телефон: ${createdOrder.client_phone}\n\n` +
      `\u{1F4B0} Стоимость: ${createdOrder.original || 0} ₽\n`;

    if(Number(createdOrder.discount || 0) > 0){
      whatsappText += `\u{1F3F7}\uFE0F Скидка: ${createdOrder.discount} ₽\n`;
    }

    whatsappText +=
      `\u{1F4B5} Итого к оплате: ${createdOrder.total || 0} ₽\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "\u{1F4B3} ОПЛАТА ЗАКАЗА\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "\u{1F3E6} Т-Банк\n" +
      "\u{1F464} Мурат Межидов Х\n" +
      "\u{1F4F1} +79289480706\n\n" +
      `\u{1F4B0} К оплате: ${createdOrder.total || 0} ₽\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "\u{1F4CE} ЧЕК ОБ ОПЛАТЕ ОБЯЗАТЕЛЕН\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "\u{2705} После проверки чека заказ будет подтверждён.\n\n" +
      "\u{1F310} После подтверждения вернитесь на сайт в «Ваш профиль», чтобы получить доступ к заказу.\n" +
      "━━━━━━━━━━━━━━━━━━";

    window.location.href =
      "https://api.whatsapp.com/send/?phone=" +
      encodeURIComponent(WHATSAPP_NUMBER) +
      "&text=" +
      encodeURIComponent(whatsappText);

    return true;

  }catch(error){

    console.error(error);

    showToast(
      "Ошибка соединения с сервером"
    );

    return false;

  }finally{

    isCreatingOrder=false;

    paymentDone.disabled=false;

    paymentDone.textContent=
      "Оформить заказ";
  }
}

function hidePaymentSupport(){
  if(statusSupportButton) statusSupportButton.style.display="none";
  const supportLink=document.getElementById("orderWhatsapp");
  if(supportLink) supportLink.style.display="none";
  if(statusSupportButton) statusSupportButton.style.display="none";
}

function showPaymentSupport(){
  if(statusSupportButton) statusSupportButton.style.display="flex";
}

function showPaymentConfirmed(order,autoScroll=false){

  statusPanel.classList.add("show");
  installPanel.classList.remove("show");
  cancelledPanel.classList.remove("show");

  hidePaymentSupport();
  statusTitle.textContent="✅ Оплата подтверждена";
  statusText.textContent="Ваш заказ подтверждён. Приложения доступны в вашем профиле.";

  orderNumberDisplay.textContent=
    "Номер заказа: "+order.order_number;

  let profileButton=document.getElementById("profileOrderButton");

  if(!profileButton){
    profileButton=document.createElement("a");
    profileButton.id="profileOrderButton";
    profileButton.className="new-order-button";
    profileButton.textContent="👤 Перейти в профиль →";
    profileButton.style.display="block";
    profileButton.style.textAlign="center";
    profileButton.style.textDecoration="none";
    profileButton.style.marginTop="14px";
    statusPanel.insertBefore(profileButton,statusPanel.querySelector(".status-support"));
  }

  profileButton.href="profile.html";
  profileButton.style.display="block";

  if(autoScroll){
    setTimeout(()=>{
      statusPanel.scrollIntoView({
        behavior:"smooth",
        block:"center"
      });
    },120);
  }
}

function showOrderStatus(order,autoScroll=false){

  statusPanel.classList.add("show");

  installPanel.classList.remove("show");

  const profileButton=document.getElementById("profileOrderButton");
  if(profileButton) profileButton.style.display="none";
  cancelledPanel.classList.remove("show");

  statusTitle.textContent=
    "⏳ Заказ принят";

  statusText.textContent=
    "Ожидайте проверки оплаты. После подтверждения оплаты приложения будут доступны для установки.";

  orderNumberDisplay.textContent=
    "Номер заказа: "+
    order.order_number;

  updateWhatsAppLinks();

  if(autoScroll){

    setTimeout(()=>{

      statusPanel.scrollIntoView({
        behavior:"smooth",
        block:"center"
      });

      statusPanel.classList.remove("focused");

      void statusPanel.offsetWidth;

      statusPanel.classList.add("focused");

      setTimeout(()=>{

        statusPanel.classList.remove("focused");

      },2300);

    },120);
  }
}

function renderCancelled(order){

  statusPanel.classList.remove("show");

  installPanel.classList.remove("show");

  cancelledPanel.classList.add("show");
currentOrder=null;

if(statusTimer){
  clearInterval(statusTimer);
  statusTimer=null;
}

try{
  localStorage.removeItem(CLIENT_ORDER_KEY);
  localStorage.removeItem(CLIENT_ORDER_TIME_KEY);
  localStorage.removeItem(INSTALLED_ORDER_KEY);
}catch(error){}
  cancelledOrderNumber.textContent=
    "Заказ: "+
    order.order_number;

  updateWhatsAppLinks();
}

async function checkOrderStatus(){

  const order=currentOrder;

  if(!order){
    return;
  }

  if(!isValidSavedOrder(order)){

    console.error(
      "Invalid current order"
    );

    return;
  }

  try{

    const {data,error}=
      await rpc(
        "get_client_order_status",
        {
          p_order_number:
            order.order_number,

          p_client_phone:
            order.client_phone
        }
      );

    if(error){

      console.error(
        "Status error:",
        error
      );

      return;
    }

    if(!data||!data.length)return;

    const serverOrder =
      Array.isArray(data) ? data[0] : data;

    if(
      !serverOrder ||
      typeof serverOrder.status !== "string"
    ){
      return;
    }

    const updatedOrder={
      ...order,

      status:
        serverOrder.status,

      apps:
        Array.isArray(serverOrder.apps)&&
        serverOrder.apps.length
          ?serverOrder.apps
          :order.apps
    };

    if(!isValidSavedOrder(updatedOrder)){

      console.error(
        "Invalid server order data"
      );

      return;
    }

    let createdAt=Date.now();
    try{
      const savedTime=Number(localStorage.getItem(CLIENT_ORDER_TIME_KEY));
      if(Number.isFinite(savedTime) && savedTime>0) createdAt=savedTime;
    }catch(error){}

    saveClientOrder(
      updatedOrder,
      createdAt
    );

    currentOrder=
      updatedOrder;

    

    updateWhatsAppLinks();

    if(
      serverOrder.status===
      "awaiting_review"
    ){

      showOrderStatus(
        updatedOrder
      );

      statusTitle.textContent="⏳ Ожидание оплаты";
  showPaymentSupport();
      statusText.textContent="Заказ принят. Ожидайте подтверждения оплаты. После подтверждения здесь появится кнопка перехода в профиль.";

      return;
    }

    if(
      serverOrder.status===
      "paid"||
      serverOrder.status===
      "completed"
    ){

      showPaymentConfirmed(
        updatedOrder
      );

      return;
    }

    if(
      serverOrder.status===
      "cancelled"
    ){

      renderCancelled(
        updatedOrder
      );
    }

  }catch(error){

    console.error(
      "Check status error:",
      error
    );
  }
}

function startStatusChecking(){

  if(!currentOrder){
    return;
  }

  if(statusTimer){

    clearInterval(
      statusTimer
    );
  }

  checkOrderStatus();

  statusTimer=
    setInterval(
      checkOrderStatus,
      7000
    );
}

continueButton.addEventListener(
  "click",
  openPaymentModal
);

paymentClose.addEventListener(
  "click",
  closePaymentModal
);

paymentOverlay.addEventListener(
  "click",
  event=>{

    if(
      event.target===
      paymentOverlay
    ){

      closePaymentModal();
    }
  }
);

confirmClose.addEventListener(
  "click",
  closeNewOrderConfirmation
);

confirmCancel.addEventListener(
  "click",
  closeNewOrderConfirmation
);

confirmYes.addEventListener(
  "click",
  startNewOrder
);

confirmOverlay.addEventListener(
  "click",
  event=>{

    if(
      event.target===
      confirmOverlay
    ){

      closeNewOrderConfirmation();
    }
  }
);

document.addEventListener(
  "keydown",
  event=>{

    if(event.key==="Escape"){

      closePaymentModal();
      closeNewOrderConfirmation();
    }
  }
);

document
.querySelectorAll(".copy-button")
.forEach(button=>{

  button.addEventListener(
    "click",
    async()=>{

      const value=
        button.dataset.copy;

      try{

        await navigator.clipboard.writeText(
          value
        );

      }catch(error){

        const textarea=
          document.createElement(
            "textarea"
          );

        textarea.value=value;

        textarea.style.position=
          "fixed";

        textarea.style.opacity=
          "0";

        document.body.appendChild(
          textarea
        );

        textarea.select();

        try{

          document.execCommand(
            "copy"
          );

        }catch(e){}

        textarea.remove();
      }

      const old=
        button.textContent;

      button.textContent=
        "Скопировано";

      setTimeout(()=>{

        button.textContent=
          old;

      },1500);
    }
  );
});

search.addEventListener(
  "input",
  ()=>{

    query=search.value;

    clear.style.display=
      query
        ?"block"
        :"none";

    render();
  }
);

clear.addEventListener(
  "click",
  ()=>{

    search.value="";
    query="";

    clear.style.display=
      "none";

    search.focus();

    render();
  }
);

categories.addEventListener(
  "click",
  event=>{

    const button=
      event.target.closest(
        ".category"
      );

    if(!button)return;

    document
      .querySelectorAll(
        ".category"
      )
      .forEach(item=>{

        item.classList.remove(
          "active"
        );
      });

    button.classList.add(
      "active"
    );

    currentCategory=
      button.dataset.category;

    render();
  }
);

paymentDone.addEventListener(
  "click",
  createOrder
);

installedButton.addEventListener(
  "click",
  ()=>{

    if(!currentOrder)return;

    markAppsInstalled(
      currentOrder
    );

    installedButton.disabled=
      true;

    installedButton.textContent=
      "✅ Приложения установлены";

    activationPanel.classList.add(
      "show"
    );

    updateWhatsAppLinks();

    showToast(
      "Готово! Теперь можно перейти в WhatsApp."
    );
  }
);

function initTelegram(){

  if(
    window.Telegram&&
    window.Telegram.WebApp
  ){

    try{

      const tg=
        window.Telegram.WebApp;

      tg.ready();
      tg.expand();

      if(tg.setHeaderColor){

        tg.setHeaderColor(
          "#08090d"
        );
      }

      if(tg.setBackgroundColor){

        tg.setBackgroundColor(
          "#08090d"
        );
      }

    }catch(error){

      console.log(error);
    }
  }
}

/*
 * Восстанавливаем последний заказ ДО render(),
 * но он не блокирует оформление следующих заказов.
 */
restoreOrderLock();

if(currentOrder){

  startStatusChecking();
}

render();

updatePrice();

updateWhatsAppLinks();

initTelegram();
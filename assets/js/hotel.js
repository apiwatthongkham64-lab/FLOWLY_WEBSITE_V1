const menuBtn=document.querySelector('.menu-btn');
const nav=document.querySelector('.main-nav');
if(menuBtn&&nav){
  menuBtn.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded',open?'true':'false');
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuBtn.setAttribute('aria-expanded','false')}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menuBtn.setAttribute('aria-expanded','false')}});
}

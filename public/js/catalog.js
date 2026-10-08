(function () {
  'use strict';
  var params = new URLSearchParams(location.search), form = document.getElementById('catalogFilters');
  if (form) {
    var query=document.getElementById('catalogQuery'), category=document.getElementById('catalogCategory'), sort=document.getElementById('catalogSort');
    query.value=params.get('q')||''; category.value=params.get('cat')||''; sort.value=params.get('sort')||'featured';
    var originalCards=Array.from(document.querySelectorAll('.catalog-card'));
    function filter() {
      var words=query.value.toLowerCase().trim().split(/\s+/).filter(Boolean), count=0;
      var cards=originalCards.slice();
      if(sort.value!=='featured') cards.sort(function(a,b){return a.dataset.title.localeCompare(b.dataset.title)*(sort.value==='za'?-1:1);});
      cards.forEach(function(card){var text=card.dataset.title+' '+card.dataset.tags; card.hidden=!!(category.value&&!card.dataset.tags.split(' ').includes(category.value))||!words.every(function(w){return text.includes(w);});if(!card.hidden)count++;document.getElementById('catalogGrid').appendChild(card);});
      document.getElementById('catalogCount').textContent=count+' styles';document.getElementById('catalogEmpty').hidden=count>0;
      document.getElementById('catalogLiveSearch').href='/find/?q='+encodeURIComponent(query.value||category.value||'fashion');
      document.getElementById('catalogTitle').textContent=category.value?category.options[category.selectedIndex].text+' styles':'Find your next favourite.';
    }
    form.addEventListener('submit',function(ev){ev.preventDefault();var p=new URLSearchParams(new FormData(form));history.replaceState(null,'','?'+p.toString());filter();});filter();
  }
  var detail=document.querySelector('[data-style-id]');
  if(detail){var id=detail.dataset.styleId,save=document.getElementById('styleSave');
    function refresh(){var has=FD.saved.has('style',id);save.textContent=has?'Saved':'Save this style';save.setAttribute('aria-pressed',String(has));FD.refreshDots();}
    save.addEventListener('click',function(){if(FD.saved.has('style',id))FD.saved.remove('style',id);else FD.saved.add({searchId:'style',key:id,title:detail.querySelector('h1').textContent,image:detail.querySelector('img').getAttribute('src'),storeName:'Style inspiration',price:null,match:'editorial'});refresh();});refresh();
    document.getElementById('styleShare').addEventListener('click',function(){FD.copy(location.href).then(function(){document.getElementById('styleStatus').textContent='Link copied';}).catch(function(){document.getElementById('styleStatus').textContent=location.href;});});
  }
})();

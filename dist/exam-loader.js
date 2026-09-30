(function(){
 const year=Number(new URLSearchParams(location.search).get('year'))||2025;
 const selected=globalThis.EXAM_ARCHIVE[String(year)]||globalThis.EXAM_ARCHIVE['2025'];
 globalThis.ACTIVE_EXAM=selected;
 if(selected.year===2025)selected.pmMeta=globalThis.META_2025;
 else {globalThis.EXAM=selected.am;globalThis.PM_FIELDS=selected.fields;}
})();

async function fetchDocs() {
  const res = await fetch('https://lngyxcbbsbqkooybipbj.supabase.co/rest/v1/?apikey=sb_publishable_cL7rhsRuQF6A50QTBwhTOQ_V802e0ub');
  const json = await res.json();
  console.log(json);
}
fetchDocs();

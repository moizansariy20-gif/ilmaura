const url = 'https://lngyxcbbsbqkooybipbj.supabase.co/rest/v1/schools?select=*&limit=1';
const key = 'sb_publishable_cL7rhsRuQF6A50QTBwhTOQ_V802e0ub';
fetch(url, { 
  method: 'OPTIONS',
  headers: { 
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'apikey,authorization',
    'Origin': 'http://localhost:3000'
  } 
})
.then(res => {
  console.log('OPTIONS status:', res.status);
  console.log('Access-Control-Allow-Origin:', res.headers.get('Access-Control-Allow-Origin'));
})
.catch(err => console.error('OPTIONS error:', err));

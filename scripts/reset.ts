const r=await fetch('http://127.0.0.1:4310/api/reset',{method:'POST'});if(!r.ok)throw Error('RESET_FAILED');console.log('In-memory demo history reset. Payment history is not altered.');

export {};

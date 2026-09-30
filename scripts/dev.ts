import {spawn} from 'node:child_process';
const processes=[spawn('node',['--import','tsx','apps/api/src/server.ts'],{stdio:'inherit'}),spawn('node',['node_modules/next/dist/bin/next','dev','apps/web','-p','3000','-H','127.0.0.1'],{stdio:'inherit',env:{...process.env,WATCHPACK_POLLING:'true'}})];
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{processes.forEach(p=>p.kill(signal));});

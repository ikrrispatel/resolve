import {runBenchmark} from '../packages/benchmark/run';
import {mkdir,writeFile} from 'node:fs/promises';
const result=runBenchmark();await mkdir('outputs',{recursive:true});await writeFile('outputs/benchmark.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,results:result.results.map(({cases,...r})=>r)},null,2));

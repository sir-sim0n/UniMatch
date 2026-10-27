import {readFile,writeFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const source="import {createClient} from 'npm:@supabase/supabase-js@2.118.0';\n// Generated from the tested game core and handler. No administrative key enters the client.\n"+await read('web/games-core.mjs')+(await read('supabase/functions/_shared/game-handler.mjs')).split('\n').slice(1).join('\n')+await read('supabase/functions/_shared/runtime.ts');
await writeFile(new URL('../supabase/functions/orbit-games/index.ts',import.meta.url),source);

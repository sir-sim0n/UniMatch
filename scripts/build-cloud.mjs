import {build} from 'esbuild';
await build({stdin:{contents:"export {createClient} from '@supabase/supabase-js';",resolveDir:process.cwd()},outfile:'web/vendor/supabase.mjs',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof'});

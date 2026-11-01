/* Source-only QA checks, no server/API required. Run after npm install. */
const fs=require('fs');
const path=require('path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const app=path.join(root,'app');
const publicDir=path.join(root,'public');
const read=p=>fs.readFileSync(p,'utf8');
function files(dir,extensions){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(v=>v.isDirectory()?(['node_modules','.next','.git','.cache','npm-cache'].includes(v.name)?[]:files(path.join(dir,v.name),extensions)):extensions.some(ext=>v.name.endsWith(ext))?[path.join(dir,v.name)]:[]);}
const sourceFiles=files(root,['.ts','.tsx']).filter(p=>!p.includes('node_modules')&&!p.includes('.next'));
const routes=new Set(['/']);for(const f of files(app,['page.tsx'])){
 if(path.basename(f)!=='page.tsx')continue;
 const relative=path.relative(app,path.dirname(f)).split(path.sep).join('/');
 routes.add('/'+(relative==='.'?'':relative));
}
const error=[],warning=[];
let checkedImages=0,checkedLinks=0;
for(const file of sourceFiles){
 const relative=path.relative(root,file);
 const source=read(file);
 const scriptKind=file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS;
 const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,scriptKind);
 for(const e of tree.parseDiagnostics) error.push(`${relative}: TS parsing: ${e.messageText}`);
 // Reject duplicate keys: TypeScript flags these even if the parser accepted the file.
 function auditProperties(node){
   if(ts.isObjectLiteralExpression(node)){
     const seen=new Set();
     for(const prop of node.properties){
       if(!ts.isPropertyAssignment(prop)) continue;
       const name=ts.isStringLiteral(prop.name) || ts.isIdentifier(prop.name) ? prop.name.text : null;
       if(!name) continue;
       if(seen.has(name))error.push(`${relative}: duplicate object key ${name}`);
       seen.add(name);
     }
   }
   ts.forEachChild(node,auditProperties);
 }
 auditProperties(tree);
 const referencedPaths=[...source.matchAll(/(?:src|photo|image|backgroundImage)\s*[:=]\s*[{'"]+\s*['"](\/(?:images|brand)\/[^'"]+)['"]/g)];
 for(const m of referencedPaths){const src=m[1];checkedImages++;if(!fs.existsSync(path.join(publicDir,src)))error.push(`${relative}: image missing ${src}`)}
 for(const m of source.matchAll(/href\s*=\s*['"](\/[^'"?#]*)(?:[?#][^'"]*)?['"]/g)){
   const href=m[1];checkedLinks++;
   if(href.startsWith('//')||href==='/')continue;
   const route=href.replace(/\/$/,'');
   const match=[...routes].some(v=>v===route||(/\[.+?\]/.test(v)&&new RegExp('^'+v.replace(/\[.+?\]/g,'[^/]+')+'$').test(route)));
   if(!match)warning.push(`${relative}: route not resolved ${href}`);
 }
}
for(const css of files(app,['.css'])){
 const source=read(css);
 for(const m of source.matchAll(/url\(\s*['"]?(\/(?:images|brand)\/[^'"\)]+)['"]?\s*\)/g)){
   checkedImages++;
   if(!fs.existsSync(path.join(publicDir,m[1])))error.push(`${path.relative(root,css)}: image missing ${m[1]}`);
 }
}
// A single corporate website with one embedded, role-aware water-platform preview.
const dash=path.join(root,'components','UnifiedWaterPlatform.tsx');
const homePage=path.join(root,'app','page.tsx');
if(!fs.existsSync(dash))error.push('Unified platform component missing');
else {
  const source=read(dash);
  for(const role of ["'farmer'","'irrigation'","'authority'","'admin'"]){
    if(!source.includes(role))error.push(`Missing user view ${role}`);
  }
  for(const view of ["'map'","'flow'","'devices'","'advice'","'alerts'"]){
    if(!source.includes(view))error.push(`Missing platform tab ${view}`);
  }
}
if(!read(homePage).includes('<UnifiedWaterPlatform/>')) error.push('Unified platform is not mounted on homepage');
if(!read(homePage).includes('id="platforma"')) error.push('Platform anchor missing');
if(read(homePage).includes('<WaterRoleDashboard/>'))error.push('Old duplicate role dashboard still mounted');
for(const oldRoute of ['platform','suv-platformasi','dashboard','water-demo','water-network','water-intelligence']){
  const file=path.join(app,oldRoute,'page.tsx');
  if(!fs.existsSync(file)||!read(file).includes("redirect('/#platforma')"))error.push('Old platform not redirected: '+oldRoute);
}
const publicHeader=read(path.join(root,'components','CorporateHeader.tsx'));
if(!publicHeader.includes("['Platforma','#platforma']"))error.push('Unified platform missing from public navigation');
if(publicHeader.includes("['Suv monitoringi','#suv-monitoringi']"))error.push('Duplicate monitoring navigation remains');
for(const fname of ['setup_windows.bat','start_windows.bat']) if(!fs.existsSync(path.join(root,'..',fname)))error.push(`Missing Windows script: ${fname}`);
for(const msg of warning)console.log('WARNING',msg);
for(const msg of error)console.error('ERROR',msg);
console.log(JSON.stringify({typescriptFiles:sourceFiles.length,routeCount:routes.size,assetReferences:checkedImages,linkReferences:checkedLinks,warnings:warning.length,errors:error.length},null,2));
process.exitCode=error.length?1:0;

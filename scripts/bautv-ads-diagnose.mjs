// BauTV Ads-Diagnose-Pull: Search-Spirale, Conversion-Mix, Woche, Suchbegriffe -> ads-diagnose.json
import { readFileSync, writeFileSync } from "node:fs"; import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
for (const line of readFileSync(path.join(root,".env.local"),"utf8").split(/\r?\n/)){const m=line.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];}
const OUT = "C:/Users/karent/Documents/Software/Schulungen/agenten-workshop/referenz-bautv/ads-diagnose.json";
const tr=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:process.env.GADS_OAUTH_CLIENT_ID,client_secret:process.env.GADS_OAUTH_CLIENT_SECRET,refresh_token:process.env.GADS_REFRESH_TOKEN,grant_type:"refresh_token"})});
const tok=(await tr.json()).access_token;
const cid=process.env.GADS_CUSTOMER_ID_NETCO.replace(/-/g,""),mid=process.env.GADS_MANAGER_CUSTOMER_ID.replace(/-/g,"");
async function q(query){const all=[];let pt;for(let i=0;i<200;i++){const res=await fetch(`https://googleads.googleapis.com/v22/customers/${cid}/googleAds:search`,{method:"POST",headers:{Authorization:`Bearer ${tok}`,"developer-token":process.env.GADS_DEVELOPER_TOKEN,"login-customer-id":mid,"Content-Type":"application/json"},body:JSON.stringify(pt?{query,pageToken:pt}:{query})});if(!res.ok)throw new Error(`${res.status}: ${await res.text()}`);const d=await res.json();all.push(...(d.results||[]));if(!d.nextPageToken)break;pt=d.nextPageToken;}return all;}
const isBKD=n=>/^bk[-\s]/i.test(n||"")&&!/nl|-it|\bit\b/i.test(n||"");
const today=new Date().toISOString().slice(0,10);
const dOff=n=>{const d=new Date();d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};

// 1) Search-Spirale: BK-D SEARCH je Monat
const r1=await q(`SELECT campaign.name, segments.month, metrics.cost_micros, metrics.clicks, metrics.conversions
  FROM campaign WHERE segments.date BETWEEN '2025-01-01' AND '${today}' AND campaign.advertising_channel_type='SEARCH'`);
const sp={};for(const x of r1){const n=x.campaign?.name;if(!isBKD(n))continue;const mo=(x.segments.month||"").slice(0,7);if(!mo)continue;sp[mo]??={cost:0,clicks:0,conv:0};const me=x.metrics||{};sp[mo].cost+=(+me.costMicros||0)/1e6;sp[mo].clicks+=+me.clicks||0;sp[mo].conv+=+me.conversions||0;}
const searchSpiral=Object.keys(sp).sort().map(mo=>({month:mo,cost:Math.round(sp[mo].cost),clicks:sp[mo].clicks,cpc:sp[mo].clicks?+(sp[mo].cost/sp[mo].clicks).toFixed(2):0,conv:Math.round(sp[mo].conv)}));

// 2) Conversion-Mix BK-D 90 Tage
const r2=await q(`SELECT campaign.name, segments.conversion_action_name, metrics.conversions FROM campaign WHERE segments.date BETWEEN '${dOff(-90)}' AND '${today}'`);
const cmix={};for(const x of r2){if(!isBKD(x.campaign?.name))continue;const a=x.segments.conversionActionName||"(?)";cmix[a]=(cmix[a]||0)+(+x.metrics.conversions||0);}
const convMix=Object.entries(cmix).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([name,conv])=>({name,conv:+conv.toFixed(1)}));

// 3) Diese Woche vs Vorwoche, BK-D je Kampagne
async function weekByCampaign(from,to){const r=await q(`SELECT campaign.name, metrics.cost_micros, metrics.clicks, metrics.conversions FROM campaign WHERE segments.date BETWEEN '${from}' AND '${to}'`);const c={};let tot={cost:0,clicks:0,conv:0};for(const x of r){const n=x.campaign?.name;if(!isBKD(n))continue;const me=x.metrics||{};const cost=(+me.costMicros||0)/1e6,clk=+me.clicks||0,cv=+me.conversions||0;tot.cost+=cost;tot.clicks+=clk;tot.conv+=cv;c[n]??={cost:0,conv:0};c[n].cost+=cost;c[n].conv+=cv;}return{from,to,total:{cost:Math.round(tot.cost),clicks:tot.clicks,conv:Math.round(tot.conv)},campaigns:Object.entries(c).filter(([,v])=>v.cost>1).sort((a,b)=>b[1].cost-a[1].cost).map(([name,v])=>({name,cost:Math.round(v.cost),conv:+v.conv.toFixed(1)}))};}
const thisWeek=await weekByCampaign(dOff(-6),today);
const lastWeek=await weekByCampaign(dOff(-13),dOff(-7));

// 4) Suchbegriffe BK-SN-D-Conmax 60 Tage
const r4=await q(`SELECT search_term_view.search_term, campaign.name, metrics.cost_micros, metrics.clicks, metrics.conversions FROM search_term_view WHERE segments.date BETWEEN '${dOff(-60)}' AND '${today}'`);
const term={};for(const x of r4){const n=x.campaign?.name||"";if(!/^bk-sn-d-conmax/i.test(n))continue;const t=x.searchTermView?.searchTerm||"(?)";term[t]??={cost:0,clicks:0,conv:0};const me=x.metrics||{};term[t].cost+=(+me.costMicros||0)/1e6;term[t].clicks+=+me.clicks||0;term[t].conv+=+me.conversions||0;}
const terms=Object.entries(term).sort((a,b)=>b[1].cost-a[1].cost).map(([t,v])=>({term:t,cost:Math.round(v.cost),clicks:v.clicks,conv:+v.conv.toFixed(1)}));
const termsTotal={count:terms.length,cost:terms.reduce((a,t)=>a+t.cost,0),conv:+terms.reduce((a,t)=>a+t.conv,0).toFixed(1)};

writeFileSync(OUT, JSON.stringify({generatedAt:today,searchSpiral,convMix,thisWeek,lastWeek,terms:terms.slice(0,25),termsTotal},null,2),"utf8");
console.error("✓ geschrieben:",OUT);
console.error(JSON.stringify({spiralMonths:searchSpiral.length,convMix:convMix.length,terms:termsTotal},null,1));

import { createClient } from "npm:@supabase/supabase-js@2.99.3";
import { parseData, emptyData } from "./lib/data.ts";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const allowedOrigins = ["https://giafrotas.vercel.app", "http://127.0.0.1:3001", "http://localhost:3001"];
const hash = async (value: string) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))].map(v => v.toString(16).padStart(2,"0")).join("");
Deno.serve(async (req: Request) => {
 const origin = req.headers.get("origin") || "";
 const headers = { "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0], "Access-Control-Allow-Headers": "authorization, content-type, apikey", "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS", "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin" };
 const respond = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers });
 if(req.method==="OPTIONS") return new Response(null, {headers});
 if(origin && !allowedOrigins.includes(origin)) return respond({error:"Origem não autorizada."},403);
 const action = new URL(req.url).pathname.split("/").pop();
 try {
  if(action==="login" && req.method==="POST") {
   const input=await req.json();
   if(typeof input.username!=="string" || typeof input.password!=="string" || input.username.length>100 || input.password.length>256) return respond({error:"Usuário ou senha inválidos."},400);
   const ip=req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
   for(const key of [await hash("ip:"+ip), await hash("user:"+input.username.trim().toLowerCase())]) {
    const limit=await db.rpc("gia_rate_limit",{p_key:key}); if(limit.error) throw limit.error;
    if(!limit.data) return respond({error:"Muitas tentativas. Aguarde 15 minutos."},429);
   }
   const result=await db.rpc("gia_check_password",{p_username:input.username.trim(),p_password:input.password});
   if(result.error) throw result.error;
   const user=result.data?.[0]; if(!user) return respond({error:"Usuário ou senha inválidos."},401);
   const token=crypto.randomUUID()+crypto.randomUUID();
   const session=await db.from("gia_sessions").insert({token_hash:await hash(token),user_id:user.id,expires_at:new Date(Date.now()+8*3600000).toISOString()}); if(session.error) throw session.error;
   return respond({user,token});
  }
  const token=(req.headers.get("authorization")||"").replace(/^Bearer /,"");
  if(!token) return respond({error:"Entre novamente."},401);
  const session=await db.from("gia_sessions").select("user_id").eq("token_hash",await hash(token)).gt("expires_at",new Date().toISOString()).maybeSingle();
  if(session.error) throw session.error;
  if(!session.data) return respond({error:"Sessão expirada. Entre novamente."},401);
  const profile=await db.from("gia_users").select("id,username,role,disabled").eq("id",session.data.user_id).single();
  if(profile.error) throw profile.error;
  if(profile.data.disabled) return respond({error:"Acesso desativado."},403);
  const {disabled,...user}=profile.data;
  if(action==="profile" && req.method==="GET") return respond(user);
  if(action==="logout" && req.method==="POST") { const result=await db.from("gia_sessions").delete().eq("token_hash",await hash(token)); if(result.error) throw result.error; return respond({ok:true}); }
  if(action==="users" && req.method==="POST") {
   if(user.role!=="admin") return respond({error:"Somente o administrador pode gerenciar acessos."},403);
   const input=await req.json();
   if(input.id===user.id && (input.disable || input.role!=="admin")) return respond({error:"Você não pode remover seu próprio acesso."},400);
   if(input.disable) { const result=await db.from("gia_users").update({disabled:true}).eq("id",input.id); if(result.error) throw result.error; return respond({ok:true}); }
   if(typeof input.username!=="string" || !/^[a-zA-Z0-9._-]{2,80}$/.test(input.username) || !["admin","user","finance","mechanic","viewer"].includes(input.role)) return respond({error:"Informe usuário e permissão válidos."},400);
   if((input.password != null && typeof input.password!=="string") || (!input.id && !input.password?.trim()) || (typeof input.password==="string" && new TextEncoder().encode(input.password).length>72)) return respond({error:"Informe a senha desejada (até 72 bytes). Ao editar, deixe em branco para manter a senha atual."},400);
   const result=await db.rpc("gia_save_user",{p_id:input.id||crypto.randomUUID(),p_username:input.username,p_password:input.password||null,p_role:input.role});
   if(result.error) throw result.error;
   return respond({ok:true});
  }
  if(action==="workspaces" && req.method==="GET") {
   if(user.role!=="admin") return respond({error:"Acesso restrito."},403);
   const owners=await db.from("gia_users").select("id,username").eq("disabled",false).order("username");
   if(owners.error) throw owners.error; return respond(owners.data);
  }
  let owner=user.id;
  if(user.role==="admin") {
   const requested=new URL(req.url).searchParams.get("owner");
   if(requested) owner=requested;
   else { const first=await db.from("gia_users").select("id").eq("disabled",false).neq("role","admin").order("username").limit(1);if(first.error)throw first.error;owner=first.data?.[0]?.id||user.id; }
   const target=await db.from("gia_users").select("id").eq("id",owner).eq("disabled",false).maybeSingle();if(target.error)throw target.error;if(!target.data)return respond({error:"Base não disponível."},403);
  }
  const workspaceId="user:"+owner;
  if(action==="data" && req.method==="GET") {
   const current=await db.from("gia_workspaces").select("*").eq("id",workspaceId).maybeSingle(); if(current.error) throw current.error;
   let data=current.data ? {...current.data.data,revision:current.data.revision} : emptyData();
   if(!current.data && user.role!=="admin") { const admin=await db.from("gia_workspaces").select("data").eq("id","admin-demo").maybeSingle(); if(admin.error) throw admin.error; data.trucks=admin.data?.data?.trucks||[]; }
   if(user.role==="admin") { const users=await db.from("gia_users").select("id,username,role").eq("disabled",false); if(users.error) throw users.error; data.users=users.data||[]; } else data.users=[];
   return respond({...parseData(data),workspaceOwner:owner});
  }
  if(action==="data" && req.method==="PUT") {
   if(user.role==="viewer") return respond({error:"Seu perfil permite apenas consulta."},403);
   if(Number(req.headers.get("content-length")||0)>8000000) return respond({error:"Base grande demais. Envie anexos pelo armazenamento."},413);
   const input=parseData(await req.json());
   const current=await db.from("gia_workspaces").select("*").eq("id",workspaceId).maybeSingle(); if(current.error) throw current.error;
   if((current.data?.revision||0)!==input.revision) return respond({error:"Outra aba salvou alterações. Recarregue a base antes de salvar."},409);
   const baseline=current.data?.data||emptyData();
   const changed=(key:string)=>JSON.stringify(input[key])!==JSON.stringify(baseline[key]);
   if(user.role==="mechanic" && ["expenses","drivers","trucks","trackingData"].some(changed)) return respond({error:"Seu perfil permite alterar apenas manutenção."},403);
   const {users,revision,...data}=input;
   const next=revision+1;
   let result;
   if(current.data) result=await db.from("gia_workspaces").update({data,revision:next,updated_at:new Date().toISOString()}).eq("id",workspaceId).eq("revision",revision).select("revision").maybeSingle();
   else result=await db.from("gia_workspaces").insert({id:workspaceId,data,revision:next}).select("revision").single();
   if(result.error?.code==="23505" || (!result.error && !result.data)) return respond({error:"Outra aba salvou alterações. Recarregue antes de salvar."},409);
   if(result.error) throw result.error;
   return respond({revision:next});
  }
  if(action==="upload" && req.method==="POST") {
   if(user.role==="viewer") return respond({error:"Seu perfil permite apenas consulta."},403);
   const form=await req.formData(); const file=form.get("file");
   const types=["image/jpeg","image/png","image/webp","application/pdf","text/csv","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
   if(!(file instanceof File) || !types.includes(file.type) || file.size>10485760 || file.size===0) return respond({error:"Envie JPG, PNG, WebP, PDF, CSV, XLSX ou DOCX de até 10 MB."},400);
   const path=owner+"/"+crypto.randomUUID()+"/"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
   const result=await db.storage.from("gia-attachments").upload(path,file,{contentType:file.type,upsert:false}); if(result.error) throw result.error;
   return respond({id:crypto.randomUUID(),name:file.name,path,mimeType:file.type,size:file.size});
  }
  if(action==="file" && req.method==="POST") {
   const {path}=await req.json();
   if(typeof path!=="string" || !path.startsWith(owner+"/") || path.includes("..")) return respond({error:"Anexo não autorizado."},403);
   const result=await db.storage.from("gia-attachments").createSignedUrl(path,300); if(result.error) throw result.error;
   return respond({url:result.data.signedUrl});
  }
  return respond({error:"Operação não disponível."},404);
 } catch(error) { console.error("gia-api",error instanceof Error?error.message:"Database error"); return respond({error:"Não foi possível concluir. Nenhum dado local foi descartado."},500); }
});

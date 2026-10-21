import { env } from 'cloudflare:workers';
export const dynamic='force-dynamic';
const subjects:Record<string,string>={reading:'阅读。重点帮助学生定位证据、拆解长难句、分析题型与同义替换。',listening:'听力。重点帮助学生练习预读、声音识别、同义替换、拼写和复盘。当前不支持音频输入，不能声称听过录音。',speaking:'口语。重点指导 Part 1/2/3 的表达结构，给出自然且适合练习的英文示例。只有文字时不能评估真实发音。',writing:'写作。重点分析 Task 1/2 审题、论证、段落结构、词汇语法；批改时区分原句、修改和理由。分数仅为非官方练习估计，不能保证考试成绩。'};
const error=(message:string,status=400)=>Response.json({error:message},{status});
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return error('请求来源无效。',403);
  if(Number(request.headers.get('content-length')||0)>9000000)return error('图片或对话过大，请减少附件。',413);
  const raw=await request.text();if(raw.length>9000000)return error('图片或对话过大，请减少附件。',413);
  let body;try{body=JSON.parse(raw)}catch{return error('请求格式有误。')}
  if(!subjects[body.subject]||!Array.isArray(body.messages)||!body.messages.length||body.messages.length>30)return error('请选择科目并输入问题，每次最多携带最近 30 条消息。');
  let total=0,images=0;
  const input=[];
  for(const msg of body.messages){
   if(!['user','assistant'].includes(msg.role)||typeof msg.text!=='string'||msg.text.length>12000)return error('消息格式不正确，单条文字最多 12000 字。');
   total+=msg.text.length;if(total>60000)return error('对话过长，请开始新对话。');
   if(msg.images!==undefined&&!Array.isArray(msg.images))return error('图片格式有误。');
   const pics=msg.role==='user'?(msg.images||[]):[];
   for(const pic of pics){if(typeof pic!=='string'||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(pic)||pic.length>2200000)return error('请上传 PNG、JPEG 或 WebP 图片。');images++}
   if(images>8)return error('当前对话携带的图片过多，请开始新对话。');
   if(msg.role==='assistant')input.push({role:'assistant',content:msg.text});
   else input.push({role:'user',content:[...(msg.text?[{type:'input_text',text:msg.text}]:[]),...pics.map((image_url:string)=>({type:'input_image',image_url,detail:'auto'}))]});
  }
  const config=env as unknown as {OPENAI_API_KEY?:string;OPENAI_MODEL?:string};
  if(!config.OPENAI_API_KEY)return error('AI 服务尚未配置，请联系网站所有者。',503);
  const upstream=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${config.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:config.OPENAI_MODEL||'gpt-4.1-mini',instructions:`你是「知序」的雅思学习伙伴，专注于${subjects[body.subject]}默认使用简体中文讲解，英文例句保留英文。耐心、具体、清晰。优先回答学生问题，按需要给步骤、例子和一个可执行练习，不要堆砌标题。信息不足时说明缺少什么，不编造题目原文、正确选项、来源、官方评分或个人经历。图片模糊时要求更清晰的截图。你是独立 AI 学习工具，不冒充原网站教师。`,input,stream:true,store:false,max_output_tokens:2500}),signal:AbortSignal.any([request.signal,AbortSignal.timeout(60000)])});
  if(!upstream.ok){let code='';try{code=(await upstream.json() as {error?:{code?:string}}).error?.code||''}catch{}
   if(['insufficient_quota','credit_balance_exhausted','billing_hard_limit_reached'].includes(code))return error('AI 账户余额或额度不足，请网站所有者在 OpenAI Platform 检查账单与额度。',503);
   if(upstream.status===401)return error('AI 密钥暂时不可用，请联系网站所有者检查配置。',503);
   if(upstream.status===429)return error('AI 请求较多，请稍后再试。',429);
   return error('AI 服务暂时不可用，请稍后重试。',502);
  }
  return new Response(upstream.body,{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','X-Content-Type-Options':'nosniff'}});
 }catch(e){if(e instanceof Error&&e.name==='AbortError')return error('已停止回答。',499);return error('连接 AI 服务失败，请稍后重试。',502)}
}

"use client";
import {useState} from "react";
import {Show,RedirectToSignIn,useClerk} from "@clerk/nextjs";
import {CalendarDays,CheckCircle2,ClipboardCheck,Clock3,FileText,FolderOpen,LayoutDashboard,MessageSquare,Users,WalletCards,Building2,ArrowUpRight,Menu,X,PlayCircle,LogOut,ExternalLink} from "lucide-react";

type Task={title:string;done:boolean;tag:string};
const logo="https://principadoproducoes.vercel.app/assets/logo-principado-exact.svg";
const nav=[["Visão geral",LayoutDashboard],["Briefing",FileText],["Cronograma",CalendarDays],["Checklist",ClipboardCheck],["Orçamento",WalletCards],["Fornecedores",Building2],["Equipe",Users],["Convidados",Users],["Roteiro",PlayCircle],["Arquivos",FolderOpen],["Comunicação",MessageSquare]] as const;
const baseTasks:Task[]=[{title:"Briefing validado com o cliente",done:true,tag:"Pré-produção"},{title:"Mapa de fornecedores confirmado",done:true,tag:"Produção"},{title:"Cronograma técnico final",done:false,tag:"Produção"},{title:"Lista de convidados revisada",done:false,tag:"Convidados"},{title:"Roteiro do evento aprovado",done:false,tag:"Cerimonial"},{title:"Plano de desmontagem",done:false,tag:"Pós-produção"}];

// The dashboard keeps the current UI responsive while real project data is progressively connected to Neon.

export default function Home(){
 const {signOut}=useClerk();
 const [active,setActive]=useState("Visão geral"); const [tasks,setTasks]=useState(baseTasks); const [mobile,setMobile]=useState(false);
 const done=tasks.filter(t=>t.done).length; const progress=Math.round(done/tasks.length*100);
 const dashboardContent = (<main className="shell">
  <aside className={mobile?"sidebar open":"sidebar"}>
   <div className="brand">
    <a className="brandLogo" href="https://principadoproducoes.vercel.app" aria-label="Principado Produções"><img src={logo} alt="Principado Produções"/></a>
    <div className="brandText"><b>PRINCIPADO</b><small>PRODUÇÕES · DASHBOARD</small></div>
    <button className="close" onClick={()=>setMobile(false)}><X size={18}/></button>
   </div>
   <div className="project"><span>PROJETO ATIVO</span><strong>Experiência de Marca</strong><small>12 OUT 2026 · RIO DE JANEIRO</small></div>
   <nav>{nav.map(([label,Icon])=><button key={label} className={active===label?"active":""} onClick={()=>{setActive(label);setMobile(false)}}><Icon size={17}/>{label}</button>)}</nav>
   <div className="sidebarBottom"><div className="client"><span>PP</span><div><b>Cliente</b><small>Projeto Corporativo</small></div></div><a className="backSite" href="https://principadoproducoes.vercel.app"><ExternalLink size={14}/> Site Principado</a><button className="logout" onClick={()=>signOut({redirectUrl:"/login"})}><LogOut size={14}/> Sair da conta</button></div>
  </aside>
  <section className="content">
   <header><button className="menu" onClick={()=>setMobile(true)}><Menu/></button><div><span className="eyebrow">CENTRAL DO CLIENTE</span><h1>{active}</h1><p>Tenha visão, controle e organização de cada etapa da produção.</p></div><button className="profile">PP</button></header>
   {active==="Visão geral"?<><div className="hero"><div><span className="eyebrow">PRÓXIMO MARCO</span><h2>Experiência de Marca</h2><p>12 de outubro de 2026 · 18:00 · Rio de Janeiro</p><div className="heroMeta"><span><Clock3 size={16}/> 15 dias para o evento</span><span><CheckCircle2 size={16}/> {progress}% concluído</span></div></div><div className="heroAction"><button onClick={()=>setActive("Cronograma")}>Ver cronograma <ArrowUpRight size={17}/></button></div></div>
   <div className="stats"><article><span>Progresso geral</span><strong>{progress}%</strong><div className="bar"><i style={{width:progress+"%"}}/></div></article><article><span>Entregas pendentes</span><strong>{tasks.length-done}</strong><small>Itens que exigem atenção</small></article><article><span>Orçamento aprovado</span><strong>R$ 84.500</strong><small>de R$ 96.000 previstos</small></article><article><span>Convidados</span><strong>186</strong><small>142 confirmações recebidas</small></article></div>
   <div className="grid"><section className="panel wide"><div className="panelHead"><div><span className="eyebrow">ACOMPANHAMENTO</span><h3>Próximas entregas</h3></div><button className="ghost">Ver tudo <ArrowUpRight size={15}/></button></div><div className="tasks">{tasks.map((task,i)=><label className="task" key={task.title}><input type="checkbox" checked={task.done} onChange={()=>setTasks(tasks.map((x,j)=>j===i?{...x,done:!x.done}:x))}/><span className="fakeCheck">{task.done?"✓":""}</span><div><b className={task.done?"done":""}>{task.title}</b><small>{task.tag}</small></div><span className="taskDate">{i<2?"Concluído":i===2?"28 set":"03 out"}</span></label>)}</div></section><section className="panel"><div className="panelHead"><div><span className="eyebrow">CRONOGRAMA</span><h3>Próximos marcos</h3></div></div><div className="timeline"><div><span>28 SET</span><b>Cronograma técnico</b><small>Revisão final</small></div><div><span>03 OUT</span><b>Ensaio geral</b><small>Equipe completa</small></div><div><span>10 OUT</span><b>Montagem</b><small>08:00 · Local</small></div><div><span>12 OUT</span><b>EVENTO</b><small>18:00 · Experiência de Marca</small></div></div></section></div></>:<section className="panel placeholder"><span className="eyebrow">MÓDULO</span><h2>{active}</h2><p>Este módulo já está previsto na estrutura do Principado Dashboard. A próxima etapa é conectar seus dados reais, permissões e colaboração com a equipe Principado.</p><div className="placeholderCards"><div><CheckCircle2/><b>Organização</b><small>Dados estruturados por projeto.</small></div><div><Users/><b>Colaboração</b><small>Cliente e produção no mesmo fluxo.</small></div><div><FolderOpen/><b>Histórico</b><small>Arquivos, decisões e entregas centralizados.</small></div></div></section>}
   <footer><span>PRINCIPADO PRODUÇÕES</span><span>Dashboard do cliente · Projeto Corporativo</span></footer>
  </section>
 </main>);
 return <>
  <Show when="signed-in">{dashboardContent}</Show>
  <Show when="signed-out"><RedirectToSignIn /></Show>
 </>;
}

"use client";
import {FormEvent,useState} from "react";
import {ArrowUpRight,Mail,LockKeyhole,ShieldCheck} from "lucide-react";

const logo="https://principadoproducoes.vercel.app/assets/logo-principado-exact.svg";

export default function LoginPage(){
 const [email,setEmail]=useState(""); const [sent,setSent]=useState(false);
 function submit(e:FormEvent){e.preventDefault(); if(email.trim()) setSent(true);}
 return <main className="loginPage">
  <div className="loginVisual"><a href="https://principadoproducoes.vercel.app" className="loginLogo"><img src={logo} alt="Principado Produções"/></a><div><span className="eyebrow">PRINCIPADO PRODUÇÕES</span><h1>Grandes experiências<br/><em>são produzidas.</em></h1><p>A área do cliente concentra briefing, cronograma, orçamento, fornecedores, arquivos e todas as etapas da produção do seu evento.</p></div><small className="loginFooter">PRODUÇÃO 360º · RIO DE JANEIRO</small></div>
  <section className="loginCard"><div className="loginCardTop"><span className="eyebrow">ÁREA DO CLIENTE</span><h2>Acesse seu projeto.</h2><p>Entre com o e-mail cadastrado pela Principado.</p></div>
   {!sent?<form onSubmit={submit}><label>E-mail profissional<div className="inputWrap"><Mail size={16}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@empresa.com" required/></div></label><button className="loginButton" type="submit">Continuar <ArrowUpRight size={17}/></button><div className="secure"><ShieldCheck size={15}/><span>Acesso privado ao seu projeto</span></div></form>:<div className="loginSent"><LockKeyhole size={28}/><h3>Vamos continuar.</h3><p>O acesso por e-mail será conectado à autenticação segura do Dashboard na próxima etapa.</p><button className="loginButton" onClick={()=>setSent(false)}>Usar outro e-mail</button></div>}
   <a className="returnSite" href="https://principadoproducoes.vercel.app">Voltar ao site Principado <ArrowUpRight size={14}/></a>
  </section>
 </main>
}
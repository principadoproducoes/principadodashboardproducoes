"use client";
import { SignIn } from "@clerk/nextjs";

const logo="https://principadoproducoes.vercel.app/assets/logo-principado-exact.svg";

export default function LoginPage(){
 return <main className="loginPage">
  <div className="loginVisual">
   <a href="https://principadoproducoes.vercel.app" className="loginLogo"><img src={logo} alt="Principado Produções"/></a>
   <div><span className="eyebrow">PRINCIPADO PRODUÇÕES</span><h1>Grandes experiências<br/><em>são produzidas.</em></h1><p>A área do cliente concentra briefing, cronograma, orçamento, fornecedores, arquivos e todas as etapas da produção do seu evento.</p></div>
   <small className="loginFooter">PRODUÇÃO 360º · RIO DE JANEIRO</small>
  </div>
  <section className="loginCard">
   <div className="loginCardTop"><span className="eyebrow">ÁREA DO CLIENTE</span><h2>Acesse seu projeto.</h2><p>Entre com os dados de acesso cadastrados pela Principado.</p></div>
   <div className="clerkSignIn">
    <SignIn routing="path" path="/login" signUpUrl="/login" appearance={{
      variables: { colorPrimary: "#ffffff", colorText: "#f5f5f5", colorTextSecondary: "#a8a8a8", colorBackground: "#0b0b0b", colorInputBackground: "#111111", colorInputText: "#ffffff", borderRadius: "10px" },
      elements: { card: "clerkCard", headerTitle: "clerkTitle", headerSubtitle: "clerkSubtitle", socialButtonsBlockButton: "clerkSocial", formButtonPrimary: "clerkPrimary", formFieldInput: "clerkInput", formFieldLabel: "clerkLabel", footerActionLink: "clerkLink", identityPreviewEditButton: "clerkLink" }
    }} />
   </div>
   <a className="returnSite" href="https://principadoproducoes.vercel.app">Voltar ao site Principado</a>
  </section>
 </main>
}
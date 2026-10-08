// Edge Function: notificar-vacaciones
// Recibe { to: string[], subject: string, text: string } y manda un correo real
// a través de Resend. La app (app.js, función _vacNotificarCorreoAdmins) llama
// a esta función cada vez que un colaborador envía una solicitud de vacaciones.
//
// Requiere un secreto RESEND_API_KEY configurado en el proyecto de Supabase
// (ver los pasos de instalación que te dio Claude en el chat). Si la función no
// está desplegada todavía, o falla, la app no se interrumpe: el buzón interno
// y el banner ya avisan de cualquier forma.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Mientras no tengas un dominio propio verificado en Resend, usa su remitente
// de pruebas (onboarding@resend.dev) — funciona, pero solo puede enviar a la
// cuenta de correo con la que te registraste en Resend. En cuanto verifiques tu
// propio dominio, cambia esto por algo como "Saporis MTTO <avisos@tudominio.com>".
const FROM_EMAIL = Deno.env.get("NOTIF_FROM_EMAIL") || "Saporis MTTO <onboarding@resend.dev>";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const { to, subject, text } = await req.json();
    if (!to || !Array.isArray(to) || to.length === 0 || !subject) {
      return new Response(JSON.stringify({ error: "Faltan campos (to, subject)" }), { status: 400 });
    }
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurada en los secretos del proyecto" }), { status: 500 });
    }
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        text: text || "",
      }),
    });
    const data = await r.json();
    return new Response(JSON.stringify(data), {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

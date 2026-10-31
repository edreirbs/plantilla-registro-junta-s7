-- =====================================================================
-- Registro a la junta de accionistas · lista de asistentes (Claude for Business, Sesión 7, Actividad 1)
-- Se corre una sola vez en el proyecto de Supabase.
-- =====================================================================

-- ---------- Asistentes ----------
create table if not exists public.asistentes (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  nombre text not null check (char_length(trim(nombre)) between 2 and 80),
  correo text not null check (char_length(correo) <= 120 and correo ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  modalidad text not null check (modalidad in ('En persona', 'En línea')),
  pregunta text check (pregunta is null or char_length(pregunta) <= 280),       -- su pregunta para el consejo
  -- Lo llena la tarea programada de Claude, nunca la página:
  estado_correo text not null default 'pendiente' check (estado_correo in ('pendiente', 'enviado', 'invalido', 'rebotado')),
  detalle_correo text,
  enviado_en timestamptz
);
create unique index if not exists asistentes_correo_unico on public.asistentes (lower(correo));

alter table public.asistentes enable row level security;
revoke all on public.asistentes from anon, authenticated;

-- El público solo puede registrarse: escribir estas cuatro columnas y nada más. No puede leer la tabla.
grant insert (nombre, correo, modalidad, pregunta) on public.asistentes to anon;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'asistentes' and policyname = 'cualquiera se registra') then
    create policy "cualquiera se registra" on public.asistentes
      for insert to anon
      with check (estado_correo = 'pendiente' and detalle_correo is null and enviado_en is null);
  end if;
end $$;

-- El contador de la página: solo el número, nunca los datos.
create or replace function public.contar_asistentes()
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from public.asistentes;
$$;
revoke execute on function public.contar_asistentes() from public;
grant execute on function public.contar_asistentes() to anon, authenticated;

-- ---------- Aviso a Claude cuando llega un registro ----------
-- Al guardar un registro, la base llama a la tarea programada de Claude por su liga de activación (API trigger).
-- Avisa como mucho una vez cada 2 minutos; la tarea atiende todos los pendientes de una vez.
create extension if not exists pg_net with schema extensions;

create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create table if not exists privado.config (
  clave text primary key,      -- 'liga_tarea' y 'token_tarea'
  valor text not null
);
create table if not exists privado.avisos (
  id int primary key default 1 check (id = 1),
  ultimo timestamptz
);

create or replace function privado.avisar_a_claude()
returns trigger language plpgsql security definer set search_path = privado, public as $$
declare liga text; tok text; ult timestamptz;
begin
  select valor into liga from privado.config where clave = 'liga_tarea';
  select valor into tok from privado.config where clave = 'token_tarea';
  if liga is null or tok is null then return null; end if;          -- todavía no se conecta la tarea
  select ultimo into ult from privado.avisos where id = 1 for update;
  if ult is not null and ult > now() - interval '2 minutes' then return null; end if;
  insert into privado.avisos (id, ultimo) values (1, now())
    on conflict (id) do update set ultimo = excluded.ultimo;
  perform net.http_post(
    url := liga,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || tok,
      'anthropic-beta', 'experimental-cc-routine-2026-04-01',
      'anthropic-version', '2023-06-01',
      'Content-Type', 'application/json'),
    body := jsonb_build_object('text', 'Hay registros nuevos en la tabla asistentes.'));
  return null;
exception when others then
  return null;                                                         -- un aviso fallido nunca impide registrarse
end $$;
revoke execute on function privado.avisar_a_claude() from public, anon, authenticated;

create or replace trigger aviso_a_claude after insert on public.asistentes
  for each statement execute function privado.avisar_a_claude();

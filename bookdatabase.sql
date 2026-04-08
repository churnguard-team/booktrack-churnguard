--
-- PostgreSQL database dump
--

\restrict e4fbEI34e6tZ693JF4MFIYdFSx6w8mgOcxMGpf5eQxtGTjCHVczaRdRihaIOToL

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-08 20:00:35

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 24609)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 3773 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- TOC entry 2 (class 3079 OID 16385)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 3774 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 936 (class 1247 OID 24738)
-- Name: action_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.action_status AS ENUM (
    'PENDING',
    'SENT',
    'OPENED',
    'CLICKED',
    'FAILED'
);


ALTER TYPE public.action_status OWNER TO postgres;

--
-- TOC entry 933 (class 1247 OID 24728)
-- Name: action_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.action_type AS ENUM (
    'EMAIL',
    'PUSH_NOTIFICATION',
    'SMS',
    'DISCOUNT_OFFER'
);


ALTER TYPE public.action_type OWNER TO postgres;

--
-- TOC entry 942 (class 1247 OID 24760)
-- Name: admin_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.admin_role AS ENUM (
    'SUPER_ADMIN',
    'ANALYST',
    'SUPPORT'
);


ALTER TYPE public.admin_role OWNER TO postgres;

--
-- TOC entry 927 (class 1247 OID 24706)
-- Name: book_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.book_status AS ENUM (
    'TO_READ',
    'READING',
    'READ',
    'ABANDONED',
    'FAVOURITE'
);


ALTER TYPE public.book_status OWNER TO postgres;

--
-- TOC entry 939 (class 1247 OID 24750)
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'RECOMMENDATION',
    'RETENTION',
    'SYSTEM',
    'PROMOTIONAL'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- TOC entry 930 (class 1247 OID 24718)
-- Name: risk_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.risk_level AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public.risk_level OWNER TO postgres;

--
-- TOC entry 924 (class 1247 OID 24696)
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.subscription_status AS ENUM (
    'ACTIVE',
    'CANCELLED',
    'EXPIRED',
    'TRIAL'
);


ALTER TYPE public.subscription_status OWNER TO postgres;

--
-- TOC entry 921 (class 1247 OID 24691)
-- Name: subscription_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.subscription_type AS ENUM (
    'FREE',
    'PREMIUM'
);


ALTER TYPE public.subscription_type OWNER TO postgres;

--
-- TOC entry 283 (class 1255 OID 25127)
-- Name: reset_latest_churn_score(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reset_latest_churn_score() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.is_latest = TRUE THEN
        UPDATE churn_scores SET is_latest = FALSE
        WHERE user_id = NEW.user_id AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.reset_latest_churn_score() OWNER TO postgres;

--
-- TOC entry 282 (class 1255 OID 25121)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 24768)
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    role public.admin_role DEFAULT 'ANALYST'::public.admin_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 24791)
-- Name: books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.books (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    auteur character varying(255),
    genre character varying(100),
    isbn character varying(20),
    cover_url text,
    nb_pages integer,
    date_publication date,
    langue character varying(50) DEFAULT 'fr'::character varying,
    external_id character varying(100),
    external_source character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.books OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 24876)
-- Name: churn_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.churn_scores (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    score numeric(5,4) NOT NULL,
    niveau_risque public.risk_level NOT NULL,
    date_calcul timestamp with time zone DEFAULT now() NOT NULL,
    model_version character varying(50),
    features_snapshot jsonb,
    is_latest boolean DEFAULT true NOT NULL,
    CONSTRAINT churn_scores_score_check CHECK (((score >= (0)::numeric) AND (score <= (1)::numeric)))
);


ALTER TABLE public.churn_scores OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 25099)
-- Name: ml_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ml_models (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    version character varying(50) NOT NULL,
    algorithme character varying(100),
    metriques jsonb,
    parametres jsonb,
    mlflow_run_id character varying(255),
    is_production boolean DEFAULT false NOT NULL,
    trained_at timestamp with time zone DEFAULT now() NOT NULL,
    deployed_at timestamp with time zone,
    created_by uuid
);


ALTER TABLE public.ml_models OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 24958)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    titre character varying(255) NOT NULL,
    contenu text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    lu_at timestamp with time zone,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 24930)
-- Name: recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recommendations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    book_id uuid NOT NULL,
    score_pertinence numeric(5,4) NOT NULL,
    algorithme character varying(100),
    model_version character varying(50),
    date_recommandation timestamp with time zone DEFAULT now() NOT NULL,
    est_acceptee boolean,
    date_feedback timestamp with time zone,
    est_affichee boolean DEFAULT false,
    date_affichage timestamp with time zone,
    CONSTRAINT recommendations_score_pertinence_check CHECK (((score_pertinence >= (0)::numeric) AND (score_pertinence <= (1)::numeric)))
);


ALTER TABLE public.recommendations OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 24902)
-- Name: retention_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.retention_actions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    churn_score_id uuid,
    type_action public.action_type NOT NULL,
    statut public.action_status DEFAULT 'PENDING'::public.action_status NOT NULL,
    contenu text,
    sujet character varying(255),
    date_envoi timestamp with time zone,
    date_ouverture timestamp with time zone,
    date_clic timestamp with time zone,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.retention_actions OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24846)
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type public.subscription_type DEFAULT 'FREE'::public.subscription_type NOT NULL,
    status public.subscription_status DEFAULT 'ACTIVE'::public.subscription_status NOT NULL,
    date_debut timestamp with time zone DEFAULT now() NOT NULL,
    date_fin timestamp with time zone,
    stripe_customer_id character varying(100),
    stripe_sub_id character varying(100),
    prix_mensuel numeric(8,2),
    devise character varying(10) DEFAULT 'MAD'::character varying,
    auto_renew boolean DEFAULT true,
    cancelled_at timestamp with time zone,
    cancel_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24812)
-- Name: user_books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_books (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    book_id uuid NOT NULL,
    statut public.book_status DEFAULT 'TO_READ'::public.book_status NOT NULL,
    note smallint,
    avis text,
    date_debut date,
    date_fin date,
    pages_lues integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_books_note_check CHECK (((note >= 1) AND (note <= 5)))
);


ALTER TABLE public.user_books OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 24983)
-- Name: user_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_events (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    event_type character varying(100) NOT NULL,
    book_id uuid,
    metadata jsonb,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL
)
PARTITION BY RANGE (occurred_at);


ALTER TABLE public.user_events OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 24982)
-- Name: user_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_events_id_seq OWNER TO postgres;

--
-- TOC entry 3775 (class 0 OID 0)
-- Dependencies: 230
-- Name: user_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_events_id_seq OWNED BY public.user_events.id;


--
-- TOC entry 232 (class 1259 OID 25002)
-- Name: user_events_2025_q1; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_events_2025_q1 (
    id bigint DEFAULT nextval('public.user_events_id_seq'::regclass) CONSTRAINT user_events_id_not_null NOT NULL,
    user_id uuid CONSTRAINT user_events_user_id_not_null NOT NULL,
    event_type character varying(100) CONSTRAINT user_events_event_type_not_null NOT NULL,
    book_id uuid,
    metadata jsonb,
    occurred_at timestamp with time zone DEFAULT now() CONSTRAINT user_events_occurred_at_not_null NOT NULL
);


ALTER TABLE public.user_events_2025_q1 OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 25019)
-- Name: user_events_2025_q2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_events_2025_q2 (
    id bigint DEFAULT nextval('public.user_events_id_seq'::regclass) CONSTRAINT user_events_id_not_null NOT NULL,
    user_id uuid CONSTRAINT user_events_user_id_not_null NOT NULL,
    event_type character varying(100) CONSTRAINT user_events_event_type_not_null NOT NULL,
    book_id uuid,
    metadata jsonb,
    occurred_at timestamp with time zone DEFAULT now() CONSTRAINT user_events_occurred_at_not_null NOT NULL
);


ALTER TABLE public.user_events_2025_q2 OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 25036)
-- Name: user_events_2025_q3; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_events_2025_q3 (
    id bigint DEFAULT nextval('public.user_events_id_seq'::regclass) CONSTRAINT user_events_id_not_null NOT NULL,
    user_id uuid CONSTRAINT user_events_user_id_not_null NOT NULL,
    event_type character varying(100) CONSTRAINT user_events_event_type_not_null NOT NULL,
    book_id uuid,
    metadata jsonb,
    occurred_at timestamp with time zone DEFAULT now() CONSTRAINT user_events_occurred_at_not_null NOT NULL
);


ALTER TABLE public.user_events_2025_q3 OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 25053)
-- Name: user_events_2025_q4; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_events_2025_q4 (
    id bigint DEFAULT nextval('public.user_events_id_seq'::regclass) CONSTRAINT user_events_id_not_null NOT NULL,
    user_id uuid CONSTRAINT user_events_user_id_not_null NOT NULL,
    event_type character varying(100) CONSTRAINT user_events_event_type_not_null NOT NULL,
    book_id uuid,
    metadata jsonb,
    occurred_at timestamp with time zone DEFAULT now() CONSTRAINT user_events_occurred_at_not_null NOT NULL
);


ALTER TABLE public.user_events_2025_q4 OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 25070)
-- Name: user_events_2026_q1; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_events_2026_q1 (
    id bigint DEFAULT nextval('public.user_events_id_seq'::regclass) CONSTRAINT user_events_id_not_null NOT NULL,
    user_id uuid CONSTRAINT user_events_user_id_not_null NOT NULL,
    event_type character varying(100) CONSTRAINT user_events_event_type_not_null NOT NULL,
    book_id uuid,
    metadata jsonb,
    occurred_at timestamp with time zone DEFAULT now() CONSTRAINT user_events_occurred_at_not_null NOT NULL
);


ALTER TABLE public.user_events_2026_q1 OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16396)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    numero_tele character varying(20),
    photo_url text,
    bio text,
    genres_preferes text[],
    objectif_annuel integer DEFAULT 12,
    oauth_provider character varying(50),
    oauth_id character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 25129)
-- Name: v_abonnes_a_risque; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_abonnes_a_risque AS
 SELECT u.id,
    u.email,
    u.nom,
    u.prenom,
    s.type AS abonnement,
    s.date_fin,
    cs.score AS churn_score,
    cs.niveau_risque,
    cs.date_calcul
   FROM ((public.users u
     JOIN public.subscriptions s ON (((s.user_id = u.id) AND (s.status = 'ACTIVE'::public.subscription_status))))
     JOIN public.churn_scores cs ON (((cs.user_id = u.id) AND (cs.is_latest = true))))
  WHERE (cs.niveau_risque = ANY (ARRAY['HIGH'::public.risk_level, 'CRITICAL'::public.risk_level]))
  ORDER BY cs.score DESC;


ALTER VIEW public.v_abonnes_a_risque OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 25134)
-- Name: v_stats_lecture; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_stats_lecture AS
 SELECT u.id AS user_id,
    u.nom,
    u.prenom,
    count(ub.id) FILTER (WHERE (ub.statut = 'READ'::public.book_status)) AS livres_lus,
    count(ub.id) FILTER (WHERE (ub.statut = 'READING'::public.book_status)) AS en_cours,
    round(avg(ub.note) FILTER (WHERE (ub.note IS NOT NULL)), 2) AS note_moyenne,
    sum(ub.pages_lues) AS total_pages
   FROM (public.users u
     LEFT JOIN public.user_books ub ON ((ub.user_id = u.id)))
  GROUP BY u.id, u.nom, u.prenom;


ALTER VIEW public.v_stats_lecture OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 25139)
-- Name: v_taux_churn; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_taux_churn AS
 SELECT date_trunc('month'::text, date_calcul) AS mois,
    count(*) FILTER (WHERE (niveau_risque = 'CRITICAL'::public.risk_level)) AS critique,
    count(*) FILTER (WHERE (niveau_risque = 'HIGH'::public.risk_level)) AS eleve,
    count(*) FILTER (WHERE (niveau_risque = 'MEDIUM'::public.risk_level)) AS moyen,
    count(*) FILTER (WHERE (niveau_risque = 'LOW'::public.risk_level)) AS faible,
    count(*) AS total
   FROM public.churn_scores cs
  WHERE (is_latest = true)
  GROUP BY (date_trunc('month'::text, date_calcul))
  ORDER BY (date_trunc('month'::text, date_calcul)) DESC;


ALTER VIEW public.v_taux_churn OWNER TO postgres;

--
-- TOC entry 3446 (class 0 OID 0)
-- Name: user_events_2025_q1; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_events ATTACH PARTITION public.user_events_2025_q1 FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2025-04-01 00:00:00+00');


--
-- TOC entry 3447 (class 0 OID 0)
-- Name: user_events_2025_q2; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_events ATTACH PARTITION public.user_events_2025_q2 FOR VALUES FROM ('2025-04-01 00:00:00+00') TO ('2025-07-01 00:00:00+00');


--
-- TOC entry 3448 (class 0 OID 0)
-- Name: user_events_2025_q3; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_events ATTACH PARTITION public.user_events_2025_q3 FOR VALUES FROM ('2025-07-01 00:00:00+00') TO ('2025-10-01 00:00:00+00');


--
-- TOC entry 3449 (class 0 OID 0)
-- Name: user_events_2025_q4; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_events ATTACH PARTITION public.user_events_2025_q4 FOR VALUES FROM ('2025-10-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');


--
-- TOC entry 3450 (class 0 OID 0)
-- Name: user_events_2026_q1; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_events ATTACH PARTITION public.user_events_2026_q1 FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');


--
-- TOC entry 3490 (class 2604 OID 24986)
-- Name: user_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_events ALTER COLUMN id SET DEFAULT nextval('public.user_events_id_seq'::regclass);


--
-- TOC entry 3753 (class 0 OID 24768)
-- Dependencies: 222
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, email, password_hash, nom, prenom, role, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3754 (class 0 OID 24791)
-- Dependencies: 223
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.books (id, title, description, auteur, genre, isbn, cover_url, nb_pages, date_publication, langue, external_id, external_source, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3757 (class 0 OID 24876)
-- Dependencies: 226
-- Data for Name: churn_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.churn_scores (id, user_id, score, niveau_risque, date_calcul, model_version, features_snapshot, is_latest) FROM stdin;
\.


--
-- TOC entry 3767 (class 0 OID 25099)
-- Dependencies: 237
-- Data for Name: ml_models; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ml_models (id, nom, version, algorithme, metriques, parametres, mlflow_run_id, is_production, trained_at, deployed_at, created_by) FROM stdin;
\.


--
-- TOC entry 3760 (class 0 OID 24958)
-- Dependencies: 229
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, titre, contenu, is_read, lu_at, metadata, created_at) FROM stdin;
\.


--
-- TOC entry 3759 (class 0 OID 24930)
-- Dependencies: 228
-- Data for Name: recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recommendations (id, user_id, book_id, score_pertinence, algorithme, model_version, date_recommandation, est_acceptee, date_feedback, est_affichee, date_affichage) FROM stdin;
\.


--
-- TOC entry 3758 (class 0 OID 24902)
-- Dependencies: 227
-- Data for Name: retention_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.retention_actions (id, user_id, churn_score_id, type_action, statut, contenu, sujet, date_envoi, date_ouverture, date_clic, metadata, created_at) FROM stdin;
\.


--
-- TOC entry 3756 (class 0 OID 24846)
-- Dependencies: 225
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, user_id, type, status, date_debut, date_fin, stripe_customer_id, stripe_sub_id, prix_mensuel, devise, auto_renew, cancelled_at, cancel_reason, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3755 (class 0 OID 24812)
-- Dependencies: 224
-- Data for Name: user_books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_books (id, user_id, book_id, statut, note, avis, date_debut, date_fin, pages_lues, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3762 (class 0 OID 25002)
-- Dependencies: 232
-- Data for Name: user_events_2025_q1; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_events_2025_q1 (id, user_id, event_type, book_id, metadata, occurred_at) FROM stdin;
\.


--
-- TOC entry 3763 (class 0 OID 25019)
-- Dependencies: 233
-- Data for Name: user_events_2025_q2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_events_2025_q2 (id, user_id, event_type, book_id, metadata, occurred_at) FROM stdin;
\.


--
-- TOC entry 3764 (class 0 OID 25036)
-- Dependencies: 234
-- Data for Name: user_events_2025_q3; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_events_2025_q3 (id, user_id, event_type, book_id, metadata, occurred_at) FROM stdin;
\.


--
-- TOC entry 3765 (class 0 OID 25053)
-- Dependencies: 235
-- Data for Name: user_events_2025_q4; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_events_2025_q4 (id, user_id, event_type, book_id, metadata, occurred_at) FROM stdin;
\.


--
-- TOC entry 3766 (class 0 OID 25070)
-- Dependencies: 236
-- Data for Name: user_events_2026_q1; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_events_2026_q1 (id, user_id, event_type, book_id, metadata, occurred_at) FROM stdin;
\.


--
-- TOC entry 3752 (class 0 OID 16396)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, nom, prenom, numero_tele, photo_url, bio, genres_preferes, objectif_annuel, oauth_provider, oauth_id, is_active, created_at, updated_at, last_login_at) FROM stdin;
\.


--
-- TOC entry 3776 (class 0 OID 0)
-- Dependencies: 230
-- Name: user_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_events_id_seq', 1, false);


--
-- TOC entry 3514 (class 2606 OID 24790)
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- TOC entry 3516 (class 2606 OID 24788)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- TOC entry 3518 (class 2606 OID 24807)
-- Name: books books_isbn_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_isbn_key UNIQUE (isbn);


--
-- TOC entry 3520 (class 2606 OID 24805)
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- TOC entry 3538 (class 2606 OID 24892)
-- Name: churn_scores churn_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.churn_scores
    ADD CONSTRAINT churn_scores_pkey PRIMARY KEY (id);


--
-- TOC entry 3573 (class 2606 OID 25113)
-- Name: ml_models ml_models_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ml_models
    ADD CONSTRAINT ml_models_pkey PRIMARY KEY (id);


--
-- TOC entry 3557 (class 2606 OID 24974)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3553 (class 2606 OID 24943)
-- Name: recommendations recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_pkey PRIMARY KEY (id);


--
-- TOC entry 3547 (class 2606 OID 24916)
-- Name: retention_actions retention_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retention_actions
    ADD CONSTRAINT retention_actions_pkey PRIMARY KEY (id);


--
-- TOC entry 3536 (class 2606 OID 24867)
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 3529 (class 2606 OID 24830)
-- Name: user_books user_books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_books
    ADD CONSTRAINT user_books_pkey PRIMARY KEY (id);


--
-- TOC entry 3531 (class 2606 OID 24832)
-- Name: user_books user_books_user_id_book_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_books
    ADD CONSTRAINT user_books_user_id_book_id_key UNIQUE (user_id, book_id);


--
-- TOC entry 3510 (class 2606 OID 16414)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3512 (class 2606 OID 16416)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3521 (class 1259 OID 24809)
-- Name: idx_books_auteur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_books_auteur ON public.books USING btree (auteur);


--
-- TOC entry 3522 (class 1259 OID 24810)
-- Name: idx_books_genre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_books_genre ON public.books USING btree (genre);


--
-- TOC entry 3523 (class 1259 OID 24811)
-- Name: idx_books_isbn; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_books_isbn ON public.books USING btree (isbn);


--
-- TOC entry 3524 (class 1259 OID 24808)
-- Name: idx_books_title_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_books_title_trgm ON public.books USING gin (title public.gin_trgm_ops);


--
-- TOC entry 3539 (class 1259 OID 24901)
-- Name: idx_churn_scores_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_churn_scores_date ON public.churn_scores USING btree (date_calcul DESC);


--
-- TOC entry 3540 (class 1259 OID 24899)
-- Name: idx_churn_scores_latest; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_churn_scores_latest ON public.churn_scores USING btree (user_id, is_latest);


--
-- TOC entry 3541 (class 1259 OID 24900)
-- Name: idx_churn_scores_risque; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_churn_scores_risque ON public.churn_scores USING btree (niveau_risque);


--
-- TOC entry 3542 (class 1259 OID 24898)
-- Name: idx_churn_scores_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_churn_scores_user ON public.churn_scores USING btree (user_id);


--
-- TOC entry 3558 (class 1259 OID 25093)
-- Name: idx_events_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_type ON ONLY public.user_events USING btree (event_type);


--
-- TOC entry 3559 (class 1259 OID 25087)
-- Name: idx_events_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_user ON ONLY public.user_events USING btree (user_id, occurred_at DESC);


--
-- TOC entry 3570 (class 1259 OID 25119)
-- Name: idx_ml_models_nom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ml_models_nom ON public.ml_models USING btree (nom);


--
-- TOC entry 3571 (class 1259 OID 25120)
-- Name: idx_ml_models_production; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ml_models_production ON public.ml_models USING btree (nom, is_production);


--
-- TOC entry 3554 (class 1259 OID 24981)
-- Name: idx_notifs_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifs_is_read ON public.notifications USING btree (user_id, is_read);


--
-- TOC entry 3555 (class 1259 OID 24980)
-- Name: idx_notifs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifs_user ON public.notifications USING btree (user_id);


--
-- TOC entry 3548 (class 1259 OID 24955)
-- Name: idx_reco_book; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reco_book ON public.recommendations USING btree (book_id);


--
-- TOC entry 3549 (class 1259 OID 24957)
-- Name: idx_reco_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reco_date ON public.recommendations USING btree (date_recommandation DESC);


--
-- TOC entry 3550 (class 1259 OID 24956)
-- Name: idx_reco_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reco_score ON public.recommendations USING btree (score_pertinence DESC);


--
-- TOC entry 3551 (class 1259 OID 24954)
-- Name: idx_reco_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reco_user ON public.recommendations USING btree (user_id);


--
-- TOC entry 3543 (class 1259 OID 24928)
-- Name: idx_retention_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_retention_statut ON public.retention_actions USING btree (statut);


--
-- TOC entry 3544 (class 1259 OID 24929)
-- Name: idx_retention_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_retention_type ON public.retention_actions USING btree (type_action);


--
-- TOC entry 3545 (class 1259 OID 24927)
-- Name: idx_retention_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_retention_user ON public.retention_actions USING btree (user_id);


--
-- TOC entry 3532 (class 1259 OID 24874)
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- TOC entry 3533 (class 1259 OID 24875)
-- Name: idx_subscriptions_stripe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_stripe ON public.subscriptions USING btree (stripe_sub_id);


--
-- TOC entry 3534 (class 1259 OID 24873)
-- Name: idx_subscriptions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_user ON public.subscriptions USING btree (user_id);


--
-- TOC entry 3525 (class 1259 OID 24844)
-- Name: idx_user_books_book; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_books_book ON public.user_books USING btree (book_id);


--
-- TOC entry 3526 (class 1259 OID 24845)
-- Name: idx_user_books_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_books_statut ON public.user_books USING btree (statut);


--
-- TOC entry 3527 (class 1259 OID 24843)
-- Name: idx_user_books_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_books_user ON public.user_books USING btree (user_id);


--
-- TOC entry 3508 (class 1259 OID 24767)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 3560 (class 1259 OID 25094)
-- Name: user_events_2025_q1_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q1_event_type_idx ON public.user_events_2025_q1 USING btree (event_type);


--
-- TOC entry 3561 (class 1259 OID 25088)
-- Name: user_events_2025_q1_user_id_occurred_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q1_user_id_occurred_at_idx ON public.user_events_2025_q1 USING btree (user_id, occurred_at DESC);


--
-- TOC entry 3562 (class 1259 OID 25095)
-- Name: user_events_2025_q2_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q2_event_type_idx ON public.user_events_2025_q2 USING btree (event_type);


--
-- TOC entry 3563 (class 1259 OID 25089)
-- Name: user_events_2025_q2_user_id_occurred_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q2_user_id_occurred_at_idx ON public.user_events_2025_q2 USING btree (user_id, occurred_at DESC);


--
-- TOC entry 3564 (class 1259 OID 25096)
-- Name: user_events_2025_q3_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q3_event_type_idx ON public.user_events_2025_q3 USING btree (event_type);


--
-- TOC entry 3565 (class 1259 OID 25090)
-- Name: user_events_2025_q3_user_id_occurred_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q3_user_id_occurred_at_idx ON public.user_events_2025_q3 USING btree (user_id, occurred_at DESC);


--
-- TOC entry 3566 (class 1259 OID 25097)
-- Name: user_events_2025_q4_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q4_event_type_idx ON public.user_events_2025_q4 USING btree (event_type);


--
-- TOC entry 3567 (class 1259 OID 25091)
-- Name: user_events_2025_q4_user_id_occurred_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q4_user_id_occurred_at_idx ON public.user_events_2025_q4 USING btree (user_id, occurred_at DESC);


--
-- TOC entry 3568 (class 1259 OID 25098)
-- Name: user_events_2026_q1_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2026_q1_event_type_idx ON public.user_events_2026_q1 USING btree (event_type);


--
-- TOC entry 3569 (class 1259 OID 25092)
-- Name: user_events_2026_q1_user_id_occurred_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2026_q1_user_id_occurred_at_idx ON public.user_events_2026_q1 USING btree (user_id, occurred_at DESC);


--
-- TOC entry 3574 (class 0 OID 0)
-- Name: user_events_2025_q1_event_type_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_type ATTACH PARTITION public.user_events_2025_q1_event_type_idx;


--
-- TOC entry 3575 (class 0 OID 0)
-- Name: user_events_2025_q1_user_id_occurred_at_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_user ATTACH PARTITION public.user_events_2025_q1_user_id_occurred_at_idx;


--
-- TOC entry 3576 (class 0 OID 0)
-- Name: user_events_2025_q2_event_type_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_type ATTACH PARTITION public.user_events_2025_q2_event_type_idx;


--
-- TOC entry 3577 (class 0 OID 0)
-- Name: user_events_2025_q2_user_id_occurred_at_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_user ATTACH PARTITION public.user_events_2025_q2_user_id_occurred_at_idx;


--
-- TOC entry 3578 (class 0 OID 0)
-- Name: user_events_2025_q3_event_type_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_type ATTACH PARTITION public.user_events_2025_q3_event_type_idx;


--
-- TOC entry 3579 (class 0 OID 0)
-- Name: user_events_2025_q3_user_id_occurred_at_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_user ATTACH PARTITION public.user_events_2025_q3_user_id_occurred_at_idx;


--
-- TOC entry 3580 (class 0 OID 0)
-- Name: user_events_2025_q4_event_type_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_type ATTACH PARTITION public.user_events_2025_q4_event_type_idx;


--
-- TOC entry 3581 (class 0 OID 0)
-- Name: user_events_2025_q4_user_id_occurred_at_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_user ATTACH PARTITION public.user_events_2025_q4_user_id_occurred_at_idx;


--
-- TOC entry 3582 (class 0 OID 0)
-- Name: user_events_2026_q1_event_type_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_type ATTACH PARTITION public.user_events_2026_q1_event_type_idx;


--
-- TOC entry 3583 (class 0 OID 0)
-- Name: user_events_2026_q1_user_id_occurred_at_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_user ATTACH PARTITION public.user_events_2026_q1_user_id_occurred_at_idx;


--
-- TOC entry 3597 (class 2620 OID 25126)
-- Name: admins trg_admins_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3598 (class 2620 OID 25123)
-- Name: books trg_books_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3601 (class 2620 OID 25128)
-- Name: churn_scores trg_churn_score_latest; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_churn_score_latest AFTER INSERT OR UPDATE ON public.churn_scores FOR EACH ROW EXECUTE FUNCTION public.reset_latest_churn_score();


--
-- TOC entry 3600 (class 2620 OID 25125)
-- Name: subscriptions trg_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3599 (class 2620 OID 25124)
-- Name: user_books trg_user_books_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_user_books_updated_at BEFORE UPDATE ON public.user_books FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3596 (class 2620 OID 25122)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3587 (class 2606 OID 24893)
-- Name: churn_scores churn_scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.churn_scores
    ADD CONSTRAINT churn_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3595 (class 2606 OID 25114)
-- Name: ml_models ml_models_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ml_models
    ADD CONSTRAINT ml_models_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(id);


--
-- TOC entry 3592 (class 2606 OID 24975)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3590 (class 2606 OID 24949)
-- Name: recommendations recommendations_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 3591 (class 2606 OID 24944)
-- Name: recommendations recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3588 (class 2606 OID 24922)
-- Name: retention_actions retention_actions_churn_score_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retention_actions
    ADD CONSTRAINT retention_actions_churn_score_id_fkey FOREIGN KEY (churn_score_id) REFERENCES public.churn_scores(id);


--
-- TOC entry 3589 (class 2606 OID 24917)
-- Name: retention_actions retention_actions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retention_actions
    ADD CONSTRAINT retention_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3586 (class 2606 OID 24868)
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3584 (class 2606 OID 24838)
-- Name: user_books user_books_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_books
    ADD CONSTRAINT user_books_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 3585 (class 2606 OID 24833)
-- Name: user_books user_books_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_books
    ADD CONSTRAINT user_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3593 (class 2606 OID 24997)
-- Name: user_events user_events_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.user_events
    ADD CONSTRAINT user_events_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- TOC entry 3594 (class 2606 OID 24992)
-- Name: user_events user_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.user_events
    ADD CONSTRAINT user_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-04-08 20:00:35

--
-- PostgreSQL database dump complete
--

\unrestrict e4fbEI34e6tZ693JF4MFIYdFSx6w8mgOcxMGpf5eQxtGTjCHVczaRdRihaIOToL


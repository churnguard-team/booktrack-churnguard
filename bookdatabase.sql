--
-- PostgreSQL database dump
--

\restrict YjkPLzQGLKOSjOIW9e7nOd6CMwKN3eD9H8g8nz8tRUIw64ugktROFsWCW7ZoTbT

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-26 11:24:32

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
-- TOC entry 2 (class 3079 OID 16385)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 3785 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- TOC entry 3 (class 3079 OID 16466)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 3786 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 919 (class 1247 OID 16478)
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
-- TOC entry 922 (class 1247 OID 16490)
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
-- TOC entry 925 (class 1247 OID 16500)
-- Name: admin_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.admin_role AS ENUM (
    'SUPER_ADMIN',
    'ANALYST',
    'SUPPORT'
);


ALTER TYPE public.admin_role OWNER TO postgres;

--
-- TOC entry 928 (class 1247 OID 16508)
-- Name: book_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.book_status AS ENUM (
    'TO_READ',
    'READING',
    'READ',
    'ABANDONED'
);


ALTER TYPE public.book_status OWNER TO postgres;

--
-- TOC entry 931 (class 1247 OID 16518)
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
-- TOC entry 934 (class 1247 OID 16528)
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
-- TOC entry 937 (class 1247 OID 16538)
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
-- TOC entry 940 (class 1247 OID 16548)
-- Name: subscription_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.subscription_type AS ENUM (
    'FREE',
    'PREMIUM'
);


ALTER TYPE public.subscription_type OWNER TO postgres;

--
-- TOC entry 283 (class 1255 OID 16553)
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
-- TOC entry 284 (class 1255 OID 16554)
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
-- TOC entry 221 (class 1259 OID 16555)
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
-- TOC entry 241 (class 1259 OID 16956)
-- Name: book_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.book_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    book_id uuid NOT NULL,
    user_id uuid NOT NULL,
    contenu text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.book_comments OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16574)
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
-- TOC entry 223 (class 1259 OID 16587)
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
-- TOC entry 224 (class 1259 OID 16602)
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
-- TOC entry 225 (class 1259 OID 16615)
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
-- TOC entry 226 (class 1259 OID 16630)
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
-- TOC entry 227 (class 1259 OID 16642)
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
-- TOC entry 228 (class 1259 OID 16655)
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
-- TOC entry 229 (class 1259 OID 16675)
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
    is_favourite boolean DEFAULT false,
    pages_lues integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_books_note_check CHECK (((note >= 1) AND (note <= 5)))
);


ALTER TABLE public.user_books OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16693)
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
-- TOC entry 231 (class 1259 OID 16701)
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
-- TOC entry 3787 (class 0 OID 0)
-- Dependencies: 231
-- Name: user_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_events_id_seq OWNED BY public.user_events.id;


--
-- TOC entry 232 (class 1259 OID 16702)
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
-- TOC entry 233 (class 1259 OID 16713)
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
-- TOC entry 234 (class 1259 OID 16724)
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
-- TOC entry 235 (class 1259 OID 16735)
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
-- TOC entry 236 (class 1259 OID 16746)
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
-- TOC entry 237 (class 1259 OID 16757)
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
-- TOC entry 238 (class 1259 OID 16774)
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
-- TOC entry 239 (class 1259 OID 16779)
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
-- TOC entry 240 (class 1259 OID 16784)
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
-- TOC entry 3450 (class 0 OID 0)
-- Name: user_events_2025_q1; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_events ATTACH PARTITION public.user_events_2025_q1 FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2025-04-01 00:00:00+00');


--
-- TOC entry 3451 (class 0 OID 0)
-- Name: user_events_2025_q2; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_events ATTACH PARTITION public.user_events_2025_q2 FOR VALUES FROM ('2025-04-01 00:00:00+00') TO ('2025-07-01 00:00:00+00');


--
-- TOC entry 3452 (class 0 OID 0)
-- Name: user_events_2025_q3; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_events ATTACH PARTITION public.user_events_2025_q3 FOR VALUES FROM ('2025-07-01 00:00:00+00') TO ('2025-10-01 00:00:00+00');


--
-- TOC entry 3453 (class 0 OID 0)
-- Name: user_events_2025_q4; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_events ATTACH PARTITION public.user_events_2025_q4 FOR VALUES FROM ('2025-10-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');


--
-- TOC entry 3454 (class 0 OID 0)
-- Name: user_events_2026_q1; Type: TABLE ATTACH; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_events ATTACH PARTITION public.user_events_2026_q1 FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');


--
-- TOC entry 3493 (class 2604 OID 16788)
-- Name: user_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_events ALTER COLUMN id SET DEFAULT nextval('public.user_events_id_seq'::regclass);


--
-- TOC entry 3763 (class 0 OID 16555)
-- Dependencies: 221
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, email, password_hash, nom, prenom, role, is_active, created_at, updated_at) FROM stdin;
47042924-0458-4872-ad3f-90c03ebf2ed9	admin@booktrack.local	admin123	Admin	Admin	SUPER_ADMIN	t	2026-04-26 10:12:04.861623+00	2026-04-26 10:12:04.861623+00
\.


--
-- TOC entry 3779 (class 0 OID 16956)
-- Dependencies: 241
-- Data for Name: book_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.book_comments (id, book_id, user_id, contenu, created_at) FROM stdin;
\.


--
-- TOC entry 3764 (class 0 OID 16574)
-- Dependencies: 222
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.books (id, title, description, auteur, genre, isbn, cover_url, nb_pages, date_publication, langue, external_id, external_source, created_at, updated_at) FROM stdin;
f2d4d94f-b688-4218-ab7e-4d8cb903bf8a	Les Ombres de Verre	Un mystere urbain autour dun manuscrit disparu.	Camille Durand	Thriller	9780000000001	https://picsum.photos/seed/book-001/400/600	368	2019-03-14	fr	seed-001	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
7ee70f51-e7c6-49cd-b782-c2c875711589	La Carte des Saisons	Chronique familiale a travers quatre epoques.	Nicolas Martin	Roman	9780000000002	https://picsum.photos/seed/book-002/400/600	412	2016-09-08	fr	seed-002	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
732b6b9e-4c52-4703-8b5b-2077c7d7e479	Orbitale 7	Une expedition scientifique tourne a lenigme.	Elena Carter	Science-Fiction	9780000000003	https://picsum.photos/seed/book-003/400/600	296	2021-05-21	en	seed-003	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
7addf711-fe13-444b-9f99-0057ffb794ce	Le Quai des Secrets	Une enquete au bord de mer entre deux disparitions.	Hugo Lemaire	Polar	9780000000004	https://picsum.photos/seed/book-004/400/600	334	2018-11-02	fr	seed-004	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
65fff8d2-50b6-4083-a573-a7079f64b24a	La Bibliotheque des Vents	Un village isole et une salle interdite.	Sarah Nguyen	Fantastique	9780000000005	https://picsum.photos/seed/book-005/400/600	284	2020-10-10	fr	seed-005	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
4030c9c3-7288-4200-94a8-b404caea387b	Itineraire Boreal	Carnet de voyage sur les routes du nord.	Lina Moreau	Voyage	9780000000006	https://picsum.photos/seed/book-006/400/600	240	2017-06-18	fr	seed-006	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
cf209f17-c27b-483e-b238-c7da52808846	Ethique en Clair	Introduire les grands dilemmes du quotidien.	Marc Delcourt	Philosophie	9780000000007	https://picsum.photos/seed/book-007/400/600	198	2015-01-12	fr	seed-007	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
c249b1a4-0073-457e-97fc-c98de9dcc085	Memoires dune Ombre	Portrait intime dun destin hors norme.	Julia Stein	Biographie	9780000000008	https://picsum.photos/seed/book-008/400/600	456	2014-04-03	fr	seed-008	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
7745a741-00eb-45be-9ce9-ba8eb3c912ae	Chroniques dArgile	Recit historique au coeur dune cite antique.	Yasmine Benali	Histoire	9780000000009	https://picsum.photos/seed/book-009/400/600	390	2013-09-30	fr	seed-009	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
869d4e32-9007-4e2a-a511-75418f511886	Coeur a Contretemps	Deux vies se croisent au mauvais moment.	Ana Ribeiro	Romance	9780000000010	https://picsum.photos/seed/book-010/400/600	320	2022-02-14	fr	seed-010	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
8cd33fa4-1406-4398-894c-06de19cc0a16	Le Signal du Large	Un message radio venu de nulle part.	Thomas Keller	Thriller	9780000000011	https://picsum.photos/seed/book-011/400/600	352	2020-01-19	fr	seed-011	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
c7703687-edb9-4267-a927-ba4280c3268c	LArchive des Jours	Un roman sur la memoire et les choix.	Camille Durand	Roman	9780000000012	https://picsum.photos/seed/book-012/400/600	438	2012-05-07	fr	seed-012	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
1cd1d31e-63a7-460b-99c5-79b1727f3c3d	Neo-Lyon	Cyber-polar dans une metropole hyperconnectee.	Elena Carter	Science-Fiction	9780000000013	https://picsum.photos/seed/book-013/400/600	310	2023-07-01	en	seed-013	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
e03ca950-09cf-44e6-b886-74d91081db16	Le Dossier Harfang	Une affaire classee reouverte apres dix ans.	Hugo Lemaire	Polar	9780000000014	https://picsum.photos/seed/book-014/400/600	376	2019-12-05	fr	seed-014	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
65b83bcb-ef9b-4195-81bd-cfe05510d00d	Les Portes du Sommeil	Quand les reves deviennent des lieux.	Sarah Nguyen	Fantastique	9780000000015	https://picsum.photos/seed/book-015/400/600	272	2016-03-23	fr	seed-015	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
d4088be1-96d7-47bf-95af-fb91dff0adda	Escales et Silences	Petites histoires glanees en chemin.	Lina Moreau	Voyage	9780000000016	https://picsum.photos/seed/book-016/400/600	216	2011-08-16	fr	seed-016	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
de21af8f-e017-4263-b1f1-42f24036c584	Penser le Travail	Reflexions sur le sens et la valeur.	Marc Delcourt	Philosophie	9780000000017	https://picsum.photos/seed/book-017/400/600	224	2020-09-09	fr	seed-017	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
f644c59a-553f-4624-8245-ec3559a8d748	Une Vie en Notes	Le parcours dune artiste inconnue du grand public.	Julia Stein	Biographie	9780000000018	https://picsum.photos/seed/book-018/400/600	408	2018-02-28	fr	seed-018	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
ade1bcee-930e-4431-bcf6-5c21ae1add21	Les Annees du Fleuve	Saga historique le long dun grand cours deau.	Yasmine Benali	Histoire	9780000000019	https://picsum.photos/seed/book-019/400/600	512	2010-10-20	fr	seed-019	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
52581119-7e85-43b0-9db0-93e658d1cc04	Distance Minime	Romance douce-amere et lettres non envoyees.	Ana Ribeiro	Romance	9780000000020	https://picsum.photos/seed/book-020/400/600	288	2017-02-11	fr	seed-020	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
05a3c91c-d9f0-4b95-b1ff-32a96c792e60	Les Taches de Lumiere	Un photographe decouvre un motif inquietant.	Nicolas Martin	Thriller	9780000000021	https://picsum.photos/seed/book-021/400/600	344	2015-11-17	fr	seed-021	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
b2d20571-3c52-4ea1-8c0a-7cb8b01649b1	Le Jardin des Heures	Un roman sur la transmission et les secrets.	Camille Durand	Roman	9780000000022	https://picsum.photos/seed/book-022/400/600	396	2021-04-12	fr	seed-022	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
93108596-cc65-4147-9ac9-0de8a6c0d04d	Station Aurore	Une colonie lointaine et un hiver sans fin.	Elena Carter	Science-Fiction	9780000000023	https://picsum.photos/seed/book-023/400/600	332	2018-06-06	en	seed-023	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
1f02c589-7c12-4dc2-afdf-baddb2714ef7	La Rue des Corbeaux	Un inspecteur suit une piste trop personnelle.	Hugo Lemaire	Polar	9780000000024	https://picsum.photos/seed/book-024/400/600	368	2014-09-01	fr	seed-024	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
67fa4cf2-fbe5-4882-98ad-eaab30c43e4b	Le Pacte des Brumes	Une foret vivante garde ses propres lois.	Sarah Nguyen	Fantastique	9780000000025	https://picsum.photos/seed/book-025/400/600	301	2022-10-03	fr	seed-025	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
fed8d371-7f80-4ddf-8b4b-9698899c641f	Carnet des Deux Rives	Voyager pour comprendre ce qui manque.	Lina Moreau	Voyage	9780000000026	https://picsum.photos/seed/book-026/400/600	260	2019-05-25	fr	seed-026	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
d2d8fb19-ec0c-4b4b-a7f7-e6b480a8cf88	La Joie de Douter	Apprendre a questionner sans se perdre.	Marc Delcourt	Philosophie	9780000000027	https://picsum.photos/seed/book-027/400/600	176	2013-03-03	fr	seed-027	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
b0bf3ffe-ac8e-4f95-bfb5-61d9453a15b7	Portrait dune Saisonnier	Recit biographique dune vie de labeur.	Julia Stein	Biographie	9780000000028	https://picsum.photos/seed/book-028/400/600	372	2016-12-12	fr	seed-028	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
0cdedd1e-10b9-4ba8-8674-ddfa837e6d23	Cites et Couronnes	Histoire dune dynastie oubliee.	Yasmine Benali	Histoire	9780000000029	https://picsum.photos/seed/book-029/400/600	448	2012-02-02	fr	seed-029	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
612b83b4-dc24-4960-890e-ae5770b05744	Nos Deux Horizons	Rencontre inattendue et choix difficiles.	Ana Ribeiro	Romance	9780000000030	https://picsum.photos/seed/book-030/400/600	336	2020-02-29	fr	seed-030	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
b7de4e0a-6b96-4c5d-b9e0-9f1131bb6aaf	Algorithmes Simples	Bases pratiques pour mieux coder au quotidien.	Pierre Lambert	Développement	9780000000031	https://picsum.photos/seed/book-031/400/600	290	2021-09-15	fr	seed-031	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
8e0b9a77-d923-491d-8b3e-9cc0a9861b63	Architecture Web Moderne	Construire des applis robustes et evolutives.	Claire Petit	Développement	9780000000032	https://picsum.photos/seed/book-032/400/600	420	2022-05-05	fr	seed-032	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
798cb706-40c8-4c04-b36e-1ac3829fb13d	Le Dernier Indice	Une course contre la montre entre deux villes.	Thomas Keller	Thriller	9780000000033	https://picsum.photos/seed/book-033/400/600	328	2017-11-11	fr	seed-033	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
0a75b504-9805-4501-8b69-1211e35a9e64	La Chambre 204	Un roman intimiste sur le hasard.	Nicolas Martin	Roman	9780000000034	https://picsum.photos/seed/book-034/400/600	305	2011-01-20	fr	seed-034	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
44cc1d89-5abe-4d08-a070-b98cfb3c3b75	Les Pionniers de Mars	Mission de survie et decouvertes etranges.	Elena Carter	Science-Fiction	9780000000035	https://picsum.photos/seed/book-035/400/600	360	2015-07-07	en	seed-035	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
1d470d08-43dc-44ee-8c7a-ae6209728929	Le Code du Renard	Enquete et fausses pistes dans les archives.	Hugo Lemaire	Polar	9780000000036	https://picsum.photos/seed/book-036/400/600	392	2023-03-13	fr	seed-036	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
ef272f50-a60f-4136-adb3-32ca45676197	La Tour des Signes	Un grimoire ouvre des portes dangereuses.	Sarah Nguyen	Fantastique	9780000000037	https://picsum.photos/seed/book-037/400/600	278	2019-10-31	fr	seed-037	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
b5c0ee3a-327a-40cb-bbaf-d7f9f6292f0d	Au Bout des Routes	Recit de voyage en trains et detours.	Lina Moreau	Voyage	9780000000038	https://picsum.photos/seed/book-038/400/600	230	2014-06-01	fr	seed-038	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
0cf354fd-3135-46dc-9085-dd767dc532b5	Le Sens du Vrai	Reperes philosophiques sur la verite.	Marc Delcourt	Philosophie	9780000000039	https://picsum.photos/seed/book-039/400/600	208	2018-08-08	fr	seed-039	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
b05af3b8-11d1-4881-9ba0-0905c5e21928	Une Histoire de Courage	Biographie dune personne ordinaire devenue essentielle.	Julia Stein	Biographie	9780000000040	https://picsum.photos/seed/book-040/400/600	410	2020-12-01	fr	seed-040	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
7450c110-34d4-436b-8c38-a043dd80a779	Chroniques du Royaume	Une fresque historique en cinq actes.	Yasmine Benali	Histoire	9780000000041	https://picsum.photos/seed/book-041/400/600	530	2009-04-04	fr	seed-041	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
c4d3fa1b-1a98-4423-9795-c8f49626c13d	Planche et Encre	Recueil illustre au ton leger et tendre.	Kenji Sato	BD / Manga	9780000000042	https://picsum.photos/seed/book-042/400/600	192	2021-03-03	fr	seed-042	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
25915324-78de-46d6-9f56-e510482a7613	Nuit de Velours	Romance moderne et dialogues cinglants.	Ana Ribeiro	Romance	9780000000043	https://picsum.photos/seed/book-043/400/600	312	2021-02-14	fr	seed-043	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
23c3f739-801f-450b-9479-45e96f954154	Le Revers du Miroir	Thriller psychologique en huis clos.	Thomas Keller	Thriller	9780000000044	https://picsum.photos/seed/book-044/400/600	340	2016-10-20	fr	seed-044	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
5ade6128-6d8c-4d6b-83f6-0abb5ba666de	Les Lignes du Temps	Roman sur les occasions manquees et reprises.	Camille Durand	Roman	9780000000045	https://picsum.photos/seed/book-045/400/600	402	2018-01-01	fr	seed-045	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
fbbbbd8d-0bb5-4b3d-903f-d49c8cfd30cd	Vecteur Zero	Science-fiction dure et exploration orbitale.	Elena Carter	Science-Fiction	9780000000046	https://picsum.photos/seed/book-046/400/600	298	2020-07-17	en	seed-046	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
ff427574-a640-422e-8abd-17fb11d48385	Le Passage du Nord	Polar atmospherique dans une ville portuaire.	Hugo Lemaire	Polar	9780000000047	https://picsum.photos/seed/book-047/400/600	374	2012-11-15	fr	seed-047	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
9909c481-e9c1-4ce0-b304-03fb12222054	Le Cercle des Lueurs	Fantastique doux avec une menace diffuse.	Sarah Nguyen	Fantastique	9780000000048	https://picsum.photos/seed/book-048/400/600	265	2017-09-09	fr	seed-048	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
5e61a18c-bd15-4ae9-aad8-f257b98feccf	Routes Interieures	Voyage et introspection au fil des paysages.	Lina Moreau	Voyage	9780000000049	https://picsum.photos/seed/book-049/400/600	248	2013-05-18	fr	seed-049	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
0914a67a-9c5c-4e12-a53a-2966fac659bc	Pratique de la Priorisation	Methodes concretes pour mieux organiser son temps.	Pierre Lambert	Développement	9780000000050	https://picsum.photos/seed/book-050/400/600	260	2024-01-10	fr	seed-050	seed	2026-04-26 10:07:00.450147+00	2026-04-26 10:08:31.347257+00
\.


--
-- TOC entry 3765 (class 0 OID 16587)
-- Dependencies: 223
-- Data for Name: churn_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.churn_scores (id, user_id, score, niveau_risque, date_calcul, model_version, features_snapshot, is_latest) FROM stdin;
\.


--
-- TOC entry 3766 (class 0 OID 16602)
-- Dependencies: 224
-- Data for Name: ml_models; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ml_models (id, nom, version, algorithme, metriques, parametres, mlflow_run_id, is_production, trained_at, deployed_at, created_by) FROM stdin;
\.


--
-- TOC entry 3767 (class 0 OID 16615)
-- Dependencies: 225
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, titre, contenu, is_read, lu_at, metadata, created_at) FROM stdin;
\.


--
-- TOC entry 3768 (class 0 OID 16630)
-- Dependencies: 226
-- Data for Name: recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recommendations (id, user_id, book_id, score_pertinence, algorithme, model_version, date_recommandation, est_acceptee, date_feedback, est_affichee, date_affichage) FROM stdin;
\.


--
-- TOC entry 3769 (class 0 OID 16642)
-- Dependencies: 227
-- Data for Name: retention_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.retention_actions (id, user_id, churn_score_id, type_action, statut, contenu, sujet, date_envoi, date_ouverture, date_clic, metadata, created_at) FROM stdin;
\.


--
-- TOC entry 3770 (class 0 OID 16655)
-- Dependencies: 228
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, user_id, type, status, date_debut, date_fin, stripe_customer_id, stripe_sub_id, prix_mensuel, devise, auto_renew, cancelled_at, cancel_reason, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3771 (class 0 OID 16675)
-- Dependencies: 229
-- Data for Name: user_books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_books (id, user_id, book_id, statut, note, avis, date_debut, date_fin, is_favourite, pages_lues, created_at, updated_at) FROM stdin;
c6c3a6da-6a0d-4cb6-a597-4bcdfb3097f9	51e451e3-2f58-400b-8ba1-2b0038f81f46	f2d4d94f-b688-4218-ab7e-4d8cb903bf8a	TO_READ	\N	\N	\N	\N	t	0	2026-04-26 10:08:54.817122+00	2026-04-26 10:08:58.442089+00
\.


--
-- TOC entry 3773 (class 0 OID 16702)
-- Dependencies: 232
-- Data for Name: user_events_2025_q1; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_events_2025_q1 (id, user_id, event_type, book_id, metadata, occurred_at) FROM stdin;
\.


--
-- TOC entry 3774 (class 0 OID 16713)
-- Dependencies: 233
-- Data for Name: user_events_2025_q2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_events_2025_q2 (id, user_id, event_type, book_id, metadata, occurred_at) FROM stdin;
\.


--
-- TOC entry 3775 (class 0 OID 16724)
-- Dependencies: 234
-- Data for Name: user_events_2025_q3; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_events_2025_q3 (id, user_id, event_type, book_id, metadata, occurred_at) FROM stdin;
\.


--
-- TOC entry 3776 (class 0 OID 16735)
-- Dependencies: 235
-- Data for Name: user_events_2025_q4; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_events_2025_q4 (id, user_id, event_type, book_id, metadata, occurred_at) FROM stdin;
\.


--
-- TOC entry 3777 (class 0 OID 16746)
-- Dependencies: 236
-- Data for Name: user_events_2026_q1; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_events_2026_q1 (id, user_id, event_type, book_id, metadata, occurred_at) FROM stdin;
\.


--
-- TOC entry 3778 (class 0 OID 16757)
-- Dependencies: 237
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, nom, prenom, numero_tele, photo_url, bio, genres_preferes, objectif_annuel, oauth_provider, oauth_id, is_active, created_at, updated_at, last_login_at) FROM stdin;
51e451e3-2f58-400b-8ba1-2b0038f81f46	m.aitelhachmi7790@uca.ac.ma	Lhsm8702	EL HACHMI	Mouad	\N	\N	\N	{Roman,Science-Fiction,Thriller,Histoire,Philosophie}	12	\N	\N	t	2026-04-26 10:01:25.796416+00	2026-04-26 10:01:47.111888+00	\N
\.


--
-- TOC entry 3788 (class 0 OID 0)
-- Dependencies: 231
-- Name: user_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_events_id_seq', 1, false);


--
-- TOC entry 3516 (class 2606 OID 16790)
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- TOC entry 3518 (class 2606 OID 16792)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- TOC entry 3582 (class 2606 OID 16969)
-- Name: book_comments book_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_comments
    ADD CONSTRAINT book_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 3520 (class 2606 OID 16794)
-- Name: books books_isbn_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_isbn_key UNIQUE (isbn);


--
-- TOC entry 3522 (class 2606 OID 16796)
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- TOC entry 3528 (class 2606 OID 16798)
-- Name: churn_scores churn_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.churn_scores
    ADD CONSTRAINT churn_scores_pkey PRIMARY KEY (id);


--
-- TOC entry 3536 (class 2606 OID 16800)
-- Name: ml_models ml_models_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ml_models
    ADD CONSTRAINT ml_models_pkey PRIMARY KEY (id);


--
-- TOC entry 3540 (class 2606 OID 16802)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3546 (class 2606 OID 16804)
-- Name: recommendations recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_pkey PRIMARY KEY (id);


--
-- TOC entry 3551 (class 2606 OID 16806)
-- Name: retention_actions retention_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retention_actions
    ADD CONSTRAINT retention_actions_pkey PRIMARY KEY (id);


--
-- TOC entry 3556 (class 2606 OID 16808)
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 3561 (class 2606 OID 16810)
-- Name: user_books user_books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_books
    ADD CONSTRAINT user_books_pkey PRIMARY KEY (id);


--
-- TOC entry 3563 (class 2606 OID 16812)
-- Name: user_books user_books_user_id_book_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_books
    ADD CONSTRAINT user_books_user_id_book_id_key UNIQUE (user_id, book_id);


--
-- TOC entry 3578 (class 2606 OID 16814)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3580 (class 2606 OID 16816)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3523 (class 1259 OID 16817)
-- Name: idx_books_auteur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_books_auteur ON public.books USING btree (auteur);


--
-- TOC entry 3524 (class 1259 OID 16818)
-- Name: idx_books_genre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_books_genre ON public.books USING btree (genre);


--
-- TOC entry 3525 (class 1259 OID 16819)
-- Name: idx_books_isbn; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_books_isbn ON public.books USING btree (isbn);


--
-- TOC entry 3526 (class 1259 OID 16820)
-- Name: idx_books_title_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_books_title_trgm ON public.books USING gin (title public.gin_trgm_ops);


--
-- TOC entry 3529 (class 1259 OID 16821)
-- Name: idx_churn_scores_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_churn_scores_date ON public.churn_scores USING btree (date_calcul DESC);


--
-- TOC entry 3530 (class 1259 OID 16822)
-- Name: idx_churn_scores_latest; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_churn_scores_latest ON public.churn_scores USING btree (user_id, is_latest);


--
-- TOC entry 3531 (class 1259 OID 16823)
-- Name: idx_churn_scores_risque; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_churn_scores_risque ON public.churn_scores USING btree (niveau_risque);


--
-- TOC entry 3532 (class 1259 OID 16824)
-- Name: idx_churn_scores_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_churn_scores_user ON public.churn_scores USING btree (user_id);


--
-- TOC entry 3564 (class 1259 OID 16825)
-- Name: idx_events_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_type ON ONLY public.user_events USING btree (event_type);


--
-- TOC entry 3565 (class 1259 OID 16826)
-- Name: idx_events_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_user ON ONLY public.user_events USING btree (user_id, occurred_at DESC);


--
-- TOC entry 3533 (class 1259 OID 16827)
-- Name: idx_ml_models_nom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ml_models_nom ON public.ml_models USING btree (nom);


--
-- TOC entry 3534 (class 1259 OID 16828)
-- Name: idx_ml_models_production; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ml_models_production ON public.ml_models USING btree (nom, is_production);


--
-- TOC entry 3537 (class 1259 OID 16829)
-- Name: idx_notifs_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifs_is_read ON public.notifications USING btree (user_id, is_read);


--
-- TOC entry 3538 (class 1259 OID 16830)
-- Name: idx_notifs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifs_user ON public.notifications USING btree (user_id);


--
-- TOC entry 3541 (class 1259 OID 16831)
-- Name: idx_reco_book; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reco_book ON public.recommendations USING btree (book_id);


--
-- TOC entry 3542 (class 1259 OID 16832)
-- Name: idx_reco_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reco_date ON public.recommendations USING btree (date_recommandation DESC);


--
-- TOC entry 3543 (class 1259 OID 16833)
-- Name: idx_reco_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reco_score ON public.recommendations USING btree (score_pertinence DESC);


--
-- TOC entry 3544 (class 1259 OID 16834)
-- Name: idx_reco_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reco_user ON public.recommendations USING btree (user_id);


--
-- TOC entry 3547 (class 1259 OID 16835)
-- Name: idx_retention_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_retention_statut ON public.retention_actions USING btree (statut);


--
-- TOC entry 3548 (class 1259 OID 16836)
-- Name: idx_retention_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_retention_type ON public.retention_actions USING btree (type_action);


--
-- TOC entry 3549 (class 1259 OID 16837)
-- Name: idx_retention_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_retention_user ON public.retention_actions USING btree (user_id);


--
-- TOC entry 3552 (class 1259 OID 16838)
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- TOC entry 3553 (class 1259 OID 16839)
-- Name: idx_subscriptions_stripe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_stripe ON public.subscriptions USING btree (stripe_sub_id);


--
-- TOC entry 3554 (class 1259 OID 16840)
-- Name: idx_subscriptions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_user ON public.subscriptions USING btree (user_id);


--
-- TOC entry 3557 (class 1259 OID 16841)
-- Name: idx_user_books_book; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_books_book ON public.user_books USING btree (book_id);


--
-- TOC entry 3558 (class 1259 OID 16842)
-- Name: idx_user_books_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_books_statut ON public.user_books USING btree (statut);


--
-- TOC entry 3559 (class 1259 OID 16843)
-- Name: idx_user_books_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_books_user ON public.user_books USING btree (user_id);


--
-- TOC entry 3576 (class 1259 OID 16844)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 3566 (class 1259 OID 16845)
-- Name: user_events_2025_q1_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q1_event_type_idx ON public.user_events_2025_q1 USING btree (event_type);


--
-- TOC entry 3567 (class 1259 OID 16846)
-- Name: user_events_2025_q1_user_id_occurred_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q1_user_id_occurred_at_idx ON public.user_events_2025_q1 USING btree (user_id, occurred_at DESC);


--
-- TOC entry 3568 (class 1259 OID 16847)
-- Name: user_events_2025_q2_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q2_event_type_idx ON public.user_events_2025_q2 USING btree (event_type);


--
-- TOC entry 3569 (class 1259 OID 16848)
-- Name: user_events_2025_q2_user_id_occurred_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q2_user_id_occurred_at_idx ON public.user_events_2025_q2 USING btree (user_id, occurred_at DESC);


--
-- TOC entry 3570 (class 1259 OID 16849)
-- Name: user_events_2025_q3_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q3_event_type_idx ON public.user_events_2025_q3 USING btree (event_type);


--
-- TOC entry 3571 (class 1259 OID 16850)
-- Name: user_events_2025_q3_user_id_occurred_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q3_user_id_occurred_at_idx ON public.user_events_2025_q3 USING btree (user_id, occurred_at DESC);


--
-- TOC entry 3572 (class 1259 OID 16851)
-- Name: user_events_2025_q4_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q4_event_type_idx ON public.user_events_2025_q4 USING btree (event_type);


--
-- TOC entry 3573 (class 1259 OID 16852)
-- Name: user_events_2025_q4_user_id_occurred_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2025_q4_user_id_occurred_at_idx ON public.user_events_2025_q4 USING btree (user_id, occurred_at DESC);


--
-- TOC entry 3574 (class 1259 OID 16853)
-- Name: user_events_2026_q1_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2026_q1_event_type_idx ON public.user_events_2026_q1 USING btree (event_type);


--
-- TOC entry 3575 (class 1259 OID 16854)
-- Name: user_events_2026_q1_user_id_occurred_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_events_2026_q1_user_id_occurred_at_idx ON public.user_events_2026_q1 USING btree (user_id, occurred_at DESC);


--
-- TOC entry 3583 (class 0 OID 0)
-- Name: user_events_2025_q1_event_type_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_type ATTACH PARTITION public.user_events_2025_q1_event_type_idx;


--
-- TOC entry 3584 (class 0 OID 0)
-- Name: user_events_2025_q1_user_id_occurred_at_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_user ATTACH PARTITION public.user_events_2025_q1_user_id_occurred_at_idx;


--
-- TOC entry 3585 (class 0 OID 0)
-- Name: user_events_2025_q2_event_type_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_type ATTACH PARTITION public.user_events_2025_q2_event_type_idx;


--
-- TOC entry 3586 (class 0 OID 0)
-- Name: user_events_2025_q2_user_id_occurred_at_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_user ATTACH PARTITION public.user_events_2025_q2_user_id_occurred_at_idx;


--
-- TOC entry 3587 (class 0 OID 0)
-- Name: user_events_2025_q3_event_type_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_type ATTACH PARTITION public.user_events_2025_q3_event_type_idx;


--
-- TOC entry 3588 (class 0 OID 0)
-- Name: user_events_2025_q3_user_id_occurred_at_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_user ATTACH PARTITION public.user_events_2025_q3_user_id_occurred_at_idx;


--
-- TOC entry 3589 (class 0 OID 0)
-- Name: user_events_2025_q4_event_type_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_type ATTACH PARTITION public.user_events_2025_q4_event_type_idx;


--
-- TOC entry 3590 (class 0 OID 0)
-- Name: user_events_2025_q4_user_id_occurred_at_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_user ATTACH PARTITION public.user_events_2025_q4_user_id_occurred_at_idx;


--
-- TOC entry 3591 (class 0 OID 0)
-- Name: user_events_2026_q1_event_type_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_type ATTACH PARTITION public.user_events_2026_q1_event_type_idx;


--
-- TOC entry 3592 (class 0 OID 0)
-- Name: user_events_2026_q1_user_id_occurred_at_idx; Type: INDEX ATTACH; Schema: public; Owner: postgres
--

ALTER INDEX public.idx_events_user ATTACH PARTITION public.user_events_2026_q1_user_id_occurred_at_idx;


--
-- TOC entry 3607 (class 2620 OID 16855)
-- Name: admins trg_admins_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3608 (class 2620 OID 16856)
-- Name: books trg_books_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3609 (class 2620 OID 16857)
-- Name: churn_scores trg_churn_score_latest; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_churn_score_latest AFTER INSERT OR UPDATE ON public.churn_scores FOR EACH ROW EXECUTE FUNCTION public.reset_latest_churn_score();


--
-- TOC entry 3610 (class 2620 OID 16858)
-- Name: subscriptions trg_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3611 (class 2620 OID 16859)
-- Name: user_books trg_user_books_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_user_books_updated_at BEFORE UPDATE ON public.user_books FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3612 (class 2620 OID 16860)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3605 (class 2606 OID 16970)
-- Name: book_comments book_comments_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_comments
    ADD CONSTRAINT book_comments_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 3606 (class 2606 OID 16975)
-- Name: book_comments book_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_comments
    ADD CONSTRAINT book_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3593 (class 2606 OID 16861)
-- Name: churn_scores churn_scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.churn_scores
    ADD CONSTRAINT churn_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3594 (class 2606 OID 16866)
-- Name: ml_models ml_models_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ml_models
    ADD CONSTRAINT ml_models_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(id);


--
-- TOC entry 3595 (class 2606 OID 16871)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3596 (class 2606 OID 16876)
-- Name: recommendations recommendations_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 3597 (class 2606 OID 16881)
-- Name: recommendations recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3598 (class 2606 OID 16886)
-- Name: retention_actions retention_actions_churn_score_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retention_actions
    ADD CONSTRAINT retention_actions_churn_score_id_fkey FOREIGN KEY (churn_score_id) REFERENCES public.churn_scores(id);


--
-- TOC entry 3599 (class 2606 OID 16891)
-- Name: retention_actions retention_actions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retention_actions
    ADD CONSTRAINT retention_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3600 (class 2606 OID 16896)
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3601 (class 2606 OID 16901)
-- Name: user_books user_books_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_books
    ADD CONSTRAINT user_books_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 3602 (class 2606 OID 16906)
-- Name: user_books user_books_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_books
    ADD CONSTRAINT user_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3603 (class 2606 OID 16911)
-- Name: user_events user_events_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.user_events
    ADD CONSTRAINT user_events_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- TOC entry 3604 (class 2606 OID 16931)
-- Name: user_events user_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.user_events
    ADD CONSTRAINT user_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-04-26 11:24:33

--
-- PostgreSQL database dump complete
--

\unrestrict YjkPLzQGLKOSjOIW9e7nOd6CMwKN3eD9H8g8nz8tRUIw64ugktROFsWCW7ZoTbT


--
-- PostgreSQL database dump
--

\restrict ZsFSIuCDNBRfHQYNEeWXyJWfyHoZXiuIybxYZH8aoHP6xBJm1uwMmmbmL2yqP8A

-- Dumped from database version 17.7 (Homebrew)
-- Dumped by pg_dump version 18.1

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: articles; Type: TABLE; Schema: public; Owner: ruiwang
--

CREATE TABLE public.articles (
    id integer NOT NULL,
    title character varying,
    content text NOT NULL,
    content_hash character varying,
    word_count integer,
    genre character varying,
    specific_topic character varying,
    grading_data json,
    uploaded_at timestamp without time zone,
    published_at timestamp without time zone,
    status character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.articles OWNER TO ruiwang;

--
-- Name: articles_id_seq; Type: SEQUENCE; Schema: public; Owner: ruiwang
--

CREATE SEQUENCE public.articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.articles_id_seq OWNER TO ruiwang;

--
-- Name: articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ruiwang
--

ALTER SEQUENCE public.articles_id_seq OWNED BY public.articles.id;


--
-- Name: questions; Type: TABLE; Schema: public; Owner: ruiwang
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    version_id integer,
    type character varying,
    stem text NOT NULL,
    options json,
    correct_answer character varying,
    analysis text,
    ai_tutor_script json,
    error_tags json,
    trap_type character varying,
    related_paragraph_indices json,
    created_at timestamp without time zone
);


ALTER TABLE public.questions OWNER TO ruiwang;

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: ruiwang
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questions_id_seq OWNER TO ruiwang;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ruiwang
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: sentence_surgeries; Type: TABLE; Schema: public; Owner: ruiwang
--

CREATE TABLE public.sentence_surgeries (
    id integer NOT NULL,
    version_id integer,
    original_sentence text NOT NULL,
    translation text,
    analysis text,
    structure_data json,
    chunks_visual json,
    core_sentence text,
    core_audio_url character varying,
    coach_script json,
    created_at timestamp without time zone
);


ALTER TABLE public.sentence_surgeries OWNER TO ruiwang;

--
-- Name: sentence_surgeries_id_seq; Type: SEQUENCE; Schema: public; Owner: ruiwang
--

CREATE SEQUENCE public.sentence_surgeries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sentence_surgeries_id_seq OWNER TO ruiwang;

--
-- Name: sentence_surgeries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ruiwang
--

ALTER SEQUENCE public.sentence_surgeries_id_seq OWNED BY public.sentence_surgeries.id;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: ruiwang
--

CREATE TABLE public.user_profiles (
    id integer NOT NULL,
    username character varying,
    role character varying,
    level character varying,
    tags json,
    total_reading_time integer,
    vocab_mastered_count integer,
    surgery_completed_count integer,
    created_at timestamp without time zone
);


ALTER TABLE public.user_profiles OWNER TO ruiwang;

--
-- Name: user_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: ruiwang
--

CREATE SEQUENCE public.user_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_profiles_id_seq OWNER TO ruiwang;

--
-- Name: user_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ruiwang
--

ALTER SEQUENCE public.user_profiles_id_seq OWNED BY public.user_profiles.id;


--
-- Name: versions; Type: TABLE; Schema: public; Owner: ruiwang
--

CREATE TABLE public.versions (
    id integer NOT NULL,
    article_id integer,
    level character varying,
    title character varying,
    content text NOT NULL,
    source character varying,
    syllabus_coverage json,
    library_tags json,
    stages json,
    value_tags json,
    grading_data json,
    original_content text,
    status character varying,
    published_at timestamp without time zone,
    created_at timestamp without time zone
);


ALTER TABLE public.versions OWNER TO ruiwang;

--
-- Name: versions_id_seq; Type: SEQUENCE; Schema: public; Owner: ruiwang
--

CREATE SEQUENCE public.versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.versions_id_seq OWNER TO ruiwang;

--
-- Name: versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ruiwang
--

ALTER SEQUENCE public.versions_id_seq OWNED BY public.versions.id;


--
-- Name: vocab_cards; Type: TABLE; Schema: public; Owner: ruiwang
--

CREATE TABLE public.vocab_cards (
    id integer NOT NULL,
    version_id integer,
    word character varying,
    syllables json,
    phonetic character varying,
    definition text,
    context_sentence text,
    ai_memory_hint text,
    audio_url character varying,
    difficulty_level character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.vocab_cards OWNER TO ruiwang;

--
-- Name: vocab_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: ruiwang
--

CREATE SEQUENCE public.vocab_cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vocab_cards_id_seq OWNER TO ruiwang;

--
-- Name: vocab_cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ruiwang
--

ALTER SEQUENCE public.vocab_cards_id_seq OWNED BY public.vocab_cards.id;


--
-- Name: articles id; Type: DEFAULT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.articles ALTER COLUMN id SET DEFAULT nextval('public.articles_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: sentence_surgeries id; Type: DEFAULT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.sentence_surgeries ALTER COLUMN id SET DEFAULT nextval('public.sentence_surgeries_id_seq'::regclass);


--
-- Name: user_profiles id; Type: DEFAULT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.user_profiles ALTER COLUMN id SET DEFAULT nextval('public.user_profiles_id_seq'::regclass);


--
-- Name: versions id; Type: DEFAULT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.versions ALTER COLUMN id SET DEFAULT nextval('public.versions_id_seq'::regclass);


--
-- Name: vocab_cards id; Type: DEFAULT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.vocab_cards ALTER COLUMN id SET DEFAULT nextval('public.vocab_cards_id_seq'::regclass);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: sentence_surgeries sentence_surgeries_pkey; Type: CONSTRAINT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.sentence_surgeries
    ADD CONSTRAINT sentence_surgeries_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: versions versions_pkey; Type: CONSTRAINT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_pkey PRIMARY KEY (id);


--
-- Name: vocab_cards vocab_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.vocab_cards
    ADD CONSTRAINT vocab_cards_pkey PRIMARY KEY (id);


--
-- Name: ix_articles_content_hash; Type: INDEX; Schema: public; Owner: ruiwang
--

CREATE INDEX ix_articles_content_hash ON public.articles USING btree (content_hash);


--
-- Name: ix_articles_id; Type: INDEX; Schema: public; Owner: ruiwang
--

CREATE INDEX ix_articles_id ON public.articles USING btree (id);


--
-- Name: ix_articles_title; Type: INDEX; Schema: public; Owner: ruiwang
--

CREATE INDEX ix_articles_title ON public.articles USING btree (title);


--
-- Name: ix_questions_id; Type: INDEX; Schema: public; Owner: ruiwang
--

CREATE INDEX ix_questions_id ON public.questions USING btree (id);


--
-- Name: ix_sentence_surgeries_id; Type: INDEX; Schema: public; Owner: ruiwang
--

CREATE INDEX ix_sentence_surgeries_id ON public.sentence_surgeries USING btree (id);


--
-- Name: ix_user_profiles_id; Type: INDEX; Schema: public; Owner: ruiwang
--

CREATE INDEX ix_user_profiles_id ON public.user_profiles USING btree (id);


--
-- Name: ix_user_profiles_username; Type: INDEX; Schema: public; Owner: ruiwang
--

CREATE UNIQUE INDEX ix_user_profiles_username ON public.user_profiles USING btree (username);


--
-- Name: ix_versions_id; Type: INDEX; Schema: public; Owner: ruiwang
--

CREATE INDEX ix_versions_id ON public.versions USING btree (id);


--
-- Name: ix_versions_level; Type: INDEX; Schema: public; Owner: ruiwang
--

CREATE INDEX ix_versions_level ON public.versions USING btree (level);


--
-- Name: ix_vocab_cards_id; Type: INDEX; Schema: public; Owner: ruiwang
--

CREATE INDEX ix_vocab_cards_id ON public.vocab_cards USING btree (id);


--
-- Name: ix_vocab_cards_word; Type: INDEX; Schema: public; Owner: ruiwang
--

CREATE INDEX ix_vocab_cards_word ON public.vocab_cards USING btree (word);


--
-- Name: questions questions_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.versions(id);


--
-- Name: sentence_surgeries sentence_surgeries_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.sentence_surgeries
    ADD CONSTRAINT sentence_surgeries_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.versions(id);


--
-- Name: versions versions_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id);


--
-- Name: vocab_cards vocab_cards_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ruiwang
--

ALTER TABLE ONLY public.vocab_cards
    ADD CONSTRAINT vocab_cards_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.versions(id);


--
-- PostgreSQL database dump complete
--

\unrestrict ZsFSIuCDNBRfHQYNEeWXyJWfyHoZXiuIybxYZH8aoHP6xBJm1uwMmmbmL2yqP8A


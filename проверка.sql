--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

-- Started on 2025-07-13 11:46:34

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- TOC entry 233 (class 1259 OID 16726)
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    id integer NOT NULL,
    user_id integer,
    address text NOT NULL
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16725)
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.addresses_id_seq OWNER TO postgres;

--
-- TOC entry 4892 (class 0 OID 0)
-- Dependencies: 232
-- Name: addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;


--
-- TOC entry 227 (class 1259 OID 16530)
-- Name: cart; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart (
    id integer NOT NULL,
    user_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    price numeric,
    stock_id integer NOT NULL
);


ALTER TABLE public.cart OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16529)
-- Name: cart_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_id_seq OWNER TO postgres;

--
-- TOC entry 4893 (class 0 OID 0)
-- Dependencies: 226
-- Name: cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_id_seq OWNED BY public.cart.id;


--
-- TOC entry 235 (class 1259 OID 16740)
-- Name: model_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.model_images (
    id integer NOT NULL,
    brand character varying NOT NULL,
    model character varying NOT NULL,
    image_path text NOT NULL,
    "order" integer DEFAULT 0,
    is_featured_image boolean DEFAULT false
);


ALTER TABLE public.model_images OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16739)
-- Name: model_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.model_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.model_images_id_seq OWNER TO postgres;

--
-- TOC entry 4894 (class 0 OID 0)
-- Dependencies: 234
-- Name: model_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.model_images_id_seq OWNED BY public.model_images.id;


--
-- TOC entry 224 (class 1259 OID 16507)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    price numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    stock_id integer
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16526)
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- TOC entry 4895 (class 0 OID 0)
-- Dependencies: 225
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- TOC entry 218 (class 1259 OID 16415)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer,
    status character varying(50) DEFAULT 'Ожидание'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    phone character varying(32),
    delivery_method character varying(32),
    pickup_warehouse character varying(64),
    address text,
    comment text,
    payment_method character varying(32)
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16414)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- TOC entry 4896 (class 0 OID 0)
-- Dependencies: 217
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 220 (class 1259 OID 16441)
-- Name: productsimages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productsimages (
    id integer NOT NULL,
    product_id integer,
    image_path text,
    is_featured_image boolean DEFAULT false,
    "order" integer DEFAULT 0
);


ALTER TABLE public.productsimages OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16440)
-- Name: productsImages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."productsImages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."productsImages_id_seq" OWNER TO postgres;

--
-- TOC entry 4897 (class 0 OID 0)
-- Dependencies: 219
-- Name: productsImages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."productsImages_id_seq" OWNED BY public.productsimages.id;


--
-- TOC entry 222 (class 1259 OID 16460)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 4898 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.roles IS '-- Таблица ролей';


--
-- TOC entry 221 (class 1259 OID 16459)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 4899 (class 0 OID 0)
-- Dependencies: 221
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 229 (class 1259 OID 16691)
-- Name: tyre_catalog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tyre_catalog (
    id integer NOT NULL,
    article character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    brand character varying(100),
    model character varying(100),
    size character varying(50),
    load_index character varying(10),
    speed_index character varying(10),
    season character varying(50),
    vehicle_type character varying(50),
    tread_depth numeric(4,1),
    section_width numeric(5,1),
    recommended_rim_width character varying(10),
    diameter numeric(5,1),
    country character varying(100),
    description text,
    studs boolean DEFAULT false,
    profile numeric(5,1)
);


ALTER TABLE public.tyre_catalog OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16690)
-- Name: tyre_catalog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tyre_catalog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tyre_catalog_id_seq OWNER TO postgres;

--
-- TOC entry 4900 (class 0 OID 0)
-- Dependencies: 228
-- Name: tyre_catalog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tyre_catalog_id_seq OWNED BY public.tyre_catalog.id;


--
-- TOC entry 231 (class 1259 OID 16702)
-- Name: tyre_stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tyre_stock (
    id integer NOT NULL,
    tyre_id integer NOT NULL,
    location character varying(100) NOT NULL,
    price_wholesale numeric(10,2),
    price_retail numeric(10,2),
    stock integer,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tyre_stock OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16701)
-- Name: tyre_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tyre_stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tyre_stock_id_seq OWNER TO postgres;

--
-- TOC entry 4901 (class 0 OID 0)
-- Dependencies: 230
-- Name: tyre_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tyre_stock_id_seq OWNED BY public.tyre_stock.id;


--
-- TOC entry 223 (class 1259 OID 16482)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- TOC entry 4902 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE user_roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_roles IS '-- Таблица для связи пользователей и их ролей';


--
-- TOC entry 216 (class 1259 OID 16399)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100),
    email character varying(100),
    password character varying(255),
    phone character varying(20),
    phone_verified boolean DEFAULT false,
    reset_code character varying(10),
    email_code character varying(10),
    email_verified boolean DEFAULT false,
    CONSTRAINT email_or_phone_required CHECK ((((email IS NOT NULL) AND ((email)::text <> ''::text)) OR ((phone IS NOT NULL) AND ((phone)::text <> ''::text))))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16398)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4903 (class 0 OID 0)
-- Dependencies: 215
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4703 (class 2604 OID 16729)
-- Name: addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);


--
-- TOC entry 4697 (class 2604 OID 16533)
-- Name: cart id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart ALTER COLUMN id SET DEFAULT nextval('public.cart_id_seq'::regclass);


--
-- TOC entry 4704 (class 2604 OID 16743)
-- Name: model_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.model_images ALTER COLUMN id SET DEFAULT nextval('public.model_images_id_seq'::regclass);


--
-- TOC entry 4694 (class 2604 OID 16527)
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- TOC entry 4686 (class 2604 OID 16418)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 4690 (class 2604 OID 16444)
-- Name: productsimages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsimages ALTER COLUMN id SET DEFAULT nextval('public."productsImages_id_seq"'::regclass);


--
-- TOC entry 4693 (class 2604 OID 16463)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4699 (class 2604 OID 16694)
-- Name: tyre_catalog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tyre_catalog ALTER COLUMN id SET DEFAULT nextval('public.tyre_catalog_id_seq'::regclass);


--
-- TOC entry 4701 (class 2604 OID 16705)
-- Name: tyre_stock id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tyre_stock ALTER COLUMN id SET DEFAULT nextval('public.tyre_stock_id_seq'::regclass);


--
-- TOC entry 4683 (class 2604 OID 16402)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4732 (class 2606 OID 16733)
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 4724 (class 2606 OID 16536)
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);


--
-- TOC entry 4735 (class 2606 OID 16749)
-- Name: model_images model_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.model_images
    ADD CONSTRAINT model_images_pkey PRIMARY KEY (id);


--
-- TOC entry 4722 (class 2606 OID 16515)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4713 (class 2606 OID 16420)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4720 (class 2606 OID 16486)
-- Name: user_roles pk_user_roles; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id);


--
-- TOC entry 4716 (class 2606 OID 16554)
-- Name: productsimages productsimages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsimages
    ADD CONSTRAINT productsimages_pkey PRIMARY KEY (id);


--
-- TOC entry 4718 (class 2606 OID 16465)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4726 (class 2606 OID 16700)
-- Name: tyre_catalog tyre_catalog_article_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tyre_catalog
    ADD CONSTRAINT tyre_catalog_article_key UNIQUE (article);


--
-- TOC entry 4728 (class 2606 OID 16698)
-- Name: tyre_catalog tyre_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tyre_catalog
    ADD CONSTRAINT tyre_catalog_pkey PRIMARY KEY (id);


--
-- TOC entry 4730 (class 2606 OID 16708)
-- Name: tyre_stock tyre_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tyre_stock
    ADD CONSTRAINT tyre_stock_pkey PRIMARY KEY (id);


--
-- TOC entry 4709 (class 2606 OID 16406)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4711 (class 2606 OID 16404)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4714 (class 1259 OID 16528)
-- Name: idx_featured_image; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_featured_image ON public.productsimages USING btree (product_id, is_featured_image) WITH (deduplicate_items='true');


--
-- TOC entry 4733 (class 1259 OID 16750)
-- Name: idx_model_images_brand_model; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_model_images_brand_model ON public.model_images USING btree (brand, model);


--
-- TOC entry 4736 (class 1259 OID 16751)
-- Name: uniq_model_images_path; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uniq_model_images_path ON public.model_images USING btree (brand, model, image_path);


--
-- TOC entry 4743 (class 2606 OID 16734)
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4741 (class 2606 OID 16537)
-- Name: cart fk_cart_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT fk_cart_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4738 (class 2606 OID 16492)
-- Name: user_roles fk_user_roles_role_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4739 (class 2606 OID 16487)
-- Name: user_roles fk_user_roles_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4740 (class 2606 OID 16516)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 4737 (class 2606 OID 16421)
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4742 (class 2606 OID 16709)
-- Name: tyre_stock tyre_stock_tyre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tyre_stock
    ADD CONSTRAINT tyre_stock_tyre_id_fkey FOREIGN KEY (tyre_id) REFERENCES public.tyre_catalog(id) ON DELETE CASCADE;


-- Completed on 2025-07-13 11:46:34

--
-- PostgreSQL database dump complete
--


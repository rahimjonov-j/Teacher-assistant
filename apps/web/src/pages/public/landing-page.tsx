import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './landing-page.css'

/* ----------------------------------------------------------------
   Live product demo — AI generator that types a prompt, "generates",
   then reveals a quiz. Loops forever to make the hero feel alive.
   ---------------------------------------------------------------- */
const DEMO_PROMPT = 'Fotosintez jarayoni · 8-sinf · 10 savol'

function useGeneratorDemo() {
  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState<'type' | 'load' | 'done'>('type')

  useEffect(() => {
    let mounted = true
    const timers: number[] = []
    const wait = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))

    const run = () => {
      if (!mounted) return
      setPhase('type')
      setTyped('')
      let i = 0
      const type = () => {
        if (!mounted) return
        i += 1
        setTyped(DEMO_PROMPT.slice(0, i))
        if (i < DEMO_PROMPT.length) wait(48, type)
        else
          wait(600, () => {
            setPhase('load')
            wait(1400, () => {
              setPhase('done')
              wait(3400, run)
            })
          })
      }
      type()
    }

    run()
    return () => {
      mounted = false
      timers.forEach(clearTimeout)
    }
  }, [])

  return { typed, phase }
}

function GeneratorDemo() {
  const { typed, phase } = useGeneratorDemo()
  return (
    <div className="demo">
      <div className="demo-head">
        <span className="demo-dots"><i /><i /><i /></span>
        <span className="demo-title">AI Generator</span>
        <span className="demo-live"><span className="lv-dot" /> jonli</span>
      </div>
      <div className="demo-body">
        <div className="demo-field">
          <span className="demo-label">Mavzu</span>
          <div className="demo-input">
            {typed}
            {phase === 'type' ? <span className="demo-caret" /> : null}
          </div>
        </div>

        <button className={`demo-gen ${phase === 'load' ? 'is-load' : ''}`} type="button">
          {phase === 'load' ? (
            <>
              <span className="demo-spin" /> Generatsiya qilinmoqda…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              Generatsiya
            </>
          )}
        </button>

        {phase === 'load' ? (
          <div className="demo-prog"><span /></div>
        ) : null}

        {phase === 'done' ? (
          <div className="demo-result">
            <div className="dq">
              <div className="dq-q">1. Fotosintez qaysi organoidda kechadi?</div>
              <div className="dq-o">Mitoxondriya</div>
              <div className="dq-o ok">Xloroplast <span className="dq-tick">✓</span></div>
              <div className="dq-o">Ribosoma</div>
            </div>
            <div className="dq slim">
              <div className="dq-q">2. Jarayon uchun zarur gaz?</div>
              <div className="dq-line" />
              <div className="dq-line short" />
            </div>
            <div className="demo-done">
              <span>✓ 10 savol tayyor</span>
              <span className="demo-pdf">PDF eksport</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

const features = [
  {
    big: true,
    title: 'AI Kontent Generatsiyasi',
    text: 'Mavzu va sinfni kiriting — test, dars rejasi, mashq yoki insho topshirig‘i 30 sekundda tayyor. DTM standartlariga mos, o‘zbek tilida.',
    icon: <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />,
  },
  {
    title: 'Quiz & Testlar',
    text: 'Variantli testlar, avtomatik baholash, bir tugmada PDF eksport.',
    icon: (
      <>
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
  },
  {
    title: 'Yozma ish baholash',
    text: 'AI grammatika, mantiq va uslubni alohida baholaydi.',
    icon: <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />,
  },
  {
    title: 'Analitika & Reyting',
    text: 'Qaysi o‘quvchi qiynalayapti — bir qarashda grafiklarda.',
    icon: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  },
]

const steps = [
  { n: '01', title: 'Ro‘yxatdan o‘ting', text: 'Gmail bilan 30 sekundda. Kartochka kerak emas — 12 ta bepul kredit darhol.' },
  { n: '02', title: 'Sinflar qo‘shing', text: 'Sinf va o‘quvchilarni kiriting. Har biriga login-parol avtomatik yaratiladi.' },
  { n: '03', title: 'Yarating va yuboring', text: 'Mavzuni tanlang, generatsiya qiling, sinfga bir tugmada yuboring.' },
]

const plans = [
  { name: 'Bepul Trial', price: '0', unit: "so'm", credits: '12 kredit', features: ['Asosiy AI funksiyalar', '2 ta sinf', 'PDF eksport'], cta: 'Bepul boshlash', featured: false },
  { name: 'Basic', price: '49 000', unit: "so'm / oy", credits: '80 kredit', features: ['Barcha AI funksiyalar', '10 ta sinf', 'Yozma ish baholash', 'Email yordami'], cta: 'Tanlash', featured: false },
  { name: 'Pro', price: '119 000', unit: "so'm / oy", credits: '220 kredit', features: ['Cheklovsiz sinflar', "To'liq analitika", 'Audio speaking', 'Ustuvor yordam'], cta: "Pro ga o'tish", featured: true },
  { name: 'Premium', price: '249 000', unit: "so'm / oy", credits: '520 kredit', features: ['Hammasi Pro dan', 'Maktab hisoboti', 'API kirish', 'Shaxsiy menejer'], cta: 'Maktab uchun', featured: false },
]

const testimonials = [
  { quote: 'Avval bitta test kechqurun 2 soat ketardi. Endi bir necha daqiqada tayyor.', name: 'Aziza Karimova', role: 'Ingliz tili · Toshkent', initial: 'A' },
  { quote: 'Qaysi o‘quvchi qaysi mavzuda qiynalayotganini darhol ko‘raman.', name: 'Bekzod Otaboyev', role: 'Matematika · Samarqand', initial: 'B' },
  { quote: 'Yozma ishlarni AI tahlil qiladi, men faqat ko‘rib chiqaman. 70% vaqt tejaladi.', name: 'Nodira Yusupova', role: 'Ona tili · Buxoro', initial: 'N' },
]

const marquee = ['Prezident maktablari', 'IDUM', 'Xalq ta‘limi', 'TATU', 'Inha University', 'Akademik litsey', 'Najot Ta‘lim']

function Logo() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b0b0d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1" />
        </svg>
      </span>
      <span>Teacher Assistant</span>
    </span>
  )
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
  )
}

export function LandingPage() {
  const navRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -48px 0px' },
    )
    document.querySelectorAll('.lp-root .reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          const target = parseFloat(el.dataset.count ?? '0')
          const suffix = el.dataset.suffix ?? ''
          const start = performance.now()
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / 1300)
            el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + suffix
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          io.unobserve(el)
        })
      },
      { threshold: 0.5 },
    )
    document.querySelectorAll('.lp-root [data-count]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="lp-root">
      {/* ===================== NAV ===================== */}
      <header ref={navRef} className="lp-nav">
        <div className="lp-container nav-inner">
          <Link to="/" onClick={closeMenu}><Logo /></Link>
          <nav className="nav-links">
            <a href="#features">Imkoniyatlar</a>
            <a href="#how">Qanday ishlaydi</a>
            <a href="#pricing">Narxlar</a>
            <a href="#stories">Tajribalar</a>
          </nav>
          <div className="nav-actions">
            <Link to="/login" className="btn btn-ghost">Kirish</Link>
            <Link to="/register" className="btn btn-accent">Bepul boshlash</Link>
          </div>
          <button type="button" className="nav-burger" aria-label="Menyu" onClick={() => setMenuOpen((v) => !v)}>
            <span className={menuOpen ? 'open' : ''} />
            <span className={menuOpen ? 'open' : ''} />
            <span className={menuOpen ? 'open' : ''} />
          </button>
        </div>
        {menuOpen ? (
          <div className="nav-mobile">
            <a href="#features" onClick={closeMenu}>Imkoniyatlar</a>
            <a href="#how" onClick={closeMenu}>Qanday ishlaydi</a>
            <a href="#pricing" onClick={closeMenu}>Narxlar</a>
            <a href="#stories" onClick={closeMenu}>Tajribalar</a>
            <div className="nav-mobile-actions">
              <Link to="/login" className="btn btn-ghost" onClick={closeMenu}>Kirish</Link>
              <Link to="/register" className="btn btn-accent" onClick={closeMenu}>Bepul boshlash</Link>
            </div>
          </div>
        ) : null}
      </header>

      {/* ===================== HERO ===================== */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-grid-lines" />
        <div className="lp-container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow-live reveal">
              <span className="lv-dot" /> AI yordamchi — o‘zbek tilida
            </span>
            <h1 className="reveal d1">
              Test yozishni<br />
              <span className="accent">AI ga qoldiring.</span>
            </h1>
            <p className="lead reveal d2">
              Bitta savol yozing — to‘liq test, dars rejasi yoki yozma topshiriq tayyor.
              O‘qituvchilar uchun aqlli ish stoli.
            </p>
            <div className="cta-row reveal d3">
              <Link to="/register" className="btn btn-accent btn-lg">Bepul boshlash <Arrow /></Link>
              <a href="#features" className="btn btn-line btn-lg">Imkoniyatlar</a>
            </div>
            <div className="hero-trust reveal d4">
              <div className="avatars">
                {['A', 'B', 'N', 'D'].map((c, i) => (
                  <span key={c} className="av" style={{ zIndex: 4 - i }}>{c}</span>
                ))}
              </div>
              <span><strong data-count="2400" data-suffix="+">0</strong> o‘qituvchi ishonib foydalanmoqda</span>
            </div>
          </div>

          <div className="hero-visual reveal d2">
            <GeneratorDemo />
            <div className="chip chip-1"><span className="chip-k">⚡</span> 30 sek / test</div>
            <div className="chip chip-2"><span className="chip-k">↑</span> 2 soat tejash</div>
          </div>
        </div>

        {/* Marquee */}
        <div className="marquee">
          <div className="marquee-track">
            {[...marquee, ...marquee].map((m, i) => (
              <span key={i} className="marquee-item">{m}<i>✦</i></span>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="section" id="features">
        <div className="lp-container">
          <div className="sec-head reveal">
            <span className="eyebrow">/ Imkoniyatlar</span>
            <h2 className="section-title">Bir platforma — <span className="accent">butun ish oqimi</span></h2>
          </div>
          <div className="bento">
            {features.map((f) => (
              <div key={f.title} className={`bento-card reveal ${f.big ? 'big' : ''}`}>
                <div className="bc-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                </div>
                <div className="bc-text">
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
                {f.big ? (
                  <div className="bc-demo">
                    <div className="bc-line"><span className="k">Mavzu</span><span className="v">Fotosintez · 8-sinf</span></div>
                    <div className="bc-line"><span className="k">Format</span><span className="v">Variantli test · 10 savol</span></div>
                    <div className="bc-bars">
                      {[60, 80, 45, 90, 70].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HOW ===================== */}
      <section className="section alt" id="how">
        <div className="lp-container">
          <div className="sec-head reveal">
            <span className="eyebrow">/ Qanday ishlaydi</span>
            <h2 className="section-title">Uch qadamda boshlang</h2>
          </div>
          <div className="steps">
            {steps.map((s) => (
              <div key={s.n} className="step reveal">
                <div className="step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PRICING ===================== */}
      <section className="section" id="pricing">
        <div className="lp-container">
          <div className="sec-head reveal">
            <span className="eyebrow">/ Narxlar</span>
            <h2 className="section-title">Soddagina kreditlar</h2>
          </div>
          <div className="pricing-grid">
            {plans.map((p) => (
              <div key={p.name} className={`price-card reveal ${p.featured ? 'featured' : ''}`}>
                {p.featured ? <div className="badge-pop">Mashhur</div> : null}
                <div className="pc-name">{p.name}</div>
                <div className="pc-price">{p.price} <small>{p.unit}</small></div>
                <div className="pc-credits">{p.credits}</div>
                <ul>
                  {p.features.map((feat) => (
                    <li key={feat}><span className="ch">✓</span> {feat}</li>
                  ))}
                </ul>
                <Link to="/register" className={`btn btn-block ${p.featured ? 'btn-accent' : 'btn-line'}`}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== STORIES ===================== */}
      <section className="section alt" id="stories">
        <div className="lp-container">
          <div className="sec-head reveal">
            <span className="eyebrow">/ Tajribalar</span>
            <h2 className="section-title">O‘qituvchilar nima deyishadi</h2>
          </div>
          <div className="testi-grid">
            {testimonials.map((t) => (
              <div key={t.name} className="testi reveal">
                <div className="stars">★★★★★</div>
                <p className="quote">“{t.quote}”</p>
                <div className="who">
                  <span className="who-av">{t.initial}</span>
                  <div><div className="who-n">{t.name}</div><div className="who-r">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
          <div className="stats-bar reveal">
            <div className="stat"><div className="sv"><span data-count="2400" data-suffix="+">0</span></div><div className="sl">Faol o‘qituvchilar</div></div>
            <div className="stat"><div className="sv"><span data-count="184" data-suffix="K+">0</span></div><div className="sl">Yaratilgan kontent</div></div>
            <div className="stat"><div className="sv"><span data-count="47">0</span></div><div className="sl">Shahar va tumanlar</div></div>
            <div className="stat"><div className="sv"><span data-count="98" data-suffix="%">0</span></div><div className="sl">Qoniqish darajasi</div></div>
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="section">
        <div className="lp-container">
          <div className="cta-box reveal">
            <div className="cta-glow" />
            <h2>Bugun boshlang.<br /><span className="accent">12 ta bepul kredit</span> kutmoqda.</h2>
            <p>Kartochka kerak emas. 30 sekundda hisob oching va birinchi testingizni yarating.</p>
            <div className="cta-row center">
              <Link to="/register" className="btn btn-accent btn-lg">Bepul boshlash <Arrow /></Link>
              <Link to="/login" className="btn btn-line btn-lg">Kirish</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="lp-footer">
        <div className="lp-container footer-grid">
          <div className="footer-brand">
            <Logo />
            <p>O‘zbek o‘qituvchilari uchun AI yordamchi. Dars rejalari, testlar, baholar — bir joyda.</p>
          </div>
          <div className="footer-col">
            <h5>Mahsulot</h5>
            <a href="#features">Imkoniyatlar</a>
            <a href="#pricing">Narxlar</a>
            <Link to="/register">Boshlash</Link>
          </div>
          <div className="footer-col">
            <h5>Yordam</h5>
            <Link to="/hujjatlar">Hujjatlar</Link>
            <Link to="/video-darslar">Video darslar</Link>
            <Link to="/yordam">Yordam markazi</Link>
            <Link to="/aloqa">Aloqa</Link>
          </div>
          <div className="footer-col">
            <h5>Kompaniya</h5>
            <Link to="/biz-haqimizda">Biz haqimizda</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/maxfiylik">Maxfiylik</Link>
          </div>
        </div>
        <div className="lp-container footer-bottom">
          <span>© 2026 Teacher Assistant. Toshkent, O‘zbekiston.</span>
          <span className="fb-links">
            <Link to="/maxfiylik">Shartlar</Link>
            <Link to="/maxfiylik">Maxfiylik</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}

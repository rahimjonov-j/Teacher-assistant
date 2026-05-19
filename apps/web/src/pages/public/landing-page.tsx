import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './landing-page.css'

export function LandingPage() {
  const navRef = useRef<HTMLElement>(null)
  const heroChartRef = useRef<SVGSVGElement>(null)
  const analyticsChartRef = useRef<SVGSVGElement>(null)

  // Nav scroll state
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const onScroll = () => {
      if (window.scrollY > 12) nav.classList.add('scrolled')
      else nav.classList.remove('scrolled')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll('.lp-root .reveal')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Count-up animation
  useEffect(() => {
    const countIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          const target = parseFloat(el.dataset.count ?? '0')
          const suffix = el.dataset.suffix ?? ''
          const dur = 1400
          const start = performance.now()
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / dur)
            const eased = 1 - Math.pow(1 - p, 3)
            const v = target * eased
            el.textContent = v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + suffix
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          countIO.unobserve(el)
        })
      },
      { threshold: 0.4 },
    )
    document.querySelectorAll('.lp-root [data-count]').forEach((el) => countIO.observe(el))
    return () => countIO.disconnect()
  }, [])

  // Waveform random heights
  useEffect(() => {
    document.querySelectorAll('.lp-root .waveform .bar').forEach((b, i) => {
      const el = b as HTMLElement
      el.style.height = 30 + Math.random() * 70 + '%'
      el.style.animationDelay = i * 60 + 'ms'
    })
  }, [])

  // Hero chart
  useEffect(() => {
    function draw() {
      const svg = heroChartRef.current
      if (!svg) return
      const w = svg.clientWidth
      const h = svg.clientHeight
      if (!w || !h) return
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
      const data = [12, 18, 14, 22, 19, 28, 24, 34, 30, 42, 38, 48]
      const max = Math.max(...data) * 1.1
      const stepX = w / (data.length - 1)
      let path = ''
      let area = `M 0 ${h} `
      data.forEach((v, i) => {
        const x = i * stepX
        const y = h - (v / max) * (h - 16) - 6
        path += (i === 0 ? 'M' : 'L') + ` ${x} ${y} `
        area += `L ${x} ${y} `
      })
      area += `L ${w} ${h} Z`
      svg.innerHTML = `
        <defs>
          <linearGradient id="hg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#7C3AED" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="hl" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="#A5B4FC"/>
            <stop offset="100%" stop-color="#C4B5FD"/>
          </linearGradient>
        </defs>
        <path d="${area}" fill="url(#hg)"/>
        <path d="${path}" stroke="url(#hl)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        ${data.map((v, i) => {
          const x = i * stepX
          const y = h - (v / max) * (h - 16) - 6
          return `<circle cx="${x}" cy="${y}" r="${i === data.length - 1 ? 3.5 : 0}" fill="#fff"/>`
        }).join('')}
      `
    }
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [])

  // Analytics chart
  useEffect(() => {
    function draw() {
      const svg = analyticsChartRef.current
      if (!svg) return
      const w = svg.clientWidth
      const h = svg.clientHeight
      if (!w || !h) return
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
      const cls = ['8A', '8B', '9A', '9B', '10A']
      const vals = [78, 92, 65, 84, 71]
      const barW = (w - 16) / cls.length - 6
      svg.innerHTML =
        vals.map((v, i) => {
          const x = 8 + i * (barW + 6)
          const bh = (v / 100) * (h - 22)
          const y = h - 18 - bh
          return `
            <rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="3"
                  fill="${i === 1 ? 'url(#bgrad)' : 'rgba(148,163,184,0.25)'}"/>
            <text x="${x + barW / 2}" y="${h - 4}" text-anchor="middle"
                  font-size="9" fill="#64748B" font-family="Inter">${cls[i]}</text>
          `
        }).join('') +
        `<defs>
          <linearGradient id="bgrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#A5B4FC"/>
            <stop offset="100%" stop-color="#7C3AED"/>
          </linearGradient>
        </defs>`
    }
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [])

  return (
    <div className="lp-root">
      {/* Animated mesh background */}
      <div className="bg-mesh" />
      <div className="grain" />

      {/* ============================================================
          NAV
          ============================================================ */}
      <header ref={navRef} className="nav">
        <div className="lp-container nav-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1"/>
              </svg>
            </span>
            <span>Teacher Assistant</span>
          </Link>
          <nav className="nav-links">
            <a href="#features">Imkoniyatlar</a>
            <a href="#how">Qanday ishlaydi</a>
            <a href="#pricing">Narxlar</a>
            <a href="#stories">Tajribalar</a>
          </nav>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/login" className="btn-ghost btn" style={{ fontSize: 14, padding: '10px 14px' }}>Kirish</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '10px 16px', fontSize: 14 }}>
              Bepul boshlash
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================
          HERO
          ============================================================ */}
      <section className="hero" id="hero">
        <div className="orb indigo a" style={{ width: 480, height: 480, top: -120, left: -160 }} />
        <div className="orb violet b" style={{ width: 520, height: 520, top: -80, right: -180 }} />
        <div className="orb tg c"    style={{ width: 380, height: 380, bottom: -160, left: '30%', opacity: 0.35 }} />
        <div className="hero-grid" />

        <div className="lp-container hero-inner">
          <div>
            <span className="pill reveal">
              <span className="dot" />
              ✨ AI yordamchi — endi o'zbek tilida
            </span>

            <h1 className="reveal delay-1">
              O'qituvchilar uchun<br/>
              <span className="grad">AI Assistant</span>
            </h1>

            <p className="lead reveal delay-2">
              Bitta savol yozing — to'liq test, dars rejasi yoki yozma topshiriq tayyor bo'ladi.
              DTM standartlariga mos, o'zbek tilida, 30 sekundda.
            </p>

            <div className="cta-row reveal delay-3">
              <Link to="/register" className="btn btn-primary">
                Bepul Boshlash
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
              <a href="#how" className="btn btn-outline">
                Qanday ishlaydi
              </a>
            </div>

            <div className="stat-badges reveal delay-4">
              <div className="stat-badge">
                <span className="ic">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </span>
                <span><strong data-count="2400" data-suffix="+">0</strong> o'qituvchi foydalanmoqda</span>
              </div>
              <div className="stat-badge">
                <span className="ic" style={{ background: 'rgba(16,185,129,0.18)', color: '#6EE7B7' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>
                <span><strong data-count="2" data-suffix=" soat">0</strong> kuniga vaqt tejaydi</span>
              </div>
              <div className="stat-badge">
                <span className="ic" style={{ background: 'rgba(124,58,237,0.18)', color: '#C4B5FD' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </span>
                <span><strong data-count="30" data-suffix=" sek">0</strong> bitta test uchun</span>
              </div>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="hero-visual reveal delay-3">
            <div className="mock-dashboard">
              <div className="dash-bar">
                <div className="d r"/><div className="d y"/><div className="d g"/>
                <div className="url">app.teacher-assistant.uz/dashboard</div>
              </div>
              <div className="dash-body">
                <div className="dash-side">
                  {[
                    <path key="home" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
                    <path key="spark" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>,
                    <><rect key="r1" x="3" y="3" width="7" height="7"/><rect key="r2" x="14" y="3" width="7" height="7"/><rect key="r3" x="14" y="14" width="7" height="7"/><rect key="r4" x="3" y="14" width="7" height="7"/></>,
                    <><line key="l1" x1="18" y1="20" x2="18" y2="10"/><line key="l2" x1="12" y1="20" x2="12" y2="4"/><line key="l3" x1="6" y1="20" x2="6" y2="14"/></>,
                  ].map((path, i) => (
                    <div key={i} className={`item${i === 0 ? ' active' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
                    </div>
                  ))}
                </div>
                <div className="dash-main">
                  <div className="dash-stat-row">
                    {[
                      { lbl: 'Sinflar', val: '12', trend: '↑ 2 yangi' },
                      { lbl: 'Bu oy yaratildi', val: '147', trend: '↑ 23%' },
                      { lbl: 'Kreditlar', val: '186', trend: '/ 220' },
                      { lbl: "Faol o'quvchilar", val: '284', trend: '↑ 12%' },
                    ].map((s) => (
                      <div key={s.lbl} className="dash-stat">
                        <div className="lbl">{s.lbl}</div>
                        <div className="val">{s.val}</div>
                        <div className="trend" style={s.lbl === 'Kreditlar' ? { color: 'var(--lp-muted)' } : undefined}>{s.trend}</div>
                      </div>
                    ))}
                  </div>
                  <div className="dash-chart">
                    <div className="ttl">
                      <span>Oylik faollik</span>
                      <span style={{ color: '#A5B4FC' }}>+34% ↑</span>
                    </div>
                    <svg ref={heroChartRef} className="chart-svg" />
                  </div>
                  <div className="dash-recent">
                    <div className="recent-item">
                      <span className="r-ic" style={{ background: 'rgba(79,70,229,0.18)', color: '#A5B4FC' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      </span>
                      <span className="r-txt">Test yaratildi · <b>Matematika 8A</b></span>
                      <span className="r-time">2 daq</span>
                    </div>
                    <div className="recent-item">
                      <span className="r-ic" style={{ background: 'rgba(16,185,129,0.18)', color: '#6EE7B7' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </span>
                      <span className="r-txt">Dars rejasi · <b>Ona tili 7B</b></span>
                      <span className="r-time">14 daq</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          TRUST STRIP
          ============================================================ */}
      <section className="trust">
        <div className="lp-container trust-inner">
          <div className="trust-label">O'zbekiston bo'ylab ishonib foydalanmoqdalar</div>
          <div className="trust-logos">
            <span>Prezident maktablari</span>
            <span>· IDUM ·</span>
            <span>Xalq ta'limi</span>
            <span>· TATU ·</span>
            <span>Inha University</span>
          </div>
        </div>
      </section>

      {/* ============================================================
          BENTO FEATURES
          ============================================================ */}
      <section className="section" id="features">
        <div className="orb violet b" style={{ width: 380, height: 380, right: -100, top: '10%', opacity: 0.3 }} />
        <div className="lp-container">
          <div className="sec-head reveal">
            <span className="eyebrow">Imkoniyatlar</span>
            <h2 className="section-title">Nima qila olasiz?</h2>
            <p className="section-sub">
              Quyidagi vazifalarni AI o'rniga sizga qilib beradi — siz faqat ko'rib chiqing va sinfga yuboring.
            </p>
          </div>

          <div className="bento">
            {/* LARGE: AI generation */}
            <div className="bento-card b-large reveal">
              <div className="head">
                <div className="ic">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                </div>
                <h3>AI Kontent Generatsiyasi</h3>
              </div>
              <p>Mavzu va sinfni kiriting — AI tayyor o'quv materialini chiqaradi. Test, dars rejasi, mashq yoki insho topshirig'i — qaysisi kerak bo'lsa.</p>
              <div className="bento-typing">
                <div className="line"><span className="k">Mavzu:</span> <span className="v">Fotosintez jarayoni</span></div>
                <div className="line"><span className="k">Sinf:</span> <span className="v">8-sinf, Biologiya</span></div>
                <div className="line"><span className="k">Format:</span> <span className="v">Variantli test, 10 savol</span></div>
                <div className="line"><span className="k">Daraja:</span> <span className="v">O'rta</span></div>
                <div className="line" style={{ color: '#6EE7B7' }}>→ Generatsiya qilinmoqda...<span className="caret"/></div>
              </div>
            </div>

            {/* MED: Quiz */}
            <div className="bento-card b-med reveal delay-1">
              <div className="head">
                <div className="ic">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <h3>Quiz & Testlar</h3>
              </div>
              <div className="quiz-mock body">
                <div className="q">2 + 3 × 4 = ?</div>
                <div className="opt"><span className="r"/>&nbsp;20</div>
                <div className="opt correct"><span className="r"/>&nbsp;14</div>
                <div className="opt"><span className="r"/>&nbsp;24</div>
              </div>
            </div>

            {/* MED: Yozma ish */}
            <div className="bento-card b-med reveal delay-2">
              <div className="head">
                <div className="ic" style={{ background: 'rgba(79,70,229,0.15)', borderColor: 'rgba(79,70,229,0.35)', color: '#A5B4FC' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </div>
                <h3>Yozma ish baholash</h3>
              </div>
              <p style={{ marginBottom: 6 }}>O'quvchining inshosi matnini yuklang — AI grammatika, mantiq va uslubni alohida baholaydi.</p>
              <div className="feedback-mock">
                <div className="fb-row"><span className="fb-lbl">Grammatika</span><span className="fb-bar"><i style={{ width: '78%', background: '#10B981' }}/></span><span className="fb-num">7.8</span></div>
                <div className="fb-row"><span className="fb-lbl">Mantiq</span><span className="fb-bar"><i style={{ width: '88%', background: '#A5B4FC' }}/></span><span className="fb-num">8.8</span></div>
                <div className="fb-row"><span className="fb-lbl">Uslub</span><span className="fb-bar"><i style={{ width: '64%', background: '#C4B5FD' }}/></span><span className="fb-num">6.4</span></div>
              </div>
            </div>

            {/* SMALL: PDF */}
            <div className="bento-card b-small reveal">
              <div className="head">
                <div className="ic">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h3>PDF Export</h3>
              </div>
              <div className="dl-mock">
                <div className="fname">test_8A_matem.pdf</div>
                <div className="prog"><i/></div>
                <div className="meta"><span>1.2 MB</span><span>Tayyor ✓</span></div>
              </div>
            </div>

            {/* SMALL: Audio */}
            <div className="bento-card b-small reveal delay-1">
              <div className="head">
                <div className="ic">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
                </div>
                <h3>Audio Speaking</h3>
              </div>
              <div className="waveform">
                {Array.from({ length: 18 }).map((_, i) => <div key={i} className="bar"/>)}
              </div>
            </div>

            {/* LARGE: Analytics */}
            <div className="bento-card b-large reveal delay-2">
              <div className="head">
                <div className="ic">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                </div>
                <h3>Analytics Dashboard</h3>
              </div>
              <p>Qaysi o'quvchi qaysi mavzuda qiynalayapti, sinf o'rtachasi qanday — bir qarashda ko'rinadigan grafiklar.</p>
              <div className="body">
                <svg ref={analyticsChartRef} className="mini-chart"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
          ============================================================ */}
      <section className="section" id="how">
        <div className="lp-container">
          <div className="sec-head center reveal">
            <span className="eyebrow">Qanday ishlaydi</span>
            <h2 className="section-title">Uch qadamda boshlang</h2>
            <p className="section-sub" style={{ textAlign: 'center' }}>
              Ro'yxatdan o'tishdan birinchi testgacha — bor-yo'g'i 5 daqiqa.
            </p>
          </div>

          <div className="steps">
            <div className="step-card reveal">
              <div className="num">01 / QADAM</div>
              <h3>Ro'yxatdan o'ting</h3>
              <p>Email yoki telefon raqamingiz bilan kiring. Kartochka kerak emas — 12 ta bepul kredit darhol hisobingizga tushadi.</p>
              <div className="step-mock signup">
                <div className="input-mock">aziza.karimova@maktab.uz</div>
                <div className="input-mock">●●●●●●●●●●</div>
                <div className="btn-mock">Hisob yaratish</div>
              </div>
            </div>

            <div className="step-card reveal delay-1">
              <div className="num">02 / QADAM</div>
              <h3>Sinflar qo'shing</h3>
              <p>Sinfingiz nomini yozing va o'quvchilar ro'yxatini Excel'dan yuklang. Yoki bittadan qo'lda kiriting — 1 daqiqa ish.</p>
              <div className="step-mock classes">
                <div className="class-row"><span className="cdot" style={{ background: '#A5B4FC' }}/><span className="cname">8A · Matematika</span><span className="cnum">28</span></div>
                <div className="class-row"><span className="cdot" style={{ background: '#7DD3FC' }}/><span className="cname">9B · Ingliz tili</span><span className="cnum">24</span></div>
                <div className="class-row"><span className="cdot" style={{ background: '#6EE7B7' }}/><span className="cname">7A · Ona tili</span><span className="cnum">26</span></div>
              </div>
            </div>

            <div className="step-card reveal delay-2">
              <div className="num">03 / QADAM</div>
              <h3>Yarating va baholang</h3>
              <p>Mavzu va sinfni tanlang, «Generatsiya» tugmasini bosing. Tayyor materialni ko'rib chiqing va bir tugmada sinfga yuboring.</p>
              <div className="step-mock generate">
                <div className="gen-input">
                  <span className="gen-lbl">Mavzu</span>
                  <span className="gen-val">Fotosintez · 8-sinf</span>
                </div>
                <div className="gen-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Generatsiya
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          PRICING
          ============================================================ */}
      <section className="section" id="pricing">
        <div className="orb indigo a" style={{ width: 400, height: 400, right: 0, top: '20%', opacity: 0.3 }} />
        <div className="lp-container">
          <div className="sec-head center reveal">
            <span className="eyebrow">Narxlar</span>
            <h2 className="section-title">Kreditlar — soddagina</h2>
            <p className="section-sub" style={{ textAlign: 'center' }}>
              Har bir AI generatsiya kredit oladi. Sinflar, o'quvchilar va hisobotlar — cheklovsiz.
            </p>
            <div className="credit-key reveal delay-1">
              <div className="ck-item"><span className="ck-num">3</span><span className="ck-lbl">kredit = <b>10 savolli test</b></span></div>
              <div className="ck-item"><span className="ck-num">5</span><span className="ck-lbl">kredit = <b>to'liq dars rejasi</b></span></div>
              <div className="ck-item"><span className="ck-num">2</span><span className="ck-lbl">kredit = <b>yozma ish baholash</b></span></div>
            </div>
          </div>

          <div className="pricing-grid">
            <div className="price-card free reveal">
              <div className="pname">Bepul Trial</div>
              <div className="pcredit">12 <small>kredit</small></div>
              <div className="ptag">Sinab ko'rish uchun</div>
              <ul>
                <li><span className="ch">✓</span> Asosiy AI funksiyalar</li>
                <li><span className="ch">✓</span> 2 ta sinf</li>
                <li><span className="ch">✓</span> PDF eksport</li>
                <li className="off"><span className="ch">×</span> Audio speaking</li>
                <li className="off"><span className="ch">×</span> Analitika</li>
              </ul>
              <Link to="/register" className="pbtn">Bepul boshlash</Link>
            </div>

            <div className="price-card basic reveal delay-1">
              <div className="pname">Basic</div>
              <div className="pcredit">80 <small>kredit</small></div>
              <div className="ptag">49 000 so'm / oy</div>
              <ul>
                <li><span className="ch">✓</span> Barcha AI funksiyalar</li>
                <li><span className="ch">✓</span> 10 ta sinf</li>
                <li><span className="ch">✓</span> Yozma ish baholash</li>
                <li><span className="ch">✓</span> Email yordami</li>
                <li className="off"><span className="ch">×</span> Premium analitika</li>
              </ul>
              <Link to="/register" className="pbtn">Tanlash</Link>
            </div>

            <div className="price-card pro reveal delay-2">
              <div className="recommended">⭐ Mashhur</div>
              <div className="pname">Pro</div>
              <div className="pcredit">220 <small>kredit</small></div>
              <div className="ptag">119 000 so'm / oy</div>
              <ul>
                <li><span className="ch">✓</span> Cheklovsiz sinflar</li>
                <li><span className="ch">✓</span> Avtomatik bildirishlar</li>
                <li><span className="ch">✓</span> To'liq analitika</li>
                <li><span className="ch">✓</span> Audio speaking</li>
                <li><span className="ch">✓</span> Ustuvor yordam</li>
              </ul>
              <Link to="/register" className="pbtn">Pro ga o'tish</Link>
            </div>

            <div className="price-card premium reveal delay-3">
              <div className="pname">Premium</div>
              <div className="pcredit">520 <small>kredit</small></div>
              <div className="ptag">249 000 so'm / oy</div>
              <ul>
                <li><span className="ch">✓</span> Hammasi Pro dan</li>
                <li><span className="ch">✓</span> Maktab darajasidagi hisobot</li>
                <li><span className="ch">✓</span> API kirish</li>
                <li><span className="ch">✓</span> Maxsus integratsiyalar</li>
                <li><span className="ch">✓</span> Shaxsiy menejer</li>
              </ul>
              <Link to="/register" className="pbtn">Maktab uchun</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SOCIAL PROOF
          ============================================================ */}
      <section className="section" id="stories">
        <div className="lp-container">
          <div className="sec-head reveal">
            <span className="eyebrow">Tajribalar</span>
            <h2 className="section-title">O'qituvchilar nima deyishadi</h2>
          </div>

          <div className="testi-grid" style={{ marginBottom: 48 }}>
            <div className="testi reveal">
              <div className="stars">★★★★★</div>
              <p className="quote">"Avval bitta test tayyorlash kechqurun 2 soat ketardi. Endi bir necha daqiqada tayyor bo'ladi. Vaqtni bolalarimga sarflayman."</p>
              <div className="who">
                <div className="avatar">A</div>
                <div><div className="name">Aziza Karimova</div><div className="role">Ingliz tili · 11-maktab, Toshkent</div></div>
              </div>
            </div>
            <div className="testi reveal delay-1">
              <div className="stars">★★★★★</div>
              <p className="quote">"Sinf statistikasini darhol ko'rish — bu juda muhim. Qaysi o'quvchi qaysi mavzuda qiynalayotganini bilib turaman, individual yondashuv qilaman."</p>
              <div className="who">
                <div className="avatar" style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>B</div>
                <div><div className="name">Bekzod Otaboyev</div><div className="role">Matematika · IDUM, Samarqand</div></div>
              </div>
            </div>
            <div className="testi reveal delay-2">
              <div className="stars">★★★★★</div>
              <p className="quote">"Yozma ishlarni tekshirish — eng zerikarli ish edi. Endi AI o'zi tahlil qilib beradi, men faqat ko'rib chiqaman. Vaqt tejash — minimum 70%."</p>
              <div className="who">
                <div className="avatar" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>N</div>
                <div><div className="name">Nodira Yusupova</div><div className="role">Ona tili · Prezident maktabi, Buxoro</div></div>
              </div>
            </div>
          </div>

          <div className="stats-bar reveal">
            <div className="stat-item"><div className="val"><span data-count="2400" data-suffix="+">0</span></div><div className="lbl">Faol o'qituvchilar</div></div>
            <div className="stat-item"><div className="val"><span data-count="184" data-suffix="K+">0</span></div><div className="lbl">Yaratilgan kontent</div></div>
            <div className="stat-item"><div className="val"><span data-count="47">0</span></div><div className="lbl">Shahar va tumanlar</div></div>
            <div className="stat-item"><div className="val"><span data-count="98" data-suffix="%">0</span></div><div className="lbl">Qoniqish darajasi</div></div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
          ============================================================ */}
      <section className="section" style={{ padding: '80px 0 120px' }}>
        <div className="lp-container">
          <div className="reveal" style={{
            position: 'relative', padding: '64px 48px', borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(79,70,229,0.18), rgba(124,58,237,0.12))',
            border: '1px solid rgba(124,58,237,0.35)', overflow: 'hidden', textAlign: 'center',
          }}>
            <div className="orb violet a" style={{ width: 300, height: 300, top: -100, left: -50, opacity: 0.5 }} />
            <div className="orb indigo b" style={{ width: 300, height: 300, bottom: -100, right: -50, opacity: 0.5 }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 'clamp(36px,4.5vw,56px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 18px' }}>
                Bugun boshlang —<br/>
                <span style={{ background: 'linear-gradient(120deg,#A5B4FC,#C4B5FD)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                  12 ta bepul kredit kutmoqda
                </span>
              </h2>
              <p style={{ fontSize: 17, color: 'var(--lp-muted)', maxWidth: 540, margin: '0 auto 32px', lineHeight: 1.55 }}>
                Kartochka kerak emas. 30 sekundda hisob oching va birinchi testingizni yarating.
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary">
                  Bepul boshlash
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </Link>
                <a href="#features" className="btn btn-outline">
                  Imkoniyatlarni ko'rish
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="footer-grid">
            <div>
              <div className="brand">
                <span className="brand-mark">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1"/>
                  </svg>
                </span>
                <span>Teacher Assistant</span>
              </div>
              <p className="tagline">O'zbek o'qituvchilari uchun AI yordamchi. Dars rejalari, testlar, baholar — bir joyda.</p>
            </div>
            <div className="col">
              <h5>Mahsulot</h5>
              <a href="#features">Imkoniyatlar</a>
              <a href="#pricing">Narxlar</a>
              <Link to="/app/generator">AI Generator</Link>
            </div>
            <div className="col">
              <h5>Yordam</h5>
              <Link to="/hujjatlar">Hujjatlar</Link>
              <Link to="/video-darslar">Video darslar</Link>
              <Link to="/yordam">Yordam markazi</Link>
              <Link to="/aloqa">Aloqa</Link>
            </div>
            <div className="col">
              <h5>Kompaniya</h5>
              <Link to="/biz-haqimizda">Biz haqimizda</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/maxfiylik">Maxfiylik</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Teacher Assistant. Toshkent, O'zbekiston.</span>
            <span style={{ display: 'flex', gap: 18 }}>
              <Link to="/maxfiylik" style={{ color: 'var(--lp-dim)' }}>Foydalanish shartlari</Link>
              <Link to="/maxfiylik" style={{ color: 'var(--lp-dim)' }}>Maxfiylik</Link>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

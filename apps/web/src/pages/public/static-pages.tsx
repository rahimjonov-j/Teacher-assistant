import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

function StaticLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0d1117]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-black tracking-tight text-white">Teacher Assistant</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Bosh sahifa
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-white/8 bg-gradient-to-b from-white/[0.03] to-transparent px-5 py-14">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-3 max-w-xl text-base leading-relaxed text-white/50">{subtitle}</p> : null}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-5 py-12">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/8 px-5 py-8 text-center text-sm text-white/30">
        © 2026 Teacher Assistant. Toshkent, O'zbekiston.
      </footer>
    </div>
  )
}

/* ─────────────────────────────────────────────
   HUJJATLAR
───────────────────────────────────────────── */
export function DocsPage() {
  const sections = [
    {
      icon: Sparkles,
      title: 'Boshlash',
      items: [
        "Teacher Assistant platformasi — O'zbekiston o'qituvchilari uchun AI yordamchi.",
        "Ro'yxatdan o'tib, dars rejasi, test va writing tahlili yaratishni boshlang.",
        'Har bir generator uchun kredit sarflanadi — tariflardan birini tanlang.',
      ],
    },
    {
      icon: BookOpen,
      title: 'Test yaratish',
      items: [
        'Mavzu yoki dars maqsadini kiriting.',
        "AI avtomatik ko'p tanlovli savollar generatsiya qiladi.",
        "Natijalari Messenger bo'limida saqlanadi va PDF eksport qilinadi.",
      ],
    },
    {
      icon: CheckCircle2,
      title: 'Dars rejasi',
      items: [
        'Mavzu yoki standartni kiriting — AI vaqt taqsimoti bilan reja tuzadi.',
        'Dars bosqichlari: kirish, asosiy qism, mustahkamlash.',
        "PDF ko'rinishida saqlash va chop etish imkoniyati mavjud.",
      ],
    },
    {
      icon: MessageSquare,
      title: 'Writing tahlili',
      items: [
        "O'quvchi matnini yoki topshiriqni kiriting.",
        "AI grammatika, mazmun va uslub bo'yicha batafsil feedback beradi.",
        'Har bir xatoga izoh va yaxshilash tavsiyasi ilova qilinadi.',
      ],
    },
  ]

  return (
    <StaticLayout title="Hujjatlar" subtitle="Teacher Assistant platformasidan foydalanish bo'yicha to'liq qo'llanma.">
      <div className="grid gap-6 sm:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
                <s.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-base font-bold text-white">{s.title}</h2>
            </div>
            <ul className="space-y-2.5">
              {s.items.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-white/55">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/60" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/8 p-6">
        <h3 className="mb-2 font-bold text-white">Qo'shimcha savol bormi?</h3>
        <p className="text-sm text-white/50">
          Yordam markazi yoki aloqa bo'limi orqali murojaat qiling.{' '}
          <Link to="/yordam" className="font-semibold text-indigo-400 hover:underline">Yordam markaziga o'tish →</Link>
        </p>
      </div>
    </StaticLayout>
  )
}

/* ─────────────────────────────────────────────
   VIDEO DARSLAR
───────────────────────────────────────────── */
export function VideoLessonsPage() {
  const planned = [
    { title: "Teacher Assistant'ga kirish va sozlash", duration: '5 daqiqa' },
    { title: "AI bilan test yaratish — amaliy qo'llanma", duration: '8 daqiqa' },
    { title: 'Dars rejasi generatori', duration: '6 daqiqa' },
    { title: 'Writing tahlili va feedback', duration: '7 daqiqa' },
    { title: 'Speaking savollarini tayyorlash', duration: '5 daqiqa' },
    { title: 'PDF eksport va saqlash', duration: '4 daqiqa' },
  ]

  return (
    <StaticLayout title="Video darslar" subtitle="Platformadan to'g'ri foydalanishni o'rgatuvchi qisqa video qo'llanmalar.">
      <div className="mb-8 rounded-2xl border border-violet-500/20 bg-violet-500/8 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            <PlayCircle className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <div className="font-bold text-white">Tez orada</div>
            <div className="text-sm text-white/50">Video darslar tayyorlanmoqda. Quyida rejalashtirilgan mavzular.</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {planned.map((v, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-bold text-white/30">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <div className="text-sm font-semibold text-white/80">{v.title}</div>
                <div className="text-xs text-white/35">{v.duration}</div>
              </div>
            </div>
            <span className="rounded-lg bg-white/5 px-3 py-1 text-xs font-semibold text-white/30">Breve orada</span>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-white/40">
          Bildirishnoma olish uchun{' '}
          <Link to="/aloqa" className="font-semibold text-violet-400 hover:underline">biz bilan bog'laning</Link>
          .
        </p>
      </div>
    </StaticLayout>
  )
}

/* ─────────────────────────────────────────────
   YORDAM MARKAZI
───────────────────────────────────────────── */
export function HelpPage() {
  const faqs = [
    {
      q: 'Kredit nima va qanday ishlaydi?',
      a: "Har bir AI generatsiya (test, dars rejasi, writing tahlili) bir kredit sarflaydi. Kreditlar tanlangan tarif orqali to'ldiriladi.",
    },
    {
      q: 'Parolni unutdim, nima qilaman?',
      a: 'Login sahifasidagi "Parolni tiklash" havolasini bosib, emailingizga tiklash havolasi yuboring.',
    },
    {
      q: 'PDF eksport qanday ishlaydi?',
      a: 'Yaratilgan materialning detail sahifasida "PDF eksport" tugmasini bosing. Fayl avtomatik yuklab olinadi.',
    },
    {
      q: "Tarif o'zgartirish mumkinmi?",
      a: 'Ha, «To‘lov» bo‘limidan istalgan vaqtda tarif yangilash yoki o‘zgartirish mumkin.',
    },
    {
      q: 'Admin panelga qanday kirish mumkin?',
      a: "Admin huquqi berilgan akkaunt orqali oddiy login sahifasidan kiring — tizim avtomatik admin paneliga yo'naltiradi.",
    },
    {
      q: "Messenger bo'limidagi materiallar qancha vaqt saqlanadi?",
      a: "Barcha yaratilgan materiallar akkauntingizda doimiy saqlanadi. Istagan vaqtda ko'rish va PDF eksport qilish mumkin.",
    },
  ]

  return (
    <StaticLayout title="Yordam markazi" subtitle="Tez-tez so'raladigan savollar va javoblar.">
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
            <div className="mb-2 flex items-start gap-3">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">{faq.q}</h3>
            </div>
            <p className="pl-7 text-sm leading-relaxed text-white/55">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-center">
        <h3 className="mb-1 font-bold text-white">Javob topilmadimi?</h3>
        <p className="mb-4 text-sm text-white/50">Murojaat markazimizga yozing, 24 soat ichida javob beramiz.</p>
        <Link
          to="/aloqa"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <Mail className="h-4 w-4" />
          Murojaat yuborish
        </Link>
      </div>
    </StaticLayout>
  )
}

/* ─────────────────────────────────────────────
   ALOQA
───────────────────────────────────────────── */
export function ContactPage() {
  return (
    <StaticLayout title="Aloqa" subtitle="Savol, taklif yoki xatolik haqida xabar bering — tez javob beramiz.">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          {[
            { icon: Mail, label: 'Email', value: 'support@teacherass.uz', href: 'mailto:support@teacherass.uz' },
            { icon: MessageSquare, label: 'Telegram', value: '@teacherass_support', href: 'https://t.me/teacherass_support' },
            { icon: Phone, label: 'Telefon', value: '+998 90 000 00 00', href: 'tel:+998900000000' },
            { icon: MapPin, label: 'Manzil', value: 'Toshkent, O\'zbekiston', href: undefined },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15">
                <c.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-white/30">{c.label}</div>
                {c.href ? (
                  <a href={c.href} className="text-sm font-semibold text-white/80 hover:text-white">{c.value}</a>
                ) : (
                  <div className="text-sm font-semibold text-white/80">{c.value}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
          <h3 className="mb-4 font-bold text-white">Xabar yuborish</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Ismingiz"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15"
            />
            <input
              type="email"
              placeholder="Email manzilingiz"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15"
            />
            <textarea
              rows={4}
              placeholder="Xabaringiz..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 resize-none"
            />
            <button className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
              Yuborish
            </button>
          </div>
          <p className="mt-3 text-xs text-white/30 text-center">24 soat ichida javob beramiz</p>
        </div>
      </div>
    </StaticLayout>
  )
}

/* ─────────────────────────────────────────────
   BIZ HAQIMIZDA
───────────────────────────────────────────── */
export function AboutPage() {
  const stats = [
    { value: '500+', label: "Faol o'qituvchi" },
    { value: '10 000+', label: 'Yaratilgan material' },
    { value: '4', label: 'AI funksiya' },
    { value: '2024', label: 'Tashkil etilgan' },
  ]

  return (
    <StaticLayout title="Biz haqimizda" subtitle="O'zbekiston o'qituvchilarini AI texnologiyasi bilan qo'llab-quvvatlash missiyamiz.">
      <div className="space-y-8">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-7">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
              <GraduationCap className="h-5 w-5 text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Missiyamiz</h2>
          </div>
          <p className="text-sm leading-relaxed text-white/55">
            Teacher Assistant — O'zbekiston o'qituvchilarining kundalik ishlarini osonlashtirish uchun yaratilgan AI platformasi.
            Dars rejasini tuzish, test yaratish, writing tahlili va speaking savollarini tayyorlash uchun suniy intellektdan foydalanib, vaqtni tejang va sifatli ta'lim bering.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-center">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="mt-1 text-xs text-white/40">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-7">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
              <Users className="h-5 w-5 text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Nima uchun Teacher Assistant?</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "O'zbek tilidagi birinchi ta'lim AI platformasi",
              "Vaqtni tejovchi avtomatik material yaratish",
              "Professional PDF eksport imkoniyati",
              "Har oylik yangi funksiyalar va yaxshilanishlar",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-white/55">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </StaticLayout>
  )
}

/* ─────────────────────────────────────────────
   BLOG
───────────────────────────────────────────── */
export function BlogPage() {
  const planned = [
    { category: "Ta'lim", title: "AI o'qituvchi ishini qanday o'zgartirmoqda", date: 'Yaqinda' },
    { category: 'Amaliyot', title: "Samarali dars rejasi tuzish: 5 ta maslahat", date: 'Yaqinda' },
    { category: 'Platforma', title: "Teacher Assistant 2.0 — yangi funksiyalar", date: 'Yaqinda' },
    { category: 'Interview', title: "O'qituvchilar platformadan qanday foydalanmoqda", date: 'Yaqinda' },
  ]

  return (
    <StaticLayout title="Blog" subtitle="Ta'lim, AI va platforma yangiliklari haqida maqolalar.">
      <div className="mb-8 rounded-2xl border border-violet-500/20 bg-violet-500/8 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            <BookOpen className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <div className="font-bold text-white">Tez orada</div>
            <div className="text-sm text-white/50">Blog maqolalar tayyorlanmoqda. Rejalashtirilgan mavzular:</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {planned.map((post, i) => (
          <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
            <span className="inline-block rounded-lg bg-indigo-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              {post.category}
            </span>
            <h3 className="mt-3 text-sm font-bold leading-snug text-white/80">{post.title}</h3>
            <p className="mt-2 text-xs text-white/30">{post.date}</p>
          </div>
        ))}
      </div>
    </StaticLayout>
  )
}

/* ─────────────────────────────────────────────
   MAXFIYLIK
───────────────────────────────────────────── */
export function PrivacyPage() {
  const sections = [
    {
      title: "Qanday ma\'lumotlar yig\'iladi",
      content:
        "Ro\'yxatdan o\'tish va platformadan foydalanish jarayonida email manzil, ism, maktab va sinf yo\'nalishi kabi ma\'lumotlar to\'planadi. Yaratilgan materiallar akkauntingizda saqlanadi.",
    },
    {
      title: "Ma\'lumotlar qanday ishlatiladi",
      content:
        "Ma\'lumotlar faqat platformaning asosiy funksiyalari uchun ishlatiladi: akkauntni boshqarish, material yaratish tarixi va obuna holati. Uchinchi shaxslarga sotilmaydi.",
    },
    {
      title: "Ma\'lumotlar xavfsizligi",
      content:
        "Barcha ma\'lumotlar shifrlangan holda Supabase xavfsiz serverlarida saqlanadi. Parollar hashlangan ko\'rinishda saqlanadi va hech kim tomonidan o\'qilmaydi.",
    },
    {
      title: 'Cookie va analytics',
      content:
        'Platforma minimal cookie va localStorage dan foydalanadi: til sozlamasi va sessiya uchun. Tashqi analytics vositalaridan foydalanilmaydi.',
    },
    {
      title: "Ma\'lumotlarni o\'chirish",
      content:
        "Akkauntingizni o\'chirish so\'rovini support@teacherass.uz manziliga yuboring. 7 ish kuni ichida barcha ma\'lumotlaringiz o\'chiriladi.",
    },
    {
      title: "Bog\'lanish",
      content:
        'Maxfiylik siyosatiga oid savollar uchun support@teacherass.uz manziliga murojaat qiling.',
    },
  ]

  return (
    <StaticLayout title="Maxfiylik siyosati" subtitle="Platformamiz foydalanuvchi ma'lumotlarini qanday himoya qilishi haqida.">
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-5 py-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
        <p className="text-sm text-white/60">
          So'nggi yangilanish: <span className="font-semibold text-white/80">Yanvar 2026</span>
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((s, i) => (
          <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
            <h2 className="mb-3 text-sm font-bold text-white">
              {i + 1}. {s.title}
            </h2>
            <p className="text-sm leading-relaxed text-white/55">{s.content}</p>
          </div>
        ))}
      </div>
    </StaticLayout>
  )
}

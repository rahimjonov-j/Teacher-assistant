export function getUzToastError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback
  }

  const message = error.message

  const mappings: Array<[string, string]> = [
    ['Invalid login credentials', "Login yoki parol noto'g'ri."],
    ['Email not confirmed', 'Email tasdiqlanmagan.'],
    ['User already registered', 'Bu email allaqachon ro\'yxatdan o\'tgan.'],
    ['For security purposes, you can only request this after', 'Xavfsizlik sabab birozdan keyin qayta urinib ko\'ring.'],
    ['Password should be at least 6 characters', 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak.'],
    ['New password should be different from the old password', 'Yangi parol avvalgisidan farq qilishi kerak.'],
    ['Token has expired or is invalid', 'Havola eskirgan yoki noto\'g\'ri.'],
    ['Request failed.', 'So\'rov bajarilmadi.'],
    ['Class limit reached', "Sinf limiti tugagan. Ko'proq sinf uchun tarifni yangilang."],
    ['Class not found', 'Sinf topilmadi.'],
    ['Student not found', "O'quvchi topilmadi."],
    ['Unable to regenerate password', "Parolni yangilab bo'lmadi."],
    ['Unable to add student', "O'quvchini qo'shib bo'lmadi."],
    ['Unable to create class', "Sinf yaratib bo'lmadi."],
    ['Unable to send assignment', "Topshiriqni yuborib bo'lmadi."],
    ['Unable to generate assignment', "AI orqali topshiriq yaratib bo'lmadi."],
    ['Unable to review submission', "Ishni tekshirib bo'lmadi."],
    ['Unable to start attempt', "Urinishni boshlab bo'lmadi."],
    ['Unable to submit assignment', "Topshiriqni yuborib bo'lmadi."],
    ['Deadline has passed', 'Deadline tugagan.'],
    ['You already used all attempts', 'Barcha urinishlar ishlatib bo\'lingan.'],
    ['Time is over', 'Vaqt tugadi.'],
    ['Assignment not found', 'Topshiriq topilmadi.'],
    ['Attempt not found', 'Urinish topilmadi.'],
    ['Invalid student login or password', "O'quvchi login yoki paroli noto'g'ri."],
    ['Student account is not active', 'O\'quvchi akkaunti faol emas.'],
    ['Invalid student session', 'Student sessiyasi yaroqsiz.'],
    ['Student session expired', 'Student sessiyasi tugagan.'],
    ['Unable to create Telegram linking code', 'Telegram ulanish kodi yaratilmadi.'],
    ['Unable to link Telegram account', 'Telegram akkauntini ulab bo\'lmadi.'],
    ['Link code not found', 'Ulanish kodi topilmadi.'],
    ['Link code has expired', 'Ulanish kodi eskirgan.'],
    ['Unable to update teacher profile', "Profilni saqlab bo'lmadi."],
    ['Teacher profile not found', 'Profil topilmadi.'],
    ['No active subscription found for this teacher', 'Faol obuna topilmadi.'],
    ['Not enough credits remaining', 'Kredit yetarli emas.'],
    ['OpenAI returned an empty response.', 'AI javob qaytarmadi.'],
    ['OpenAI returned an empty Telegram reply.', 'AI Telegram uchun javob qaytarmadi.'],
    ['OpenAI returned an empty quiz.', 'AI bo\'sh test qaytardi.'],
    ['OpenAI returned a quiz format that could not be parsed.', 'AI qaytargan test formatini o\'qib bo\'lmadi.'],
    ['OpenAI returned an invalid quiz.', 'AI yaroqsiz test qaytardi.'],
    ['OpenAI did not return usable quiz questions.', 'AI ishlatib bo\'ladigan savollar qaytarmadi.'],
    ['Unable to attach exported PDF.', 'PDF faylni biriktirib bo\'lmadi.'],
    ['Unable to upload exported PDF', 'PDF faylni yuklab bo\'lmadi.'],
    ['Unable to prepare PDF storage bucket', 'PDF saqlash joyini tayyorlab bo\'lmadi.'],
    ['Unable to publish PDF storage bucket', 'PDF saqlash joyini sozlab bo\'lmadi.'],
    ['Generated content not found', 'Kontent topilmadi.'],
    ['Class database tables are not created yet', "Class bazasi to'liq tayyor emas. Migrationni ishga tushirish kerak."],
  ]

  const matched = mappings.find(([pattern]) => message.includes(pattern))
  return matched?.[1] ?? fallback
}

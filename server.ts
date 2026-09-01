import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const ANALYSIS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'خلاصه کوتاه، بیطرفانه و منصفانه از ماجرا در یک یا دو جمله',
    },
    mainEvent: {
      type: Type.STRING,
      description: 'اتفاق اصلی و ریشه تنش بدون پیش‌داوری',
    },
    userEmotion: {
      type: Type.STRING,
      description: 'چیزی که احتمالاً کاربر احساس کرده است (با استفاده از عباراتی مثل به نظر می‌رسد یا ممکن است)',
    },
    possibleOtherPerspective: {
      type: Type.STRING,
      description: 'چیزی که ممکن است طرف مقابل برداشت کرده باشد صرفاً به عنوان یک احتمال محترمانه',
    },
    trigger: {
      type: Type.STRING,
      description: 'جرقه یا رویداد محرک اولیه که آغازگر دلخوری شد',
    },
    escalationSteps: {
      type: Type.ARRAY,
      description: 'تایم‌لاین ۴ مرحله‌ای تشدید دعوا (۱: اتفاق، ۲: برداشت، ۳: واکنش، ۴: تشدید دعوا)',
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.INTEGER },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['step', 'title', 'description'],
      },
    },
    userBehavior: {
      type: Type.OBJECT,
      description: 'بررسی منصفانه رفتار کاربر در سه بخش',
      properties: {
        understandable: {
          type: Type.STRING,
          description: 'بخش قابل درک و طبیعی از نیاز یا رفتار کاربر',
        },
        improvable: {
          type: Type.STRING,
          description: 'بخشی از رفتار یا نحوه بیان که قابل بهبود است',
        },
        escalationRisk: {
          type: Type.STRING,
          description: 'رفتار یا واکنشی که ممکن است باعث تدافعی شدن یا تشدید بحث شده باشد',
        },
      },
      required: ['understandable', 'improvable', 'escalationRisk'],
    },
    otherBehavior: {
      type: Type.OBJECT,
      description: 'بررسی منصفانه رفتار طرف مقابل در سه بخش',
      properties: {
        understandable: {
          type: Type.STRING,
          description: 'بخش قابل درک از شرایط، فشارها یا نیازهای طرف مقابل',
        },
        improvable: {
          type: Type.STRING,
          description: 'رفتاری از طرف مقابل که می‌توانست محترمانه‌تر یا بهتر باشد',
        },
        escalationRisk: {
          type: Type.STRING,
          description: 'رفتار یا پاسخی از طرف مقابل که باعث سوءتفاهم یا تشدید تنش شده است',
        },
      },
      required: ['understandable', 'improvable', 'escalationRisk'],
    },
    commonNeed: {
      type: Type.STRING,
      description: 'نیاز عاطفی، احترامی یا انسانی مشترک هر دو طرف در پس این اختلاف',
    },
    suggestedAction: {
      type: Type.STRING,
      description: 'توصیه و راهکار عملی، کوتاه و آرامش‌بخش برای شروع گفت‌وگو و کاهش تنش',
    },
    suggestedResponses: {
      type: Type.OBJECT,
      description: 'پیشنهاد پیام در ۵ لحن مختلف برای باز کردن باب گفت‌وگوی سالم',
      properties: {
        calm: { type: Type.STRING, description: 'لحن متین، آرام و بدون تنش' },
        intimate: { type: Type.STRING, description: 'لحن صمیمی، با محبت و آشتی‌جویانه' },
        direct: { type: Type.STRING, description: 'لحن مستقیم، شفاف، بدون سرزنش و مشخص' },
        emotional: { type: Type.STRING, description: 'لحن احساسی، آسیب‌پذیر و صادقانه' },
        friendly: { type: Type.STRING, description: 'لحن سبک، دوستانه و ملایم' },
      },
      required: ['calm', 'intimate', 'direct', 'emotional', 'friendly'],
    },
  },
  required: [
    'summary',
    'mainEvent',
    'userEmotion',
    'possibleOtherPerspective',
    'trigger',
    'escalationSteps',
    'userBehavior',
    'otherBehavior',
    'commonNeed',
    'suggestedAction',
    'suggestedResponses',
  ],
};

const SUGGEST_REPLIES_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    replies: {
      type: Type.OBJECT,
      properties: {
        calm: { type: Type.STRING, description: 'پیام با لحن آرام، متین و بدون تنش' },
        intimate: { type: Type.STRING, description: 'پیام با لحن گرم، صمیمی و محبت‌آمیز' },
        direct: { type: Type.STRING, description: 'پیام با لحن واضح، صریح و محترمانه' },
        emotional: { type: Type.STRING, description: 'پیام با لحن احساسی، صادقانه و آسیب‌پذیر بدون سرزنش' },
        friendly: { type: Type.STRING, description: 'پیام با لحن خودمانی، سبک و ساده' },
      },
      required: ['calm', 'intimate', 'direct', 'emotional', 'friendly'],
    },
  },
  required: ['replies'],
};

const REWRITE_REPLY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    message: {
      type: Type.STRING,
      description: 'متن نهایی بازنویسی شده بر اساس درخواست کاربر',
    },
  },
  required: ['message'],
};

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Main Gemini Conflict Analysis Endpoint
  app.post('/api/analyze', async (req: Request, res: Response): Promise<void> => {
    try {
      const { story, category, emotion, gender } = req.body;

      if (!story || typeof story !== 'string' || story.trim().length < 20) {
        res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'لطفاً شرح ماجرا را حداقل در ۲۰ کاراکتر وارد کنید.',
        });
        return;
      }

      // Check max length limit (safety limit)
      if (story.trim().length > 3500) {
        res.status(400).json({
          error: 'TEXT_TOO_LONG',
          message: 'متنت خیلی طولانیه. لطفاً کمی خلاصه‌ترش کن تا بهتر بررسیش کنیم 🤍',
        });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is missing in server environment.');
        res.status(500).json({
          error: 'API_KEY_MISSING',
          message: 'کلید ارتباط با هوش مصنوعی تنظیم نشده است.',
        });
        return;
      }

      const ai = getGeminiClient();

      const genderLabel =
        gender === 'female'
          ? 'دختر (خانم)'
          : gender === 'male'
          ? 'پسر (آقا)'
          : 'مشخص نشده';

      const systemInstruction = `تو یک میانجی بی‌طرف و مشاور همدل برای حل اختلافات انسانی هستی.
هدف تو پیدا کردن مقصر نیست.
هدف تو کمک به کاربر برای فهمیدن احساسات، نیازها، سوءتفاهم‌ها و عوامل تشدیدکننده اختلاف است.

قوانین:
1. هیچ‌وقت بدون شواهد کسی را مقصر قطعی اعلام نکن.
2. طرف هیچ‌کدام را نگیر.
3. بین «واقعیت گفته‌شده توسط کاربر» و «برداشت احتمالی» تفاوت قائل شو.
4. درباره احساسات از عباراتی مثل «به نظر می‌رسد» و «ممکن است» استفاده کن.
5. دیدگاه طرف مقابل را فقط به عنوان یک احتمال بیان کن.
6. اگر اطلاعات کافی نیست، حدس قطعی نزن.
7. راهکارهای عملی و ساده پیشنهاد بده.
8. هدف، کاهش تنش و شروع گفت‌وگوی سالم است.
9. از سرزنش، تحقیر یا تحریک کاربر خودداری کن.
10. اگر نشانه‌ای از خشونت، تهدید یا خطر فوری وجود دارد، اولویت را روی امنیت و فاصله گرفتن از موقعیت خطرناک قرار بده.
11. جنسیت کاربر را در تنظیم دقیق لحن پیام‌های پیشنهادی (از جهت طبیعی بودن ادبیات فارسی، حس همدلی و پویایی‌های روان‌شناختی رابطه) لحاظ کن؛ به طوری که جملات پیشنهادی کاملاً طبیعی و از زبان گوینده به طرف مقابل باشند بدون افتادن در کلیشه‌های منفی.

فقط و فقط یک JSON معتبر مطابق با ساختار درخواست‌شده بازگردان. از نوشتن هرگونه تگ مارک‌داون یا توضیحات خارج از JSON اکیداً خودداری کن.`;

      const userPrompt = `اطلاعات کاربر:

داستان ماجرا:
${story.trim()}

جنسیت کاربر (گوینده داستان):
${genderLabel}

موضوع:
${category || 'مشخص نشده'}

احساس فعلی:
${emotion || 'مشخص نشده'}

لطفاً این ماجرا را با دقت، همدلی، توجه به پویایی‌های رابطه و بی‌طرفی کامل تحلیل کن و نتیجه را در قالب ساختار JSON مشخص‌شده بازگردان.`;

      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash'];
      let responseText: string | undefined;
      let lastModelError: any = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: ANALYSIS_RESPONSE_SCHEMA,
              temperature: 0.7,
            },
          });
          if (response.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          lastModelError = err;
          console.warn(`Model ${modelName} encountered an issue (${err?.status || err?.message}), attempting next model...`);
        }
      }

      if (!responseText) {
        throw lastModelError || new Error('Empty response from Gemini API.');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(responseText.trim());
      } catch (parseErr) {
        console.error('Failed to parse Gemini response as JSON:', parseErr, responseText);
        throw new Error('Invalid JSON format received from model.');
      }

      res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error('Error during Gemini conflict analysis:', error);
      res.status(500).json({
        error: 'ANALYSIS_FAILED',
        message: 'نتونستم این بار تحلیلش کنم 🤍 یه مشکل موقت پیش اومده. دوباره امتحان کن.',
      });
    }
  });

  // Suggest Replies Endpoint (Step 4: "چی جواب بدم؟")
  app.post('/api/suggest-replies', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        story,
        category,
        emotion,
        gender,
        summary,
        trigger,
        commonNeed,
        userEmotion,
        possibleOtherPerspective,
        suggestedAction,
        tone,
      } = req.body;

      const storyContent = story || summary || '';
      if (!storyContent || typeof storyContent !== 'string') {
        res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'اطلاعات ماجرا برای ساخت پاسخ یافت نشد.',
        });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error: 'API_KEY_MISSING',
          message: 'کلید ارتباط با هوش مصنوعی تنظیم نشده است.',
        });
        return;
      }

      const ai = getGeminiClient();

      const genderLabel =
        gender === 'female'
          ? 'دختر (خانم)'
          : gender === 'male'
          ? 'پسر (آقا)'
          : 'مشخص نشده';

      const systemInstruction = `تو یک نویسنده پیام‌های متنی همدلانه و بسیار طبیعی برای انسان‌ها در موقعیت‌های دلخوری و اختلاف هستی.
هدف تو نوشتن پیام‌هایی است که کاربر واقعاً بتواند آن‌ها را برای طرف مقابل ارسال کند تا تنش کم شود و گفت‌وگوی سالم شروع شود.

قوانین مهم لحن و نگارش:
1. پیام‌ها باید کاملاً طبیعی، روان و محاوره‌ای باشند؛ دقیقاً مثل پیامی که یک انسان در تلگرام یا واتساپ برای دیگری می‌فرستد.
2. از ادبیات رسمی، کتابی، روانشناختی و رباتی (مثل «من عمیقاً از رفتار اخیر شما متأثر شده‌ام» یا «بیایید ارتباط مؤثری برقرار کنیم») اکیداً خودداری کن.
3. طرف مقابل را سرزنش یا متهم نکن و هیچ توهینی به کار نبر.
4. احساس واقعی کاربر را بی‌اهمیت یا تحقیر نکن.
5. از عذرخواهی یا اعتراف ساختگی به کارهایی که رخ نداده پرهیز کن.
6. پیام‌ها کوتاه، خوش‌خوان و مناسب برای ارسال در پیام‌رسان‌ها باشند.
7. هدف اصلی: کاهش تنش، ایجاد احساس امنیت عاطفی و باز کردن راه یک گفت‌وگوی آرام و واقعی.

پنج لحن مشخص:
1. آرام (calm): متین، آرام، بدون پرخاش یا دفاع، تمرکز بر درک متقابل و آرام کردن فضا.
2. صمیمی (intimate): گرم، محبت‌آمیز، یادآوری ارزش رابطه و ابراز علاقه.
3. مستقیم (direct): شفاف، صریح، بدون سرزنش، روشن و محترمانه.
4. احساسی (emotional): بیان احساسات و آسیب‌پذیری قلبی کاربر بدون متهم کردن طرف مقابل.
5. دوستانه (friendly): خودمانی، سبک، ساده، ملایم و صمیمی.

فقط و فقط یک JSON معتبر بازگردان.`;

      const userPrompt = `اطلاعات زمینه اختلاف:
- شرح ماجرا: ${storyContent}
- خلاصه تحلیل: ${summary || 'مشخص نشده'}
- جرقه اولیه دلخوری: ${trigger || 'مشخص نشده'}
- احساس کاربر: ${emotion || userEmotion || 'مشخص نشده'}
- دیدگاه احتمالی طرف مقابل: ${possibleOtherPerspective || 'مشخص نشده'}
- نیاز مشترک: ${commonNeed || 'مشخص نشده'}
- پیشنهاد راهکار: ${suggestedAction || 'مشخص نشده'}
- جنسیت گوینده: ${genderLabel}
${tone ? `- لطفاً به‌طور ویژه روی تولید مجدد پیام برای لحن «${tone}» تمرکز کن.` : ''}

لطفاً برای هر یک از ۵ لحن (calm, intimate, direct, emotional, friendly) یک پیام فارسی روان و کاملاً انسانی تولید کن و در قالب ساختار JSON بازگردان.`;

      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash'];
      let responseText: string | undefined;
      let lastModelError: any = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: SUGGEST_REPLIES_SCHEMA,
              temperature: 0.75,
            },
          });
          if (response.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          lastModelError = err;
          console.warn(`Suggest replies: Model ${modelName} issue: ${err?.message}`);
        }
      }

      if (!responseText) {
        throw lastModelError || new Error('Empty response from Gemini API.');
      }

      const parsed = JSON.parse(responseText.trim());
      res.json({
        success: true,
        replies: parsed.replies,
      });
    } catch (error: any) {
      console.error('Error during suggest-replies:', error);
      res.status(500).json({
        error: 'SUGGEST_FAILED',
        message: 'نتونستم پیام رو بسازم 🤍 یه مشکل موقت پیش اومده. دوباره امتحان کن.',
      });
    }
  });

  // Rewrite Reply Endpoint (Step 4: "می‌خوای تغییرش بدم؟")
  app.post('/api/rewrite-reply', async (req: Request, res: Response): Promise<void> => {
    try {
      const { originalMessage, tone, userInstruction, conflictContext } = req.body;

      if (!originalMessage || typeof originalMessage !== 'string') {
        res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'پیام اصلی برای بازنویسی وجود ندارد.',
        });
        return;
      }

      if (!userInstruction || typeof userInstruction !== 'string' || !userInstruction.trim()) {
        res.status(400).json({
          error: 'INVALID_INSTRUCTION',
          message: 'لطفاً مشخص کن که چطور می‌خواهی پیام تغییر کند.',
        });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error: 'API_KEY_MISSING',
          message: 'کلید ارتباط با هوش مصنوعی تنظیم نشده است.',
        });
        return;
      }

      const ai = getGeminiClient();

      const systemInstruction = `تو یک دستیار هوشمند و نویسنده پیام‌های انسانی برای کاهش تنش در روابط هستی.
وظیفه تو این است که یک پیام متنی را دقیقاً بر اساس دستور کاربر (مثلاً کوتاه‌تر کردن، خودمونی‌تر کردن، محکم‌تر کردن یا اضافه کردن لحن عذرخواهی) بازنویسی کنی.

قوانین بازنویسی:
1. لحن باید کاملاً طبیعی، صمیمانه و متناسب با چت پیام‌رسان (تلگرام / واتساپ) باشد.
2. از لحن خشک، رباتی، اداری یا کتابی پرهیز کن.
3. دستور کاربر را دقیق اعمال کن (اگر گفت کوتاه‌تر، واقعاً موجز و مختصر شود؛ اگر گفت خودمونی، لحن دوستانه‌تر شود).
4. پیام بازنویسی‌شده نباید سرزنش‌گر، تهاجمی یا بی‌احترام باشد.
5. فقط یک پیام متنی نهایی در قالب JSON خروجی بده.`;

      const userPrompt = `متن پیام فعلی:
«${originalMessage.trim()}»

لحن پایه: ${tone || 'مشخص نشده'}
زمینه ماجرا: ${conflictContext || 'اختلاف و نیاز به آشتی و گفت‌وگو'}

دستور کاربر برای تغییر پیام:
«${userInstruction.trim()}»

لطفاً پیام را با توجه دقیق به این دستور بازنویسی کن و خروجی را در قالب JSON مشخص‌شده تحویل بده.`;

      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash'];
      let responseText: string | undefined;
      let lastModelError: any = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: REWRITE_REPLY_SCHEMA,
              temperature: 0.7,
            },
          });
          if (response.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          lastModelError = err;
          console.warn(`Rewrite reply: Model ${modelName} issue: ${err?.message}`);
        }
      }

      if (!responseText) {
        throw lastModelError || new Error('Empty response from Gemini API.');
      }

      const parsed = JSON.parse(responseText.trim());
      res.json({
        success: true,
        message: parsed.message,
      });
    } catch (error: any) {
      console.error('Error during rewrite-reply:', error);
      res.status(500).json({
        error: 'REWRITE_FAILED',
        message: 'نتونستم پیام رو بسازم 🤍 یه مشکل موقت پیش اومده. دوباره امتحان کن.',
      });
    }
  });

  // Vite middleware in dev / Static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});

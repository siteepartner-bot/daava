import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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

const SHARED_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallSummary: {
      type: Type.STRING,
      description: 'خلاصه اصل ماجرا و اتفاقی که رخ داده به صورت کاملاً بی‌طرفانه',
    },
    commonGround: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'لیست ۳ تا ۴ مورد از نقاط مشترک و خواسته یا دغدغه مشترک هر دو طرف',
    },
    mainDifferences: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING, description: 'موضوع یا محور اختلاف' },
          participantA: { type: Type.STRING, description: 'دیدگاه و برداشت نفر اول' },
          participantB: { type: Type.STRING, description: 'دیدگاه و برداشت نفر دوم' },
        },
        required: ['topic', 'participantA', 'participantB'],
      },
      description: 'اختلاف دیدگاه‌ها به تفکیک برداشت نفر اول و نفر دوم',
    },
    possibleMisunderstandings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'لیست سوءتفاهم‌های احتمالی که بین دو نفر شکل گرفته است',
    },
    participantA: {
      type: Type.OBJECT,
      properties: {
        emotion: { type: Type.STRING, description: 'احساس شناسایی‌شده نفر اول' },
        possibleNeed: { type: Type.STRING, description: 'نیاز عاطفی یا روانی احتمالی نفر اول' },
        behaviorToImprove: { type: Type.STRING, description: 'رفتار یا واکنشی که برای نفر اول قابلیت بهبود دارد' },
      },
      required: ['emotion', 'possibleNeed', 'behaviorToImprove'],
    },
    participantB: {
      type: Type.OBJECT,
      properties: {
        emotion: { type: Type.STRING, description: 'احساس شناسایی‌شده نفر دوم' },
        possibleNeed: { type: Type.STRING, description: 'نیاز عاطفی یا روانی احتمالی نفر دوم' },
        behaviorToImprove: { type: Type.STRING, description: 'رفتار یا واکنشی که برای نفر دوم قابلیت بهبود دارد' },
      },
      required: ['emotion', 'possibleNeed', 'behaviorToImprove'],
    },
    escalationPattern: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'زنجیره ۴ تا ۶ مرحله‌ای تشدید دعوا (از اتفاق اولیه تا برداشت‌ها، واکنش‌ها و تشدید)',
    },
    sharedNeed: {
      type: Type.STRING,
      description: 'نیاز مشترک و بنیادین هر دو نفر در این رابطه',
    },
    fairAssessment: {
      type: Type.STRING,
      description: 'بررسی منصفانه و کاملاً بی‌طرفانه ماجرا بدون مقصر جلوه دادن هیچ‌کدام',
    },
    nextStep: {
      type: Type.STRING,
      description: 'پیشنهاد و اقدام عملی بعدی برای شروع گفتگو و حل مسئله',
    },
    conversationStarter: {
      type: Type.STRING,
      description: 'یک جمله بسیار طبیعی، ملموس و صمیمی برای شروع دوباره گفتگو توسط هر یک از دو طرف',
    },
  },
  required: [
    'overallSummary',
    'commonGround',
    'mainDifferences',
    'possibleMisunderstandings',
    'participantA',
    'participantB',
    'escalationPattern',
    'sharedNeed',
    'fairAssessment',
    'nextStep',
    'conversationStarter',
  ],
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

      const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-2.5-flash'];
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

      const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-2.5-flash'];
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

      const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-2.5-flash'];
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

  // ============================================================================
  // COUPLE SESSION MANAGEMENT ENDPOINTS (Step 5)
  // ============================================================================

  interface ParticipantRecord {
    id: string;
    name: string;
    token: string;
    story?: string;
    category?: string | null;
    emotion?: string | null;
    gender?: string | null;
    completed: boolean;
    completedAt?: number;
    createdAt: number;
  }

  interface CoupleSessionServerRecord {
    id: string;
    joinCode: string;
    createdAt: number;
    updatedAt: number;
    expiresAt: number;
    status: 'waiting' | 'participant_a_completed' | 'participant_b_completed' | 'ready_for_analysis' | 'expired';
    participantA: ParticipantRecord;
    participantB?: ParticipantRecord | null;
    sharedAnalysis?: any;
    analyzedAt?: number;
  }

  // In-memory sessions map
  const coupleSessions = new Map<string, CoupleSessionServerRecord>();
  const joinCodeToSessionId = new Map<string, string>();

  const DEFAULT_FIREBASE_CONFIG = {
    projectId: "gen-lang-client-0837212722",
    databaseId: "ai-studio-af8d8582-44fc-4d43-92f1-7586b79e487a",
    apiKey: "AIzaSyD77fs7IX3TyH7yM9IWQquoqdAX0unvG-8"
  };

  function getFirebaseConfig() {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
      databaseId: process.env.FIREBASE_DATABASE_ID || DEFAULT_FIREBASE_CONFIG.databaseId,
      apiKey: process.env.FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey
    };
  }

  async function getSessionFromStore(idOrCode: string): Promise<CoupleSessionServerRecord | null> {
    if (!idOrCode) return null;
    const cfg = getFirebaseConfig();
    const cleanId = String(idOrCode).trim();
    const lookupKey = cleanId.toUpperCase();

    const baseUrl = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.databaseId}/documents`;

    // 1. Try direct doc fetch
    try {
      const directUrl = `${baseUrl}/couple_sessions/${encodeURIComponent(cleanId)}?key=${cfg.apiKey}`;
      const directRes = await fetch(directUrl);
      if (directRes.ok) {
        const doc: any = await directRes.json();
        if (doc?.fields?.dataJson?.stringValue) {
          const parsed = JSON.parse(doc.fields.dataJson.stringValue);
          coupleSessions.set(parsed.id, parsed);
          joinCodeToSessionId.set(parsed.joinCode.toUpperCase(), parsed.id);
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Server Firestore direct fetch error:', err);
    }

    // 2. Query by joinCode
    try {
      const queryUrl = `${baseUrl}:runQuery?key=${cfg.apiKey}`;
      const queryBody = {
        structuredQuery: {
          from: [{ collectionId: 'couple_sessions' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'joinCode' },
              op: 'EQUAL',
              value: { stringValue: lookupKey }
            }
          },
          limit: 1
        }
      };

      const queryRes = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryBody)
      });

      if (queryRes.ok) {
        const results: any = await queryRes.json();
        for (const resItem of results) {
          const doc = resItem.document;
          if (doc?.fields?.dataJson?.stringValue) {
            const parsed = JSON.parse(doc.fields.dataJson.stringValue);
            coupleSessions.set(parsed.id, parsed);
            joinCodeToSessionId.set(parsed.joinCode.toUpperCase(), parsed.id);
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('Server Firestore runQuery error:', err);
    }

    // 3. Fallback in-memory
    let session = coupleSessions.get(joinCodeToSessionId.get(lookupKey) || cleanId);
    if (session) return session;
    for (const s of coupleSessions.values()) {
      if (s.joinCode.toUpperCase() === lookupKey || s.id === cleanId) return s;
    }
    return null;
  }

  async function saveSessionToStore(session: CoupleSessionServerRecord): Promise<void> {
    if (!session || !session.id) return;
    coupleSessions.set(session.id, session);
    joinCodeToSessionId.set(session.joinCode.toUpperCase(), session.id);

    const cfg = getFirebaseConfig();
    const docUrl = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.databaseId}/documents/couple_sessions/${encodeURIComponent(session.id)}?key=${cfg.apiKey}`;

    const docBody = {
      fields: {
        id: { stringValue: session.id },
        joinCode: { stringValue: session.joinCode.toUpperCase() },
        status: { stringValue: session.status || 'waiting' },
        expiresAt: { integerValue: String(session.expiresAt || 0) },
        updatedAt: { integerValue: String(session.updatedAt || Date.now()) },
        dataJson: { stringValue: JSON.stringify(session) }
      }
    };

    try {
      await fetch(docUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docBody)
      });
    } catch (err) {
      console.warn('Server Firestore save error:', err);
    }
  }

  async function deleteSessionFromStore(session: CoupleSessionServerRecord): Promise<void> {
    if (!session || !session.id) return;
    coupleSessions.delete(session.id);
    joinCodeToSessionId.delete(session.joinCode.toUpperCase());

    const cfg = getFirebaseConfig();
    const docUrl = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.databaseId}/documents/couple_sessions/${encodeURIComponent(session.id)}?key=${cfg.apiKey}`;

    try {
      await fetch(docUrl, { method: 'DELETE' });
    } catch (err) {
      console.warn('Server Firestore delete error:', err);
    }
  }

  function generateJoinCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let attempt = 0; attempt < 100; attempt++) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (!joinCodeToSessionId.has(code)) {
        return code;
      }
    }
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  function generateSecureToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36)
    );
  }

  function sanitizeSessionForPublic(
    session: CoupleSessionServerRecord,
    requesterRole?: 'participantA' | 'participantB'
  ) {
    const isACompleted = Boolean(session.participantA.completed);
    const isBCompleted = Boolean(session.participantB?.completed);
    const isReady = isACompleted && isBCompleted;

    return {
      id: session.id,
      joinCode: session.joinCode,
      status: isReady ? 'ready_for_analysis' : session.status,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      participantA: {
        name: session.participantA.name,
        completed: isACompleted,
        completedAt: session.participantA.completedAt,
      },
      participantB: session.participantB
        ? {
            name: session.participantB.name,
            completed: isBCompleted,
            completedAt: session.participantB.completedAt,
          }
        : null,
      isParticipantACompleted: isACompleted,
      isParticipantBCompleted: isBCompleted,
      isReadyForAnalysis: isReady,
      yourRole: requesterRole,
      yourCompleted:
        requesterRole === 'participantA'
          ? isACompleted
          : requesterRole === 'participantB'
          ? isBCompleted
          : false,
      sharedAnalysis: isReady ? session.sharedAnalysis || null : null,
      analyzedAt: session.analyzedAt || null,
    };
  }

  // Periodic cleanup of expired sessions (every 30 mins)
  setInterval(() => {
    const now = Date.now();
    for (const [id, s] of coupleSessions.entries()) {
      if (s.expiresAt < now) {
        joinCodeToSessionId.delete(s.joinCode);
        coupleSessions.delete(id);
      }
    }
  }, 30 * 60 * 1000);

  // 1. Create Couple Session
  app.post('/api/couple/create', async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, story, category, emotion, gender } = req.body || {};
      const cleanName = (typeof name === 'string' && name.trim()) || 'نفر اول';
      const cleanStory = (typeof story === 'string' && story.trim()) || '';
      const hasStory = cleanStory.length >= 20;

      const sessionId = 'cs_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      const joinCode = generateJoinCode();
      const tokenA = generateSecureToken();
      const now = Date.now();
      const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

      const participantA: ParticipantRecord = {
        id: 'pA',
        name: cleanName,
        token: tokenA,
        story: hasStory ? cleanStory : undefined,
        category: category || null,
        emotion: emotion || null,
        gender: gender || null,
        completed: hasStory,
        completedAt: hasStory ? now : undefined,
        createdAt: now,
      };

      const sessionRecord: CoupleSessionServerRecord = {
        id: sessionId,
        joinCode,
        createdAt: now,
        updatedAt: now,
        expiresAt,
        status: hasStory ? 'participant_a_completed' : 'waiting',
        participantA,
        participantB: null,
      };

      await saveSessionToStore(sessionRecord);

      res.json({
        success: true,
        session: sanitizeSessionForPublic(sessionRecord, 'participantA'),
        token: tokenA,
        role: 'participantA',
      });
    } catch (error: any) {
      console.error('Error creating couple session:', error);
      res.status(500).json({
        error: 'SESSION_CREATE_FAILED',
        message: 'خطا در ایجاد جلسه دونفره. لطفاً دوباره امتحان کنید.',
      });
    }
  });

  // 2. Join Couple Session
  app.post('/api/couple/join', async (req: Request, res: Response): Promise<void> => {
    try {
      const { joinCodeOrId, name, existingToken } = req.body || {};

      if (!joinCodeOrId || typeof joinCodeOrId !== 'string') {
        res.status(400).json({
          error: 'INVALID_CODE',
          message: 'کد یا شناسه جلسه معتبر نیست.',
        });
        return;
      }

      const session = await getSessionFromStore(joinCodeOrId);

      if (!session) {
        res.status(404).json({
          error: 'SESSION_NOT_FOUND',
          message: 'جلسه‌ای با این کد دعوت پیدا نشد. لطفاً کد را بررسی کنید.',
        });
        return;
      }

      if (session.expiresAt < Date.now()) {
        res.status(410).json({
          error: 'SESSION_EXPIRED',
          message: 'این جلسه دیگه فعال نیست 🤍',
        });
        return;
      }

      // Check if existing participant is re-joining with token
      if (existingToken) {
        if (session.participantA.token === existingToken) {
          res.json({
            success: true,
            session: sanitizeSessionForPublic(session, 'participantA'),
            token: existingToken,
            role: 'participantA',
          });
          return;
        }
        if (session.participantB && session.participantB.token === existingToken) {
          res.json({
            success: true,
            session: sanitizeSessionForPublic(session, 'participantB'),
            token: existingToken,
            role: 'participantB',
          });
          return;
        }
      }

      const cleanName = (typeof name === 'string' && name.trim()) || 'همراه';
      const now = Date.now();

      // If participantB doesn't exist yet, create participantB
      if (!session.participantB) {
        const tokenB = generateSecureToken();
        session.participantB = {
          id: 'pB',
          name: cleanName,
          token: tokenB,
          completed: false,
          createdAt: now,
        };
        session.updatedAt = now;

        await saveSessionToStore(session);

        res.json({
          success: true,
          session: sanitizeSessionForPublic(session, 'participantB'),
          token: tokenB,
          role: 'participantB',
        });
        return;
      }

      // If participantB already exists but not completed or updating name
      if (!session.participantB.completed) {
        if (cleanName && cleanName !== 'همراه') {
          session.participantB.name = cleanName;
          await saveSessionToStore(session);
        }
        res.json({
          success: true,
          session: sanitizeSessionForPublic(session, 'participantB'),
          token: session.participantB.token,
          role: 'participantB',
        });
        return;
      }

      // If both completed or already has participantB with another token
      res.json({
        success: true,
        session: sanitizeSessionForPublic(session, 'participantB'),
        token: session.participantB.token,
        role: 'participantB',
      });
    } catch (error: any) {
      console.error('Error joining couple session:', error);
      res.status(500).json({
        error: 'SESSION_JOIN_FAILED',
        message: 'خطا در ورود به جلسه. لطفاً دوباره تلاش کنید.',
      });
    }
  });

  // 3. Get Session Status (Polling)
  app.get('/api/couple/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionIdOrCode = req.params.id;
      const token =
        (req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
          (req.query.token as string) ||
          '').trim();

      const session = await getSessionFromStore(sessionIdOrCode);

      if (!session) {
        res.status(404).json({
          error: 'SESSION_NOT_FOUND',
          message: 'جلسه مورد نظر پیدا نشد.',
        });
        return;
      }

      if (session.expiresAt < Date.now()) {
        res.status(410).json({
          error: 'SESSION_EXPIRED',
          message: 'این جلسه دیگه فعال نیست 🤍',
        });
        return;
      }

      let requesterRole: 'participantA' | 'participantB' | undefined;
      if (token) {
        if (session.participantA.token === token) {
          requesterRole = 'participantA';
        } else if (session.participantB && session.participantB.token === token) {
          requesterRole = 'participantB';
        }
      }

      res.json({
        success: true,
        session: sanitizeSessionForPublic(session, requesterRole),
        yourRole: requesterRole,
      });
    } catch (error: any) {
      console.error('Error getting couple session:', error);
      res.status(500).json({
        error: 'GET_SESSION_FAILED',
        message: 'خطا در دریافت وضعیت جلسه.',
      });
    }
  });

  // 4. Submit Participant Story
  app.post('/api/couple/:id/submit', async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionIdOrCode = req.params.id;
      const { token, role, name, story, category, emotion, gender } = req.body || {};

      if (!story || typeof story !== 'string' || story.trim().length < 20) {
        res.status(400).json({
          error: 'INVALID_STORY',
          message: 'یکم بیشتر برامون تعریف کن تا بهتر بفهمیم 🤍 (حداقل ۲۰ کاراکتر)',
        });
        return;
      }

      const session = await getSessionFromStore(sessionIdOrCode);

      if (!session) {
        res.status(404).json({
          error: 'SESSION_NOT_FOUND',
          message: 'جلسه مورد نظر پیدا نشد.',
        });
        return;
      }

      if (session.expiresAt < Date.now()) {
        res.status(410).json({
          error: 'SESSION_EXPIRED',
          message: 'این جلسه دیگه فعال نیست 🤍',
        });
        return;
      }

      const now = Date.now();
      let targetRole: 'participantA' | 'participantB' | null = null;

      if (token) {
        if (session.participantA.token === token || role === 'participantA') {
          targetRole = 'participantA';
        } else if (session.participantB?.token === token || role === 'participantB') {
          targetRole = 'participantB';
        }
      } else if (role === 'participantA') {
        targetRole = 'participantA';
      } else if (role === 'participantB') {
        targetRole = 'participantB';
      }

      if (!targetRole) {
        res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'دسترسی غیرمجاز به این جلسه.',
        });
        return;
      }

      if (targetRole === 'participantA') {
        if (name && typeof name === 'string' && name.trim()) {
          session.participantA.name = name.trim();
        }
        session.participantA.story = story.trim();
        session.participantA.category = category || session.participantA.category || null;
        session.participantA.emotion = emotion || session.participantA.emotion || null;
        session.participantA.gender = gender || session.participantA.gender || null;
        session.participantA.completed = true;
        session.participantA.completedAt = now;
      } else {
        if (!session.participantB) {
          session.participantB = {
            id: 'pB',
            name: (name && typeof name === 'string' && name.trim()) || 'همراه',
            token: token || generateSecureToken(),
            completed: true,
            completedAt: now,
            createdAt: now,
          };
        } else {
          if (name && typeof name === 'string' && name.trim()) {
            session.participantB.name = name.trim();
          }
          session.participantB.completed = true;
          session.participantB.completedAt = now;
        }
        session.participantB.story = story.trim();
        session.participantB.category = category || null;
        session.participantB.emotion = emotion || null;
        session.participantB.gender = gender || null;
      }

      session.updatedAt = now;

      // Update session status
      const isACompleted = Boolean(session.participantA.completed);
      const isBCompleted = Boolean(session.participantB?.completed);

      if (isACompleted && isBCompleted) {
        session.status = 'ready_for_analysis';
      } else if (isACompleted) {
        session.status = 'participant_a_completed';
      } else if (isBCompleted) {
        session.status = 'participant_b_completed';
      }

      await saveSessionToStore(session);

      res.json({
        success: true,
        session: sanitizeSessionForPublic(session, targetRole),
      });
    } catch (error: any) {
      console.error('Error submitting couple story:', error);
      res.status(500).json({
        error: 'SUBMIT_FAILED',
        message: 'خطا در ثبت دیدگاه. لطفاً دوباره تلاش کنید.',
      });
    }
  });

  // 5. Leave / Delete Couple Session
  app.post('/api/couple/:id/leave', async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionIdOrCode = req.params.id;
      const session = await getSessionFromStore(sessionIdOrCode);

      if (session) {
        await deleteSessionFromStore(session);
      }

      res.json({ success: true, message: 'از جلسه خارج شدید.' });
    } catch (error: any) {
      console.error('Error leaving couple session:', error);
      res.status(500).json({ error: 'LEAVE_FAILED', message: 'خطا در خروج از جلسه.' });
    }
  });

  // 6. Analyze Couple Session (Shared Gemini Analysis)
  app.post('/api/couple/analyze', async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionIdOrCode, token, forceReanalyze } = req.body || {};
      const authToken = (
        req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
        token ||
        ''
      ).trim();

      if (!sessionIdOrCode || typeof sessionIdOrCode !== 'string') {
        res.status(400).json({
          error: 'INVALID_SESSION',
          message: 'شناسه یا کد جلسه معتبر نیست.',
        });
        return;
      }

      const session = await getSessionFromStore(sessionIdOrCode);

      if (!session) {
        res.status(404).json({
          error: 'SESSION_NOT_FOUND',
          message: 'جلسه مورد نظر پیدا نشد.',
        });
        return;
      }

      if (session.expiresAt < Date.now()) {
        res.status(410).json({
          error: 'SESSION_EXPIRED',
          message: 'این جلسه دیگه فعال نیست 🤍',
        });
        return;
      }

      // Check authorization role
      let requesterRole: 'participantA' | 'participantB' | undefined;
      if (authToken) {
        if (session.participantA.token === authToken) {
          requesterRole = 'participantA';
        } else if (session.participantB && session.participantB.token === authToken) {
          requesterRole = 'participantB';
        }
      }

      const isACompleted = Boolean(session.participantA?.completed && session.participantA?.story);
      const isBCompleted = Boolean(session.participantB?.completed && session.participantB?.story);

      if (!isACompleted || !isBCompleted) {
        res.status(400).json({
          error: 'NOT_READY',
          message: 'هنوز هر دو نفر دیدگاه خود را ثبت نکرده‌اند.',
        });
        return;
      }

      // Return existing sharedAnalysis if available and forceReanalyze is false
      if (session.sharedAnalysis && forceReanalyze !== true) {
        res.json({
          success: true,
          sharedAnalysis: session.sharedAnalysis,
          session: sanitizeSessionForPublic(session, requesterRole),
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

      const pA = session.participantA;
      const pB = session.participantB!;
      const category = pA.category || pB.category || 'ارتباط و رابطه';

      const systemInstruction = `تو یک میانجی تحلیلی و روان‌شناس روابط کاملاً بی‌طرف، آرامش‌بخش، منصف و همدل هستی.
دو نفر که درگیر یک اختلاف عاطفی یا گفتگویی شده‌اند، روایت خود از ماجرا را به صورت جداگانه ثبت کرده‌اند.

روایت نفر اول (شرکت‌کننده A):
نام/لقب: ${pA.name || 'نفر اول'}
جنسیت: ${pA.gender === 'female' ? 'خانم' : pA.gender === 'male' ? 'آقا' : 'مشخص‌نشده'}
احساس انتخاب‌شده: ${pA.emotion || 'نامشخص'}
شرح روایت: ${pA.story}

روایت نفر دوم (شرکت‌کننده B):
نام/لقب: ${pB.name || 'نفر دوم'}
جنسیت: ${pB.gender === 'female' ? 'خانم' : pB.gender === 'male' ? 'آقا' : 'مشخص‌نشده'}
احساس انتخاب‌شده: ${pB.emotion || 'نامشخص'}
شرح روایت: ${pB.story}

موضوع کلان رابطه: ${category}

قوانین حیاتی تحلیل بی‌طرفانه (Strict Privacy & Neutrality):
۱. طرف هیچ‌کدام از طرفین را نگیر و به هیچ وجه دنبال مقصر یا «حق با کیست» نگرد.
۲. دو روایت را به عنوان دو «برداشت و دیدگاه شخصی» در نظر بگیر، نه حقیقت مطلق یا ادعای ثابتی.
۳. اگر دو نفر یک اتفاق را متفاوت تعریف کرده‌اند، اختلاف روایت و برداشت متفاوتشان را با احترام و دقت در بخش mainDifferences مشخص کن.
۴. چیزی که در داده‌ها وجود ندارد را به عنوان واقعیت قطعی بیان نکن.
۵. درباره نیت داخلی افراد حدس قطعی نزن و حتماً از عبارت‌های «ممکن است»، «به نظر می‌رسد»، «احتمالاً» استفاده کن.
۶. رفتار آسیب‌زا یا توهین‌آمیز را توجیه نکن اما قضاوت شخصیتی هم نکن.
۷. در صورت وجود نشانه‌های تهدید یا خشونت، امنیت افراد را اولویت قرار بده.
۸. هدف تحلیل برنده کردن هیچ‌کس نیست، بلکه هموار کردن مسیر گفتگو و درک متقابل است.
۹. خروجی باید دقیقاً و فقط طبق JSON Schema تعریف‌شده باشد.`;

      const promptText = `لطفاً روایت هر دو نفر را بررسی کن و تحلیل مشترک دونفره، منصفانه و ساختاریافته را به زبان فارسی و فرمت JSON ارائه بده.`;

      const ai = getGeminiClient();
      const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-2.5-flash'];
      let responseText = '';
      let lastAnalysisErr: any = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: promptText,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: SHARED_ANALYSIS_SCHEMA,
              temperature: 0.3,
            },
          });
          if (response.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          lastAnalysisErr = err;
          console.warn(`Couple analysis model ${modelName} failed: ${err?.message}`);
        }
      }

      if (!responseText) {
        throw lastAnalysisErr || new Error('پاسخی از هوش مصنوعی دریافت نشد.');
      }
      let parsedAnalysis: any;

      try {
        parsedAnalysis = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse error from Gemini couple analysis:', parseError, responseText);
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('فرمت پاسخ دریافت شده از هوش مصنوعی معتبر نیست.');
        }
      }

      session.sharedAnalysis = parsedAnalysis;
      session.analyzedAt = Date.now();
      session.updatedAt = Date.now();

      await saveSessionToStore(session);

      res.json({
        success: true,
        sharedAnalysis: session.sharedAnalysis,
        session: sanitizeSessionForPublic(session, requesterRole),
      });
    } catch (error: any) {
      console.error('Error analyzing couple session:', error);
      res.status(500).json({
        error: 'ANALYSIS_FAILED',
        message: 'نتونستیم تحلیل مشترک رو انجام بدیم 🤍',
      });
    }
  });

  // Vite middleware in dev / Static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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

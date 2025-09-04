import { GoogleGenAI, Modality, GenerateContentResponse, Part, HarmCategory, HarmBlockThreshold } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash-image-preview';

export const removeImageBackground = async (imagePart: { inlineData: { data: string; mimeType: string } }): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          imagePart,
          {
            text: 'قم بإزالة خلفية هذه الصورة واجعلها شفافة. أرجع الصورة فقط بدون أي نص إضافي.',
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      if (response.promptFeedback?.blockReason) {
        throw new Error(`تم حظر الطلب بسبب: ${response.promptFeedback.blockReason}. الرجاء تجربة صورة مختلفة.`);
      }
      throw new Error("لم يتم استلام أي استجابة من الـ API. قد تكون الصورة غير مدعومة.");
    }
    
    const candidate = response.candidates[0];

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`فشلت المعالجة. السبب: ${candidate.finishReason}. الرجاء تجربة صورة مختلفة.`);
    }

    if (!candidate.content?.parts || candidate.content.parts.length === 0) {
        throw new Error("استجابة الـ API كانت فارغة. الرجاء تجربة صورة مختلفة.");
    }
    
    const resultImagePart = candidate.content.parts.find((part: Part) => part.inlineData);

    if (resultImagePart && resultImagePart.inlineData) {
        const newMimeType = resultImagePart.inlineData.mimeType;
        const newBase64Data = resultImagePart.inlineData.data;
        return `data:${newMimeType};base64,${newBase64Data}`;
    }
    
    const textPart = candidate.content.parts.find((part: Part) => part.text);
    if (textPart && textPart.text) {
        throw new Error(`استجاب الـ API بنص بدلاً من صورة: "${textPart.text}"`);
    }

    throw new Error("لم يتمكن الـ API من إرجاع صورة صالحة. الرجاء تجربة صورة مختلفة.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`فشلت إزالة الخلفية: ${error.message}`);
    }
    throw new Error("حدث خطأ غير معروف أثناء إزالة الخلفية.");
  }
};

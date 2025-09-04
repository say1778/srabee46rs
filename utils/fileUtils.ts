
export const fileToGenerativePart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      const mimeType = result.split(';')[0].split(':')[1];
      
      if (!mimeType.startsWith('image/')) {
        return reject(new Error('الملف المحدد ليس صورة.'));
      }

      resolve({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    };
    reader.onerror = (error) => reject(error);
  });
};

export const applyBackgroundColor = (imageUrl: string, color: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        } else {
            reject(new Error('لا يمكن الحصول على سياق Canvas.'));
        }
    };

    img.onerror = (error) => {
        reject(new Error(`فشل تحميل الصورة في Canvas: ${error}`));
    };

    img.src = imageUrl;
  });
};

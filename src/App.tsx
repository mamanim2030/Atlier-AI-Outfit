import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ImageUpload } from './components/ImageUpload';
import { GeneratedImage } from './components/GeneratedImage';
import { AccessGate } from './components/AccessGate';
import { Chatbot } from './components/Chatbot';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Lock, Settings, Key, X, Save } from 'lucide-react';

type GenerationState = {
  loading: boolean;
  image: string | null;
};

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [manualApiKey, setManualApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  
  const [modelGender, setModelGender] = useState<'female' | 'male' | 'unisex'>('female');
  const [modelFit, setModelFit] = useState<'overfit' | 'regular' | 'slim'>('regular');
  const [modelStyle, setModelStyle] = useState<'Casual' | 'Classic' | 'Streetwear' | 'Business casual' | 'Chic' | 'Preppy' | 'Athleisure'>('Classic');
  const [enableDetailShot, setEnableDetailShot] = useState(false);
  const [enableCoordShot, setEnableCoordShot] = useState(false);

  const [cleanUpFront, setCleanUpFront] = useState<GenerationState>({ loading: false, image: null });
  const [cleanUpBack, setCleanUpBack] = useState<GenerationState>({ loading: false, image: null });
  
  const [modelFront, setModelFront] = useState<GenerationState>({ loading: false, image: null });
  const [modelSide, setModelSide] = useState<GenerationState>({ loading: false, image: null });
  const [modelBack, setModelBack] = useState<GenerationState>({ loading: false, image: null });
  const [modelFull, setModelFull] = useState<GenerationState>({ loading: false, image: null });
  
  const [coordShot, setCoordShot] = useState<GenerationState>({ loading: false, image: null });
  const [detailTexture, setDetailTexture] = useState<GenerationState>({ loading: false, image: null });

  useEffect(() => {
    const authorized = sessionStorage.getItem('is_authorized');
    if (authorized) setIsAuthorized(true);
    checkApiKey();
    const storedKey = localStorage.getItem('gemini_manual_key');
    if (storedKey) {
      setManualApiKey(storedKey);
      setHasApiKey(true);
    }
  }, []);

  const handleAccessGranted = () => {
    setIsAuthorized(true);
    sessionStorage.setItem('is_authorized', 'true');
  };

  const checkApiKey = async () => {
    try {
      if (manualApiKey) {
        setHasApiKey(true);
        setIsCheckingKey(false);
        return;
      }
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        // Fallback for Vercel / external deployments
        if (process.env.GEMINI_API_KEY) {
          setHasApiKey(true);
        } else {
          setHasApiKey(false);
        }
      }
    } catch (e) {
      console.error("Error checking API key:", e);
      if (!manualApiKey) setHasApiKey(false);
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handleSelectKey = async () => {
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
      }
    } catch (e) {
      console.error("Error selecting API key:", e);
    }
  };

  const handleSaveManualKey = () => {
    if (tempApiKey.trim()) {
      setManualApiKey(tempApiKey.trim());
      localStorage.setItem('gemini_manual_key', tempApiKey.trim());
      setHasApiKey(true);
      setShowApiKeyModal(false);
    }
  };

  const getAIClient = () => {
    if (manualApiKey) return new GoogleGenAI({ apiKey: manualApiKey });
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  };

  const handleFrontSelect = (file: File) => {
    setFrontFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setFrontPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    resetStates();
  };

  const handleBackSelect = (file: File) => {
    setBackFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setBackPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    resetStates();
  };

  const handleBgSelect = (file: File) => {
    setBgFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setBgPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const resetStates = () => {
    setCleanUpFront({ loading: false, image: null });
    setCleanUpBack({ loading: false, image: null });
    setModelFront({ loading: false, image: null });
    setModelSide({ loading: false, image: null });
    setModelBack({ loading: false, image: null });
    setModelFull({ loading: false, image: null });
    setCoordShot({ loading: false, image: null });
    setDetailTexture({ loading: false, image: null });
  };

  const fileToGenerativePart = async (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve({ inlineData: { data: base64Data, mimeType: file.type } });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getSourceFrontPart = async () => {
    if (cleanUpFront.image) {
      return { inlineData: { data: cleanUpFront.image.split(',')[1], mimeType: 'image/png' } };
    }
    return await fileToGenerativePart(frontFile!);
  };

  const getSourceBackPart = async () => {
    if (cleanUpBack.image) {
      return { inlineData: { data: cleanUpBack.image.split(',')[1], mimeType: 'image/png' } };
    }
    if (backFile) {
      return await fileToGenerativePart(backFile);
    }
    return await getSourceFrontPart();
  };

  const getCoordPart = () => {
    if (coordShot.image) {
      return { inlineData: { data: coordShot.image.split(',')[1], mimeType: 'image/png' } };
    }
    return null;
  };

  const getBaseModelPrompt = () => {
    const genderText = modelGender === 'unisex' ? 'UNISEX/ANDROGYNOUS' : modelGender === 'male' ? 'MALE' : 'FEMALE';
    const fashionText = modelGender === 'unisex' ? 'UNISEX' : modelGender === 'male' ? 'MENSWEAR' : 'WOMENSWEAR';
    return `A professional Korean ${genderText} fashion model (young 20s, tall, perfect proportions) wearing this exact clothing item. The clothing should have a ${modelFit} fit. The model's face must NOT be visible (cropped strictly below the chin/jaw). Styling must be incredibly sophisticated, ${modelStyle.toLowerCase()}, minimalist, and high-end modern Korean ${fashionText} fashion. Avoid any tacky or outdated styling. Strictly NO necklaces, NO jewelry, NO accessories on the neck. Elegant, trendy, and highly fashionable ${fashionText.toLowerCase()} coordination. Luxurious cream-colored, simple hotel-like wall background. Natural posing. Cinematic lighting.`;
  };

  const regenerateCleanUpFront = async () => {
    if (!frontFile) return;
    const frontPart = await fileToGenerativePart(frontFile);
    await generateImageFromParts(
      [
        frontPart,
        { text: "Professional product photography of this exact clothing item. Flat lay or invisible mannequin. Completely remove all wrinkles and creases. Smooth texture, perfect studio lighting, clean white or neutral grey background. High resolution, 4k. Keep the original design and color exactly as is, just make it look pristine and brand new." }
      ],
      setCleanUpFront,
      "1:1"
    );
  };

  const regenerateCleanUpBack = async () => {
    if (!backFile) return;
    const sourceFrontPart = await getSourceFrontPart();
    const backPart = await fileToGenerativePart(backFile);
    await generateImageFromParts(
      [
        sourceFrontPart,
        backPart,
        { text: "Image 1 is the cleaned-up front view. Image 2 is the raw back view. Process Image 2 to be a professional product photo of the back. CRITICAL: You MUST exactly match the fabric color, background color, and lighting of Image 1. Remove all wrinkles and creases. Flat lay or invisible mannequin." }
      ],
      setCleanUpBack,
      "1:1"
    );
  };

  const regenerateModelFront = async () => {
    if (!frontFile) return;
    const sourceFrontPart = await getSourceFrontPart();
    await generateImageFromParts([sourceFrontPart, { text: `${getBaseModelPrompt()} Front view. EXTREME CLOSE-UP PRODUCT SHOT. Tightly cropped on the clothing item itself. CRITICAL: Do NOT generate a full-body shot. Zoom in closely on the garment to show the fit and fabric details. This must be a tightly cropped product shot, NOT a full-body portrait.` }], setModelFront, "3:4");
  };

  const regenerateModelSide = async () => {
    if (!frontFile) return;
    const sourceFrontPart = await getSourceFrontPart();
    await generateImageFromParts([sourceFrontPart, { text: `${getBaseModelPrompt()} Side profile view. EXTREME CLOSE-UP PRODUCT SHOT. Tightly cropped on the clothing item itself. CRITICAL: Do NOT generate a full-body shot. Zoom in closely on the garment from the side to show the fit and fabric details. This must be a tightly cropped product shot, NOT a full-body portrait.` }], setModelSide, "3:4");
  };

  const regenerateModelBack = async () => {
    if (!frontFile) return;
    const sourceBackPart = await getSourceBackPart();
    await generateImageFromParts([sourceBackPart, { text: `${getBaseModelPrompt()} Back view. EXTREME CLOSE-UP PRODUCT SHOT. Tightly cropped on the clothing item itself from the back. CRITICAL: Do NOT generate a full-body shot. Zoom in closely on the garment from the back to show the fit and fabric details. This must be a tightly cropped product shot, NOT a full-body portrait.` }], setModelBack, "3:4");
  };

  const regenerateDetailTexture = async () => {
    if (!frontFile) return;
    const frontPart = await fileToGenerativePart(frontFile);
    await generateImageFromParts([
      frontPart,
      { text: "Extreme close-up macro photography of the fabric texture and details. Focus on the weave and material quality. Shallow depth of field. CRITICAL: Do NOT add any new patterns, text, or elements that are not in the original image. Keep the exact original design." }
    ], setDetailTexture, "1:1");
  };

  const regenerateCoordShot = async () => {
    if (!frontFile) return;
    const frontPart = await fileToGenerativePart(frontFile);
    const demographicText = modelGender === 'unisex' ? 'UNISEX' : modelGender === 'male' ? 'MALE' : 'FEMALE';
    const fashionText = modelGender === 'unisex' ? 'UNISEX' : modelGender === 'male' ? 'MENSWEAR' : 'WOMENSWEAR';
    const bottomsText = modelGender === 'unisex' ? 'bottoms (like wide-fit slacks or trendy denim)' : modelGender === 'male' ? 'bottoms (like wide-fit slacks or trendy denim)' : 'bottoms (like chic skirts or wide-fit slacks)';
    const shoesText = modelGender === 'unisex' ? 'shoes (like minimalist sneakers, boots, or derbies)' : modelGender === 'male' ? 'shoes (like minimalist sneakers or derbies)' : 'shoes (like minimalist sneakers, boots, or heels)';
    await generateImageFromParts([
      frontPart,
      { text: `A stylish flat lay or aesthetic outfit grid featuring this exact clothing item, paired with high-end, minimalist matching ${bottomsText}, ${shoesText}, and a bag suitable for a sophisticated young Korean 20s ${demographicText} demographic. The styling should reflect a ${modelStyle.toLowerCase()} aesthetic. Strictly NO necklaces, NO jewelry. Avoid any tacky or outdated styling. Luxurious cream-colored background. High-end designer ${fashionText.toLowerCase()} e-commerce styling.` }
    ], setCoordShot, "1:1");
  };

  const regenerateModelFull = async () => {
    if (!frontFile) return;
    const sourceFrontPart = await getSourceFrontPart();
    const coordPart = getCoordPart();
    const genderText = modelGender === 'unisex' ? 'UNISEX/ANDROGYNOUS' : modelGender === 'male' ? 'MALE' : 'FEMALE';
    const fashionText = modelGender === 'unisex' ? 'UNISEX' : modelGender === 'male' ? 'MENSWEAR' : 'WOMENSWEAR';
    const fullBodyParts: any[] = [sourceFrontPart];
    let fullBodyPrompt = "";
    
    const dynamicPoseText = "The model should have a dynamic, engaged stance with a slight turn to effectively showcase the clothing's fit, drape, and silhouette. Natural but confident posing.";

    if (bgFile && coordPart) {
      const bgPart = await fileToGenerativePart(bgFile);
      fullBodyParts.push(bgPart);
      fullBodyParts.push(coordPart);
      fullBodyPrompt = `Image 1 is the clothing item. Image 2 is the background environment. Image 3 is the coordination styling. Generate a full body shot of a professional Korean ${genderText} fashion model wearing the clothing from Image 1, placed naturally in the environment from Image 2. The clothing should have a ${modelFit} fit. The model MUST wear the exact matching bottoms, shoes, and bag shown in the coordination styling (Image 3). The model's face must NOT be visible (cropped below the chin). ${dynamicPoseText} Styling must be incredibly sophisticated, ${modelStyle.toLowerCase()}, minimalist, and high-end modern Korean ${fashionText} fashion. Strictly NO necklaces, NO jewelry. Cinematic lighting, photorealistic.`;
    } else if (bgFile) {
      const bgPart = await fileToGenerativePart(bgFile);
      fullBodyParts.push(bgPart);
      fullBodyPrompt = `Image 1 is the clothing item. Image 2 is the background environment. Generate a full body shot of a professional Korean ${genderText} fashion model wearing the clothing from Image 1, placed naturally in the environment from Image 2. The clothing should have a ${modelFit} fit. The model's face must NOT be visible (cropped below the chin). ${dynamicPoseText} Styling must be incredibly sophisticated, ${modelStyle.toLowerCase()}, minimalist, and high-end modern Korean ${fashionText} fashion with perfectly matching bottoms and shoes. Strictly NO necklaces, NO jewelry. Cinematic lighting, photorealistic.`;
    } else if (coordPart) {
      fullBodyParts.push(coordPart);
      fullBodyPrompt = `Image 1 is the clothing item. Image 2 is the coordination styling. Generate a full body shot of a professional Korean ${genderText} fashion model wearing the clothing from Image 1. The clothing should have a ${modelFit} fit. The model MUST wear the exact matching bottoms, shoes, and bag shown in the coordination styling (Image 2). The model's face must NOT be visible (cropped below the chin). ${dynamicPoseText} Styling must be incredibly sophisticated, ${modelStyle.toLowerCase()}, minimalist, and high-end modern Korean ${fashionText} fashion. Strictly NO necklaces, NO jewelry. Luxurious cream-colored, simple hotel-like wall background. Cinematic lighting, photorealistic.`;
    } else {
      fullBodyPrompt = `${getBaseModelPrompt()} Full body shot. ${dynamicPoseText} High-end sophisticated ${fashionText.toLowerCase()} styling with perfectly matching bottoms and shoes.`;
    }
    
    fullBodyParts.push({ text: fullBodyPrompt });
    await generateImageFromParts(fullBodyParts, setModelFull, "3:4");
  };

  const generateImageFromParts = async (parts: any[], setState: React.Dispatch<React.SetStateAction<GenerationState>>, aspectRatio: string = "1:1") => {
    setState({ loading: true, image: null });
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
        config: { imageConfig: { aspectRatio, imageSize: "1K" } }
      });

      const generatedImage = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (generatedImage) {
        setState({ loading: false, image: `data:image/png;base64,${generatedImage}` });
        return generatedImage;
      } else {
        setState({ loading: false, image: null });
        return null;
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setState({ loading: false, image: null });
      return null;
    }
  };

  const generateAll = async () => {
    if (!frontFile) return;

    const frontPart = await fileToGenerativePart(frontFile);

    // 1. Clean up Front
    const cleanFrontBase64 = await generateImageFromParts(
      [
        frontPart,
        { text: "Professional product photography of this exact clothing item. Flat lay or invisible mannequin. Completely remove all wrinkles and creases. Smooth texture, perfect studio lighting, clean white or neutral grey background. High resolution, 4k. Keep the original design and color exactly as is, just make it look pristine and brand new." }
      ],
      setCleanUpFront,
      "1:1"
    );

    const sourceFrontPart = cleanFrontBase64 
      ? { inlineData: { data: cleanFrontBase64, mimeType: 'image/png' } }
      : frontPart;

    // 2. Clean up Back (if provided)
    let cleanBackBase64 = null;
    if (backFile) {
      const backPart = await fileToGenerativePart(backFile);
      cleanBackBase64 = await generateImageFromParts(
        [
          sourceFrontPart,
          backPart,
          { text: "Image 1 is the cleaned-up front view. Image 2 is the raw back view. Process Image 2 to be a professional product photo of the back. CRITICAL: You MUST exactly match the fabric color, background color, and lighting of Image 1. Remove all wrinkles and creases. Flat lay or invisible mannequin." }
        ],
        setCleanUpBack,
        "1:1"
      );
    }

    const sourceBackPart = backFile 
      ? (cleanBackBase64 ? { inlineData: { data: cleanBackBase64, mimeType: 'image/png' } } : await fileToGenerativePart(backFile))
      : sourceFrontPart;

    const genderText = modelGender === 'unisex' ? 'UNISEX/ANDROGYNOUS' : modelGender === 'male' ? 'MALE' : 'FEMALE';
    const fashionText = modelGender === 'unisex' ? 'UNISEX' : modelGender === 'male' ? 'MENSWEAR' : 'WOMENSWEAR';
    const demographicText = modelGender === 'unisex' ? 'UNISEX' : modelGender === 'male' ? 'MALE' : 'FEMALE';
    const bottomsText = modelGender === 'unisex' ? 'bottoms (like wide-fit slacks or trendy denim)' : modelGender === 'male' ? 'bottoms (like wide-fit slacks or trendy denim)' : 'bottoms (like chic skirts or wide-fit slacks)';
    const shoesText = modelGender === 'unisex' ? 'shoes (like minimalist sneakers, boots, or derbies)' : modelGender === 'male' ? 'shoes (like minimalist sneakers or derbies)' : 'shoes (like minimalist sneakers, boots, or heels)';

    const baseModelPrompt = `A professional Korean ${genderText} fashion model (young 20s, tall, perfect proportions) wearing this exact clothing item. The clothing should have a ${modelFit} fit. The model's face must NOT be visible (cropped strictly below the chin/jaw). Styling must be incredibly sophisticated, ${modelStyle.toLowerCase()}, minimalist, and high-end modern Korean ${fashionText} fashion. Avoid any tacky or outdated styling. Strictly NO necklaces, NO jewelry, NO accessories on the neck. Elegant, trendy, and highly fashionable ${fashionText.toLowerCase()} coordination. Luxurious cream-colored, simple hotel-like wall background. Natural posing. Cinematic lighting.`;

    // 3. Model Front
    generateImageFromParts([sourceFrontPart, { text: `${baseModelPrompt} Front view. EXTREME CLOSE-UP PRODUCT SHOT. Tightly cropped on the clothing item itself. CRITICAL: Do NOT generate a full-body shot. Zoom in closely on the garment to show the fit and fabric details. This must be a tightly cropped product shot, NOT a full-body portrait.` }], setModelFront, "3:4");
    
    // 4. Model Side
    generateImageFromParts([sourceFrontPart, { text: `${baseModelPrompt} Side profile view. EXTREME CLOSE-UP PRODUCT SHOT. Tightly cropped on the clothing item itself. CRITICAL: Do NOT generate a full-body shot. Zoom in closely on the garment from the side to show the fit and fabric details. This must be a tightly cropped product shot, NOT a full-body portrait.` }], setModelSide, "3:4");
    
    // 5. Model Back
    generateImageFromParts([sourceBackPart, { text: `${baseModelPrompt} Back view. EXTREME CLOSE-UP PRODUCT SHOT. Tightly cropped on the clothing item itself from the back. CRITICAL: Do NOT generate a full-body shot. Zoom in closely on the garment from the back to show the fit and fabric details. This must be a tightly cropped product shot, NOT a full-body portrait.` }], setModelBack, "3:4");

    // 8. Detail Shot (Fire concurrently)
    if (enableDetailShot) {
      generateImageFromParts([
        frontPart,
        { text: "Extreme close-up macro photography of the fabric texture and details. Focus on the weave and material quality. Shallow depth of field. CRITICAL: Do NOT add any new patterns, text, or elements that are not in the original image. Keep the exact original design." }
      ], setDetailTexture, "1:1");
    }

    // 7. Coord Shot (Await this because Full Body needs it)
    let coordBase64 = null;
    if (enableCoordShot) {
      coordBase64 = await generateImageFromParts([
        frontPart,
        { text: `A stylish flat lay or aesthetic outfit grid featuring this exact clothing item, paired with high-end, minimalist matching ${bottomsText}, ${shoesText}, and a bag suitable for a sophisticated young Korean 20s ${demographicText} demographic. The styling should reflect a ${modelStyle.toLowerCase()} aesthetic. Strictly NO necklaces, NO jewelry. Avoid any tacky or outdated styling. Luxurious cream-colored background. High-end designer ${fashionText.toLowerCase()} e-commerce styling.` }
      ], setCoordShot, "1:1");
    }

    // 6. Model Full (Uses Coord Shot as reference)
    const coordPart = coordBase64 ? { inlineData: { data: coordBase64, mimeType: 'image/png' } } : null;
    const fullBodyParts: any[] = [sourceFrontPart];
    let fullBodyPrompt = "";
    
    const dynamicPoseText = "The model should have a dynamic, engaged stance with a slight turn to effectively showcase the clothing's fit, drape, and silhouette. Natural but confident posing.";

    if (bgFile && coordPart) {
      const bgPart = await fileToGenerativePart(bgFile);
      fullBodyParts.push(bgPart);
      fullBodyParts.push(coordPart);
      fullBodyPrompt = `Image 1 is the clothing item. Image 2 is the background environment. Image 3 is the coordination styling. Generate a full body shot of a professional Korean ${genderText} fashion model wearing the clothing from Image 1, placed naturally in the environment from Image 2. The clothing should have a ${modelFit} fit. The model MUST wear the exact matching bottoms, shoes, and bag shown in the coordination styling (Image 3). The model's face must NOT be visible (cropped below the chin). ${dynamicPoseText} Styling must be incredibly sophisticated, ${modelStyle.toLowerCase()}, minimalist, and high-end modern Korean ${fashionText} fashion. Strictly NO necklaces, NO jewelry. Cinematic lighting, photorealistic.`;
    } else if (bgFile) {
      const bgPart = await fileToGenerativePart(bgFile);
      fullBodyParts.push(bgPart);
      fullBodyPrompt = `Image 1 is the clothing item. Image 2 is the background environment. Generate a full body shot of a professional Korean ${genderText} fashion model wearing the clothing from Image 1, placed naturally in the environment from Image 2. The clothing should have a ${modelFit} fit. The model's face must NOT be visible (cropped below the chin). ${dynamicPoseText} Styling must be incredibly sophisticated, ${modelStyle.toLowerCase()}, minimalist, and high-end modern Korean ${fashionText} fashion with perfectly matching bottoms and shoes. Strictly NO necklaces, NO jewelry. Cinematic lighting, photorealistic.`;
    } else if (coordPart) {
      fullBodyParts.push(coordPart);
      fullBodyPrompt = `Image 1 is the clothing item. Image 2 is the coordination styling. Generate a full body shot of a professional Korean ${genderText} fashion model wearing the clothing from Image 1. The clothing should have a ${modelFit} fit. The model MUST wear the exact matching bottoms, shoes, and bag shown in the coordination styling (Image 2). The model's face must NOT be visible (cropped below the chin). ${dynamicPoseText} Styling must be incredibly sophisticated, ${modelStyle.toLowerCase()}, minimalist, and high-end modern Korean ${fashionText} fashion. Strictly NO necklaces, NO jewelry. Luxurious cream-colored, simple hotel-like wall background. Cinematic lighting, photorealistic.`;
    } else {
      fullBodyPrompt = `${baseModelPrompt} Full body shot. ${dynamicPoseText} High-end sophisticated ${fashionText.toLowerCase()} styling with perfectly matching bottoms and shoes.`;
    }
    
    fullBodyParts.push({ text: fullBodyPrompt });
    generateImageFromParts(fullBodyParts, setModelFull, "3:4");
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthorized) return <AccessGate onAccessGranted={handleAccessGranted} />;

  if (isCheckingKey) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white/20 pb-20 relative">
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif">API Key Configuration</h3>
                <button onClick={() => setShowApiKeyModal(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Google Cloud Project</label>
                  <button
                    onClick={handleSelectKey}
                    className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors text-sm"
                  >
                    <span>Select Project via AI Studio</span>
                    <Sparkles className="w-4 h-4 text-white/40" />
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#1a1a1a] px-2 text-white/40">Or enter manually</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Manual API Key</label>
                  <input 
                    type="password" 
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <button
                  onClick={handleSaveManualKey}
                  className="w-full py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="pt-12 pb-8 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="font-serif text-5xl md:text-7xl font-light tracking-tight text-white mb-2">
              AI Outfit Studio
            </h1>
            <p className="text-white/40 font-sans text-sm tracking-widest uppercase">
              Shopping Mall Generator
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowApiKeyModal(true)}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title="API Key Settings"
            >
              <Settings className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>
      </header>

      {!hasApiKey ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left space-y-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-white/40 mt-1 shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-medium text-white">Access Required</h3>
                  <p className="text-sm text-white/40">
                    Please configure your API key to start generating images.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="w-full py-4 bg-white text-black rounded-full font-medium tracking-wide hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              Configure Access
            </button>
          </div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-6 md:px-12 mt-12">
          <section className="mb-20">
            <div className="flex flex-col items-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                <ImageUpload 
                  title="Upload Front Item"
                  subtitle="Required: Front view of clothing"
                  onImageSelect={handleFrontSelect} 
                  selectedImage={frontPreview}
                  onClear={() => { setFrontFile(null); setFrontPreview(null); resetStates(); }}
                />
                <ImageUpload 
                  title="Upload Back Item"
                  subtitle="Optional: Back view of clothing"
                  onImageSelect={handleBackSelect} 
                  selectedImage={backPreview}
                  onClear={() => { setBackFile(null); setBackPreview(null); resetStates(); }}
                />
                <ImageUpload 
                  title="Upload Background"
                  subtitle="Optional: For full body shot"
                  onImageSelect={handleBgSelect} 
                  selectedImage={bgPreview}
                  onClear={() => { setBgFile(null); setBgPreview(null); }}
                />
              </div>
              
              {frontFile && !cleanUpFront.loading && !cleanUpFront.image && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 flex flex-col items-center gap-6"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-full border border-white/10">
                      <button
                        onClick={() => setModelGender('female')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${modelGender === 'female' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                      >
                        Female Model
                      </button>
                      <button
                        onClick={() => setModelGender('male')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${modelGender === 'male' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                      >
                        Male Model
                      </button>
                      <button
                        onClick={() => setModelGender('unisex')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${modelGender === 'unisex' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                      >
                        Unisex Model
                      </button>
                    </div>

                    <div className="flex items-center gap-6 mt-2">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-white/60 ml-1">Fit</label>
                          <select
                            value={modelFit}
                            onChange={(e) => setModelFit(e.target.value as any)}
                            className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/30 cursor-pointer"
                          >
                            <option value="regular">Regular</option>
                            <option value="overfit">Overfit</option>
                            <option value="slim">Slim</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-white/60 ml-1">Style</label>
                          <select
                            value={modelStyle}
                            onChange={(e) => setModelStyle(e.target.value as any)}
                            className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/30 cursor-pointer"
                          >
                            <option value="Classic">Classic</option>
                            <option value="Casual">Casual</option>
                            <option value="Streetwear">Streetwear</option>
                            <option value="Business casual">Business casual</option>
                            <option value="Chic">Chic</option>
                            <option value="Preppy">Preppy</option>
                            <option value="Athleisure">Athleisure</option>
                          </select>
                        </div>
                      </div>

                      <div className="w-px h-10 bg-white/10 mx-2"></div>

                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={enableCoordShot} 
                            onChange={(e) => setEnableCoordShot(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white focus:ring-offset-black"
                          />
                          <span className="text-sm text-white/80">Coordination Shot</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={enableDetailShot} 
                            onChange={(e) => setEnableDetailShot(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white focus:ring-offset-black"
                          />
                          <span className="text-sm text-white/80">Detail Shot</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={generateAll}
                    className="group relative px-8 py-4 bg-white text-black rounded-full font-medium tracking-wide overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Generate All Assets
                    </span>
                    <div className="absolute inset-0 bg-gray-200 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  </button>
                </motion.div>
              )}
            </div>
          </section>

          {(cleanUpFront.loading || cleanUpFront.image || modelFront.loading || modelFront.image) && (
            <div className="space-y-16">
              <section>
                <h2 className="text-2xl font-serif mb-6 border-b border-white/10 pb-2">1. Original Items (Cleaned Up)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <GeneratedImage
                    title="Front Clean-up"
                    description="Wrinkle-free, pristine front view."
                    image={cleanUpFront.image}
                    loading={cleanUpFront.loading}
                    aspectRatio="square"
                    onDownload={cleanUpFront.image ? () => downloadImage(cleanUpFront.image!, 'cleanup-front.png') : undefined}
                    onRegenerate={regenerateCleanUpFront}
                  />
                  {(cleanUpBack.loading || cleanUpBack.image) && (
                    <GeneratedImage
                      title="Back Clean-up"
                      description="Wrinkle-free, pristine back view."
                      image={cleanUpBack.image}
                      loading={cleanUpBack.loading}
                      aspectRatio="square"
                      onDownload={cleanUpBack.image ? () => downloadImage(cleanUpBack.image!, 'cleanup-back.png') : undefined}
                      onRegenerate={regenerateCleanUpBack}
                    />
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-serif mb-6 border-b border-white/10 pb-2">2. Model Try-On Shots</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <GeneratedImage
                    title="Front View"
                    description="Korean model front shot."
                    image={modelFront.image}
                    loading={modelFront.loading}
                    aspectRatio="portrait"
                    onDownload={modelFront.image ? () => downloadImage(modelFront.image!, 'model-front.png') : undefined}
                    onRegenerate={regenerateModelFront}
                  />
                  <GeneratedImage
                    title="Side View"
                    description="Korean model side shot."
                    image={modelSide.image}
                    loading={modelSide.loading}
                    aspectRatio="portrait"
                    onDownload={modelSide.image ? () => downloadImage(modelSide.image!, 'model-side.png') : undefined}
                    onRegenerate={regenerateModelSide}
                  />
                  <GeneratedImage
                    title="Back View"
                    description="Korean model back shot."
                    image={modelBack.image}
                    loading={modelBack.loading}
                    aspectRatio="portrait"
                    onDownload={modelBack.image ? () => downloadImage(modelBack.image!, 'model-back.png') : undefined}
                    onRegenerate={regenerateModelBack}
                  />
                  <GeneratedImage
                    title="Full Body"
                    description="Korean model full body shot."
                    image={modelFull.image}
                    loading={modelFull.loading}
                    aspectRatio="portrait"
                    onDownload={modelFull.image ? () => downloadImage(modelFull.image!, 'model-full.png') : undefined}
                    onRegenerate={regenerateModelFull}
                  />
                </div>
              </section>

              {(enableCoordShot || coordShot.image || coordShot.loading || enableDetailShot || detailTexture.image || detailTexture.loading) && (
                <section>
                  <h2 className="text-2xl font-serif mb-6 border-b border-white/10 pb-2">3. Additional Assets</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {(enableCoordShot || coordShot.image || coordShot.loading) && (
                      <GeneratedImage
                        title="Coordination Shot"
                        description="Recommended outfit styling."
                        image={coordShot.image}
                        loading={coordShot.loading}
                        aspectRatio="square"
                        onDownload={coordShot.image ? () => downloadImage(coordShot.image!, 'coord-shot.png') : undefined}
                        onRegenerate={regenerateCoordShot}
                      />
                    )}
                    {(enableDetailShot || detailTexture.image || detailTexture.loading) && (
                      <GeneratedImage
                        title="Detail Shot"
                        description="Fabric texture and details."
                        image={detailTexture.image}
                        loading={detailTexture.loading}
                        aspectRatio="square"
                        onDownload={detailTexture.image ? () => downloadImage(detailTexture.image!, 'detail-texture.png') : undefined}
                        onRegenerate={regenerateDetailTexture}
                      />
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      )}
      {isAuthorized && hasApiKey && <Chatbot getAIClient={getAIClient} />}
    </div>
  );
}

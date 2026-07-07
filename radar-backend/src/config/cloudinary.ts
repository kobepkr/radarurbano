export const subirImagenCloudinary = async (base64: string): Promise<string | null> => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName) {
    console.log("⚠️ Cloudinary no configurado");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("file", `data:image/jpeg;base64,${base64}`);
    formData.append("upload_preset", "radar_urbano_preset");
    formData.append("api_key", apiKey);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    formData.append("timestamp", timestamp);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    const data: any = await response.json();
    if (data.secure_url) return data.secure_url;
    
    console.error("Cloudinary error:", data);
    return null;
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    return null;
  }
};

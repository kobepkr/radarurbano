import crypto from "crypto";

const FLOW_API_URL = "https://www.flow.cl/api";
const FLOW_SANDBOX_URL = "https://sandbox.flow.cl/api";

const getApiUrl = () => process.env.FLOW_SANDBOX === "true" ? FLOW_SANDBOX_URL : FLOW_API_URL;

const firmar = (params: Record<string, string>, secretKey: string): string => {
  const keys = Object.keys(params).sort();
  let toSign = "";
  for (const key of keys) {
    toSign += key + params[key];
  }
  return crypto.createHmac("sha256", secretKey).update(toSign).digest("hex");
};

export const crearOrdenPago = async (usuarioId: string, email: string) => {
  const apiKey = process.env.FLOW_API_KEY || "";
  const secretKey = process.env.FLOW_SECRET_KEY || "";
  const sandbox = process.env.FLOW_SANDBOX || "";
  console.log(`🔑 Flow API Key: ${apiKey.substring(0, 8)}... Sandbox: ${sandbox}`);
  
  if (!apiKey || !secretKey) {
    console.error("❌ Flow: API Key o Secret Key no configurados");
    return null;
  }
  const commerceOrder = `prem_${usuarioId.slice(-6)}_${Date.now().toString().slice(-6)}`;

  const params: Record<string, string> = {
    apiKey,
    commerceOrder,
    subject: "Radar Urbano Premium",
    currency: "CLP",
    amount: "4990",
    email,
    urlConfirmation: `${process.env.BACKEND_URL || "https://radarurbano-1.onrender.com"}/api/usuarios/flow-confirm`,
    urlReturn: `${process.env.BACKEND_URL || "https://radarurbano-1.onrender.com"}/api/usuarios/flow-return`,
  };

  params.s = firmar(params, secretKey);

  const formData = new URLSearchParams(params).toString();
  const apiUrl = getApiUrl();
  const fullUrl = `${apiUrl}/payment/create`;
  
  console.log(`🌐 Flow URL: ${fullUrl}`);
  
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  const data: any = await response.json();
  console.log(`📡 Flow response: ${JSON.stringify(data)}`);
  
  if (data.url && data.token) {
    return `${data.url}?token=${data.token}`;
  }
  
  console.error("Flow error:", data);
  return null;
};

export const verificarFirmaFlow = (params: Record<string, string>): boolean => {
  const secretKey = process.env.FLOW_SECRET_KEY || "";
  const receivedSign = params.s || "";
  const paramsCopy = { ...params };
  delete paramsCopy.s;
  const expectedSign = firmar(paramsCopy, secretKey);
  return receivedSign === expectedSign;
};

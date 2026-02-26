import { normalizeApiKeyInput, validateApiKeyInput } from "./auth-choice.api-key.js";
import {
  ensureApiKeyFromOptionEnvOrPrompt,
  normalizeTokenProviderInput,
} from "./auth-choice.apply-helpers.js";
import type { ApplyAuthChoiceParams, ApplyAuthChoiceResult } from "./auth-choice.apply.js";
import { applyAgentDefaultModelPrimary } from "./onboard-auth.config-shared.js";
import { setDeepSeekApiKey } from "./onboard-auth.credentials.js";
import { applyAuthProfileConfig } from "./onboard-auth.js";

const DEEPSEEK_DEFAULT_MODEL_REF = "deepseek/deepseek-chat";

export async function applyAuthChoiceDeepSeek(
  params: ApplyAuthChoiceParams,
): Promise<ApplyAuthChoiceResult | null> {
  if (params.authChoice !== "deepseek-api-key") {
    return null;
  }

  let nextConfig = params.config;

  const normalizedTokenProvider = normalizeTokenProviderInput(params.opts?.tokenProvider);

  await ensureApiKeyFromOptionEnvOrPrompt({
    token: params.opts?.token,
    provider: "deepseek",
    tokenProvider: normalizedTokenProvider,
    expectedProviders: ["deepseek"],
    envLabel: "DEEPSEEK_API_KEY",
    promptMessage: "Enter DeepSeek API key",
    setCredential: async (apiKey) => setDeepSeekApiKey(apiKey, params.agentDir),
    normalize: normalizeApiKeyInput,
    validate: validateApiKeyInput,
    prompter: params.prompter,
  });

  if (params.setDefaultModel) {
    nextConfig = applyAgentDefaultModelPrimary(nextConfig, DEEPSEEK_DEFAULT_MODEL_REF);
  }

  nextConfig = applyAuthProfileConfig(nextConfig, {
    profileId: "deepseek:default",
    provider: "deepseek",
    mode: "api_key",
  });

  return { config: nextConfig };
}

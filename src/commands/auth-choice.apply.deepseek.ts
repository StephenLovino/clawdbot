import { normalizeApiKeyInput, validateApiKeyInput } from "./auth-choice.api-key.js";
import {
  createAuthChoiceDefaultModelApplier,
  createAuthChoiceModelStateBridge,
  ensureApiKeyFromOptionEnvOrPrompt,
  normalizeTokenProviderInput,
} from "./auth-choice.apply-helpers.js";
import type { ApplyAuthChoiceParams, ApplyAuthChoiceResult } from "./auth-choice.apply.js";
import { applyDeepSeekConfig, applyDeepSeekProviderConfig } from "./onboard-auth.config-core.js";
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
  let agentModelOverride: string | undefined;
  const applyProviderDefaultModel = createAuthChoiceDefaultModelApplier(
    params,
    createAuthChoiceModelStateBridge({
      getConfig: () => nextConfig,
      setConfig: (config) => (nextConfig = config),
      getAgentModelOverride: () => agentModelOverride,
      setAgentModelOverride: (model) => (agentModelOverride = model),
    }),
  );

  const normalizedTokenProvider = normalizeTokenProviderInput(params.opts?.tokenProvider);

  await ensureApiKeyFromOptionEnvOrPrompt({
    token: params.opts?.token,
    provider: "deepseek",
    tokenProvider: normalizedTokenProvider,
    expectedProviders: ["deepseek"],
    envLabel: "DEEPSEEK_API_KEY",
    promptMessage: "Enter DeepSeek API key",
    setCredential: async (apiKey) => setDeepSeekApiKey(apiKey, params.agentDir),
    defaultModel: DEEPSEEK_DEFAULT_MODEL_REF,
    normalize: normalizeApiKeyInput,
    validate: validateApiKeyInput,
    prompter: params.prompter,
  });

  nextConfig = applyAuthProfileConfig(nextConfig, {
    profileId: "deepseek:default",
    provider: "deepseek",
    mode: "api_key",
  });

  await applyProviderDefaultModel({
    defaultModel: DEEPSEEK_DEFAULT_MODEL_REF,
    applyDefaultConfig: applyDeepSeekConfig,
    applyProviderConfig: applyDeepSeekProviderConfig,
    noteDefault: DEEPSEEK_DEFAULT_MODEL_REF,
  });

  return { config: nextConfig, agentModelOverride };
}

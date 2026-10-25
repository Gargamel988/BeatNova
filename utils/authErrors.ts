type TranslationFn = (key: string, fallback: string) => string;

export function getAuthErrorInfo(
  error: unknown,
  t: TranslationFn
): { title: string; description: string } {
  let errorTitle = t("auth.loginError", "Giriş Başarısız");
  let errorMessage = t("auth.loginErrorDefault", "İşlem sırasında bir hata oluştu");

  const errorMsg = (
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
      ? String((error as { message: unknown }).message)
      : ""
  ).toLowerCase();

  if (errorMsg) {
    if (
      errorMsg.includes("invalid login credentials") ||
      errorMsg.includes("invalid credentials")
    ) {
      errorMessage = t(
        "auth.loginErrorInvalidCredentials",
        "E-posta veya şifre hatalı. Lütfen tekrar deneyin."
      );
    } else if (
      errorMsg.includes("email not confirmed") ||
      errorMsg.includes("email not verified")
    ) {
      errorMessage = t(
        "auth.loginErrorEmailNotConfirmed",
        "Lütfen e-posta adresinizi doğrulayın."
      );
    } else if (
      errorMsg.includes("too many requests") ||
      errorMsg.includes("rate limit")
    ) {
      errorMessage = t(
        "auth.loginErrorTooManyRequests",
        "Çok fazla deneme yaptınız. Lütfen bir süre sonra tekrar deneyin."
      );
    } else if (errorMsg.includes("user not found")) {
      errorMessage = t(
        "auth.loginErrorUserNotFound",
        "Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı."
      );
    } else if (
      errorMsg.includes("user already registered") ||
      errorMsg.includes("already registered")
    ) {
      errorTitle = t("common.error", "Hata");
      errorMessage = t(
        "auth.registerErrorAlreadyExists",
        "Bu e-posta adresi ile kayıtlı bir kullanıcı zaten var."
      );
    } else if (
      errorMsg.includes("network") ||
      errorMsg.includes("connection")
    ) {
      errorMessage = t(
        "auth.loginErrorNetwork",
        "İnternet bağlantınızı kontrol edin."
      );
    } else {
      errorMessage = error instanceof Error ? error.message : errorMsg;
    }
  } else {
    const errorStatus =
      typeof error === "object" && error && "status" in error
        ? Number((error as { status: unknown }).status)
        : undefined;

    if (errorStatus === 400) {
      errorMessage = t(
        "auth.loginErrorInvalidRequest",
        "Geçersiz istek. Lütfen bilgilerinizi kontrol edin."
      );
    } else if (errorStatus === 401) {
      errorMessage = t("auth.loginErrorUnauthorized", "E-posta veya şifre hatalı.");
    } else if (errorStatus === 429) {
      errorMessage = t(
        "auth.loginErrorTooManyRequests",
        "Çok fazla deneme yaptınız. Lütfen bir süre sonra tekrar deneyin."
      );
    } else if (errorStatus !== undefined && errorStatus >= 500) {
      errorMessage = t(
        "auth.loginErrorServer",
        "Sunucu hatası. Lütfen daha sonra tekrar deneyin."
      );
    }
  }

  return { title: errorTitle, description: errorMessage };
}

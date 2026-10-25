import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
} from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Pressable,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  LucideProps,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { useTranslation } from "react-i18next";

export type ConfirmDialogVariant =
  | "default"
  | "destructive"
  | "warning"
  | "info"
  | "success";

export type ConfirmOptions = {
  title: string;
  message?: string;
  variant?: ConfirmDialogVariant;
  icon?: React.ComponentType<LucideProps>;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
};

export type AlertOptions = {
  title: string;
  message?: string;
  variant?: ConfirmDialogVariant;
  icon?: React.ComponentType<LucideProps>;
  buttonText?: string;
  onClose?: () => void;
};

export type ActionSheetItem = {
  label: string;
  icon?: React.ComponentType<LucideProps>;
  destructive?: boolean;
  onPress: () => void | Promise<void>;
};

export type ActionSheetOptions = {
  title: string;
  message?: string;
  actions: ActionSheetItem[];
  cancelText?: string;
};

type DialogState =
  | { type: "confirm"; options: ConfirmOptions; resolve: (val: boolean) => void }
  | { type: "alert"; options: AlertOptions; resolve: () => void }
  | { type: "actionSheet"; options: ActionSheetOptions; resolve: () => void }
  | null;

type ConfirmDialogContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
  actionSheet: (options: ActionSheetOptions) => Promise<void>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

const VARIANT_ICONS: Record<
  ConfirmDialogVariant,
  React.ComponentType<LucideProps>
> = {
  destructive: AlertTriangle,
  warning: AlertCircle,
  info: Info,
  success: CheckCircle,
  default: Info,
};

const VARIANT_COLORS: Record<ConfirmDialogVariant, string> = {
  destructive: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  success: "#10B981",
  default: "#8B5CF6",
};

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [loading, setLoading] = useState(false);

  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const primary = useColor("primary");
  const primaryForeground = useColor("primaryForeground");

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    return new Promise((resolve) => {
      setDialogState({ type: "confirm", options, resolve });
    });
  }, []);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return new Promise((resolve) => {
      setDialogState({ type: "alert", options, resolve });
    });
  }, []);

  const actionSheet = useCallback(
    (options: ActionSheetOptions): Promise<void> => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return new Promise((resolve) => {
        setDialogState({ type: "actionSheet", options, resolve });
      });
    },
    []
  );

  const closeDialog = useCallback(() => {
    if (!dialogState) return;
    if (dialogState.type === "confirm") {
      dialogState.options.onCancel?.();
      dialogState.resolve(false);
    } else {
      dialogState.resolve();
    }
    setDialogState(null);
    setLoading(false);
  }, [dialogState]);

  const handleConfirm = useCallback(async () => {
    if (!dialogState || dialogState.type !== "confirm") return;
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await dialogState.options.onConfirm?.();
      dialogState.resolve(true);
      setDialogState(null);
    } finally {
      setLoading(false);
    }
  }, [dialogState]);

  const handleActionPress = useCallback(
    async (item: ActionSheetItem) => {
      if (!dialogState || dialogState.type !== "actionSheet") return;
      Haptics.impactAsync(
        item.destructive
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Light
      );
      setDialogState(null);
      await item.onPress();
    },
    [dialogState]
  );

  return (
    <ConfirmDialogContext.Provider value={{ confirm, alert, actionSheet }}>
      {children}

      <Modal
        visible={dialogState !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeDialog}
      >
        <Pressable
          onPress={closeDialog}
          accessibilityRole="alert"
          accessibilityViewIsModal
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.68)",
            justifyContent:
              dialogState?.type === "actionSheet" ? "flex-end" : "center",
            alignItems: "center",
            paddingHorizontal: dialogState?.type === "actionSheet" ? 0 : wp(6),
            paddingBottom: dialogState?.type === "actionSheet" ? hp(3) : 0,
          }}
        >
          <TouchableWithoutFeedback>
            <View
              style={{
                width: dialogState?.type === "actionSheet" ? wp(94) : "100%",
                maxWidth: 420,
                backgroundColor: cardBg,
                borderRadius: radius(24),
                borderWidth: 1,
                borderColor,
                padding: wp(5.5),
                gap: hp(2),
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.35,
                shadowRadius: 18,
                elevation: 10,
              }}
            >
              {/* === CONFIRM & ALERT MODAL === */}
              {(dialogState?.type === "confirm" ||
                dialogState?.type === "alert") && (
                <>
                  {/* Icon Header */}
                  {(() => {
                    const variant =
                      dialogState.options.variant ||
                      (dialogState.type === "confirm" ? "default" : "info");
                    const IconComponent =
                      dialogState.options.icon || VARIANT_ICONS[variant];
                    const color = VARIANT_COLORS[variant];

                    return (
                      <View style={{ alignItems: "center", marginTop: hp(0.5) }}>
                        <View
                          style={{
                            width: wp(14),
                            height: wp(14),
                            borderRadius: radius(99),
                            backgroundColor: color + "20",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1.5,
                            borderColor: color + "40",
                          }}
                        >
                          <Icon
                            name={IconComponent}
                            size={28}
                            color={color}
                          />
                        </View>
                      </View>
                    );
                  })()}

                  {/* Title & Message */}
                  <View style={{ alignItems: "center", gap: hp(0.8) }}>
                    <Text
                      style={{
                        color: textPrimary,
                        fontSize: fontSize(18),
                        fontWeight: "800",
                        textAlign: "center",
                      }}
                    >
                      {dialogState.options.title}
                    </Text>
                    {dialogState.options.message ? (
                      <Text
                        style={{
                          color: textSecondary,
                          fontSize: fontSize(13.5),
                          lineHeight: fontSize(19),
                          textAlign: "center",
                          paddingHorizontal: wp(2),
                        }}
                      >
                        {dialogState.options.message}
                      </Text>
                    ) : null}
                  </View>

                  {/* Buttons */}
                  {dialogState.type === "confirm" ? (
                    <View
                      style={{
                        flexDirection: "row",
                        gap: wp(3),
                        marginTop: hp(0.5),
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={closeDialog}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel={
                          dialogState.options.cancelText ||
                          t("common.cancel", "İptal")
                        }
                        style={{
                          flex: 1,
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          borderRadius: radius(14),
                          paddingVertical: hp(1.4),
                          minHeight: 46,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          borderColor,
                        }}
                      >
                        <Text
                          style={{
                            color: textPrimary,
                            fontSize: fontSize(14),
                            fontWeight: "700",
                          }}
                        >
                          {dialogState.options.cancelText ||
                            t("common.cancel", "İptal")}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleConfirm}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel={
                          dialogState.options.confirmText ||
                          t("common.confirm", "Onayla")
                        }
                        style={{
                          flex: 1,
                          backgroundColor:
                            dialogState.options.variant === "destructive"
                              ? "#EF4444"
                              : primary,
                          borderRadius: radius(14),
                          paddingVertical: hp(1.4),
                          minHeight: 46,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: fontSize(14),
                            fontWeight: "800",
                          }}
                        >
                          {dialogState.options.confirmText ||
                            t("common.confirm", "Onayla")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={closeDialog}
                      accessibilityRole="button"
                      accessibilityLabel={
                        dialogState.options.buttonText ||
                        t("common.ok", "Tamam")
                      }
                      style={{
                        backgroundColor: primary,
                        borderRadius: radius(14),
                        paddingVertical: hp(1.4),
                        minHeight: 46,
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: hp(0.5),
                      }}
                    >
                      <Text
                        style={{
                          color: primaryForeground || "#FFFFFF",
                          fontSize: fontSize(14),
                          fontWeight: "800",
                        }}
                      >
                        {dialogState.options.buttonText ||
                          t("common.ok", "Tamam")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* === ACTION SHEET MODAL === */}
              {dialogState?.type === "actionSheet" && (
                <>
                  <View style={{ gap: hp(0.4), marginBottom: hp(0.5) }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: textPrimary,
                        fontSize: fontSize(17),
                        fontWeight: "800",
                        textAlign: "center",
                      }}
                    >
                      {dialogState.options.title}
                    </Text>
                    {dialogState.options.message ? (
                      <Text
                        style={{
                          color: textSecondary,
                          fontSize: fontSize(12.5),
                          textAlign: "center",
                        }}
                      >
                        {dialogState.options.message}
                      </Text>
                    ) : null}
                  </View>

                  <ScrollView
                    bounces={false}
                    contentContainerStyle={{ gap: hp(1) }}
                    style={{ maxHeight: hp(40) }}
                  >
                    {dialogState.options.actions.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        onPress={() => handleActionPress(item)}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: item.destructive
                            ? "rgba(239, 68, 68, 0.12)"
                            : "rgba(255, 255, 255, 0.05)",
                          paddingHorizontal: wp(4),
                          paddingVertical: hp(1.5),
                          borderRadius: radius(14),
                          gap: wp(3),
                          borderWidth: 1,
                          borderColor: item.destructive
                            ? "rgba(239, 68, 68, 0.3)"
                            : borderColor,
                        }}
                      >
                        {item.icon ? (
                          <Icon
                            name={item.icon}
                            size={20}
                            color={item.destructive ? "#EF4444" : textPrimary}
                          />
                        ) : null}
                        <Text
                          style={{
                            color: item.destructive ? "#EF4444" : textPrimary,
                            fontSize: fontSize(14.5),
                            fontWeight: item.destructive ? "800" : "600",
                            flex: 1,
                          }}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={closeDialog}
                    accessibilityRole="button"
                    accessibilityLabel={
                      dialogState.options.cancelText ||
                      t("common.cancel", "İptal")
                    }
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      borderRadius: radius(14),
                      paddingVertical: hp(1.4),
                      minHeight: 46,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor,
                      marginTop: hp(0.5),
                    }}
                  >
                    <Text
                      style={{
                        color: textSecondary,
                        fontSize: fontSize(14),
                        fontWeight: "700",
                      }}
                    >
                      {dialogState.options.cancelText ||
                        t("common.cancel", "İptal")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </Pressable>
      </Modal>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error(
      "useConfirmDialog must be used within a ConfirmDialogProvider"
    );
  }
  return context;
}

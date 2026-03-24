import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { X, Plus, Minus } from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useColor } from "@/hooks/useColor";
import { useAudioPlayerContext } from "@/providers/player-context";

interface SleepTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({ visible, onClose }) => {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette, mode } = useThemeModeContext();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const cardBg = useColor("card");
  const primary = useColor("primary");

  const {
    sleepTimerRemaining,
    setSleepTimer,
    isSleepTimerActive,
  } = useAudioPlayerContext();

  const [selectedMinutes, setSelectedMinutes] = useState(30);

  const formatTimerDigital = useCallback((seconds: number | null) => {
    if (seconds === null || seconds <= 0) return "00:00:00";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours < 10 ? "0" : ""}${hours}:${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }, []);

  const presets = [15, 30, 45, 60, 90, 120, 180, 240];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose} 
      >
        <View style={[
          styles.modalContainer, 
          { 
            backgroundColor: cardBg, 
            borderTopLeftRadius: radius(30), 
            borderTopRightRadius: radius(30),
            borderTopWidth: 2,
            borderColor: palette.primary + "60", // Daha da belirgin bir sınır
            elevation: 10, // Android için gölge
          }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textPrimary, fontSize: fontSize(20) }]}>Uyku Zamanlayıcısı</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.timerDisplayContainer}>
            <Text style={[styles.timerTime, { color: primary, fontSize: fontSize(54) }]}>
              {isSleepTimerActive ? formatTimerDigital(sleepTimerRemaining) : `${selectedMinutes}:00`}
            </Text>
            <Text style={[styles.timerStatus, { color: textSecondary, fontSize: fontSize(14) }]}>
              {isSleepTimerActive ? "Zamanlayıcı çalışıyor" : "Süreyi ayarla"}
            </Text>
          </View>

          {!isSleepTimerActive && (
            <View style={styles.controlsContainer}>
              <TouchableOpacity 
                style={[styles.btnCircle, { backgroundColor: palette.primary + "15" }]}
                onPress={() => setSelectedMinutes(prev => Math.max(1, prev - 5))}
              >
                <Minus color={primary} size={24} />
              </TouchableOpacity>
              
              <View style={styles.selectedMinsContainer}>
                <Text style={[styles.selectedMins, { color: textPrimary, fontSize: fontSize(42) }]}>{selectedMinutes}</Text>
                <Text style={[styles.minLabel, { color: textSecondary, fontSize: fontSize(14) }]}>Dakika</Text>
              </View>

              <TouchableOpacity 
                style={[styles.btnCircle, { backgroundColor: palette.primary + "15" }]}
                onPress={() => setSelectedMinutes(prev => Math.min(480, prev + 5))}
              >
                <Plus color={primary} size={24} />
              </TouchableOpacity>
            </View>
          )}

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.presetsWrapper}
            style={{ maxHeight: hp(8) }}
          >
            {presets.map(min => (
              <TouchableOpacity
                key={min}
                style={[
                  styles.presetBtn, 
                  { backgroundColor: selectedMinutes === min ? primary : palette.primary + "10" }
                ]}
                onPress={() => setSelectedMinutes(min)}
                disabled={isSleepTimerActive}
              >
                <Text style={[styles.presetText, { color: selectedMinutes === min ? "white" : textPrimary, fontSize: fontSize(14) }]}>
                  {min}dk
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            {isSleepTimerActive ? (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: palette.red }]}
                onPress={() => {
                  setSleepTimer(null);
                  onClose();
                }}
              >
                <Text style={styles.actionBtnText}>Zamanlayıcıyı Durdur</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: primary }]}
                onPress={() => {
                  setSleepTimer(selectedMinutes);
                  onClose();
                }}
              >
                <Text style={styles.actionBtnText}>Zamanlayıcıyı Başlat</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)', // Daha belirgin bir karartma
    justifyContent: 'flex-end',
  },
  modalContainer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', // Hafif bir üst çizgi
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontWeight: '800',
  },
  timerDisplayContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerTime: {
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  timerStatus: {
    marginTop: 5,
    fontWeight: '500',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginBottom: 35,
  },
  btnCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMinsContainer: {
    alignItems: 'center',
  },
  selectedMins: {
    fontWeight: '800',
    lineHeight: 48,
  },
  minLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  presetsWrapper: {
    paddingHorizontal: 4,
    gap: 12,
  },
  presetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    minWidth: 70,
    alignItems: 'center',
  },
  presetText: {
    fontWeight: '700',
  },
  footer: {
    marginTop: 35,
  },
  actionBtn: {
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
});

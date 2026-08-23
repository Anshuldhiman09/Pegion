import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTheme, getNeumorphicStyles } from '../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  visible: boolean;
  value: Date | null;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  maximumDate?: Date;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const DatePickerModal: React.FC<Props> = ({
  visible,
  value,
  onClose,
  onConfirm,
  maximumDate = new Date(),
}) => {
  const { colors, isDark } = useTheme();
  const neu = getNeumorphicStyles(isDark);

  const initialDate = useMemo(() => value || new Date(2000, 0, 1), [value]);

  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());

  const [viewMode, setViewMode] = useState<'calendar' | 'year' | 'month'>('calendar');

  useEffect(() => {
    if (visible) {
      const d = value || new Date(2000, 0, 1);
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth());
      setSelectedDay(d.getDate());
      setViewMode('calendar');
    }
  }, [value, visible]);

  const maxYear = maximumDate.getFullYear();
  const minYear = maxYear - 90;
  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i),
    [maxYear, minYear],
  );

  const daysInMonth = useMemo(
    () => new Date(selectedYear, selectedMonth + 1, 0).getDate(),
    [selectedYear, selectedMonth],
  );

  const firstDayOffset = useMemo(
    () => new Date(selectedYear, selectedMonth, 1).getDay(),
    [selectedYear, selectedMonth],
  );

  const prevMonth = useCallback(() => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  }, [selectedMonth]);

  const nextMonth = useCallback(() => {
    if (selectedMonth === 11) {
      if (selectedYear < maxYear) {
        setSelectedMonth(0);
        setSelectedYear(y => y + 1);
      }
    } else {
      setSelectedMonth(m => m + 1);
    }
  }, [selectedMonth, selectedYear, maxYear]);

  const handleConfirm = useCallback(() => {
    const validDay = Math.min(selectedDay, daysInMonth);
    const result = new Date(selectedYear, selectedMonth, validDay);
    onConfirm(result);
    onClose();
  }, [selectedDay, daysInMonth, selectedYear, selectedMonth, onConfirm, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.container,
            neu.cardElevated({ radius: 28, depth: 'high' }),
            {
              backgroundColor: isDark
                ? 'rgba(20, 24, 30, 0.97)'
                : 'rgba(255, 255, 255, 0.98)',
              borderColor: colors.border,
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          {/* Header Preview */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons
                name="calendar"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.title, { color: colors.text }]}>
                Date of Birth
              </Text>
            </View>

            <View
              style={[
                styles.dateBadge,
                neu.badgeEmbossed(colors.primary),
              ]}
            >
              <Text style={styles.dateBadgeText}>
                {`${Math.min(selectedDay, daysInMonth)} ${MONTH_NAMES[selectedMonth].substring(0, 3)}, ${selectedYear}`}
              </Text>
            </View>
          </View>

          {/* Navigation Bar (Month, Year buttons & Prev/Next arrows) */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={[
                styles.arrowBtn,
                neu.circleButton(36, { depth: 'low' }),
                { backgroundColor: colors.surfaceSubtle },
              ]}
              onPress={prevMonth}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.jumpButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.navTextBtn,
                  viewMode === 'month' && { backgroundColor: colors.primary },
                ]}
                onPress={() =>
                  setViewMode(m => (m === 'month' ? 'calendar' : 'month'))
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.navText,
                    { color: viewMode === 'month' ? '#fff' : colors.text },
                  ]}
                >
                  {MONTH_NAMES[selectedMonth]}
                </Text>
                <Ionicons
                  name={viewMode === 'month' ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={viewMode === 'month' ? '#fff' : colors.textMuted}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navTextBtn,
                  viewMode === 'year' && { backgroundColor: colors.primary },
                ]}
                onPress={() =>
                  setViewMode(m => (m === 'year' ? 'calendar' : 'year'))
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.navText,
                    { color: viewMode === 'year' ? '#fff' : colors.text },
                  ]}
                >
                  {selectedYear}
                </Text>
                <Ionicons
                  name={viewMode === 'year' ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={viewMode === 'year' ? '#fff' : colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.arrowBtn,
                neu.circleButton(36, { depth: 'low' }),
                { backgroundColor: colors.surfaceSubtle },
              ]}
              onPress={nextMonth}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* VIEW MODE: MONTH SELECTOR */}
          {viewMode === 'month' && (
            <View style={styles.gridSelectorContainer}>
              <View style={styles.monthsGrid}>
                {MONTH_NAMES.map((mName, idx) => {
                  const isSelected = selectedMonth === idx;
                  return (
                    <TouchableOpacity
                      key={mName}
                      style={[
                        styles.monthCell,
                        isSelected
                          ? [styles.selectedCell, { backgroundColor: colors.primary }]
                          : [neu.fieldSunken({ radius: 12 }), { backgroundColor: colors.surfaceSubtle }],
                      ]}
                      onPress={() => {
                        setSelectedMonth(idx);
                        setViewMode('calendar');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.monthCellText,
                          { color: isSelected ? '#ffffff' : colors.text },
                        ]}
                      >
                        {mName.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* VIEW MODE: YEAR SELECTOR */}
          {viewMode === 'year' && (
            <View style={styles.gridSelectorContainer}>
              <ScrollView
                style={styles.yearScroll}
                contentContainerStyle={styles.yearsGrid}
                showsVerticalScrollIndicator={false}
              >
                {years.map(y => {
                  const isSelected = selectedYear === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.yearCell,
                        isSelected
                          ? [styles.selectedCell, { backgroundColor: colors.primary }]
                          : [neu.fieldSunken({ radius: 12 }), { backgroundColor: colors.surfaceSubtle }],
                      ]}
                      onPress={() => {
                        setSelectedYear(y);
                        setViewMode('calendar');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.yearCellText,
                          { color: isSelected ? '#ffffff' : colors.text },
                        ]}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* VIEW MODE: CALENDAR GRID */}
          {viewMode === 'calendar' && (
            <View style={styles.calendarContainer}>
              {/* Day Names Header */}
              <View style={styles.weekDaysRow}>
                {WEEK_DAYS.map((wd, i) => (
                  <View key={i} style={styles.weekDayCell}>
                    <Text style={[styles.weekDayText, { color: colors.textMuted }]}>
                      {wd}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {/* Empty Offset Cells */}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCell} />
                ))}

                {/* Actual Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const isSelected = selectedDay === d;

                  return (
                    <TouchableOpacity
                      key={`day-${d}`}
                      style={[
                        styles.dayCell,
                        isSelected && [
                          styles.selectedDayCell,
                          neu.circleButton(36, { depth: 'high' }),
                          { backgroundColor: colors.primary },
                        ],
                      ]}
                      onPress={() => setSelectedDay(d)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          { color: isSelected ? '#ffffff' : colors.text },
                          isSelected && styles.selectedDayText,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                neu.circleButton(44, { depth: 'low' }),
                { backgroundColor: colors.surfaceSubtle },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                neu.circleButton(44, { depth: 'high' }),
                { backgroundColor: colors.primary },
              ]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.confirmBtnText}>Set Date</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default DatePickerModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jumpButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  navText: {
    fontSize: 14,
    fontWeight: '700',
  },
  calendarContainer: {
    minHeight: 230,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  selectedDayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignSelf: 'center',
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  gridSelectorContainer: {
    height: 230,
    justifyContent: 'center',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthCell: {
    width: '30%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  monthCellText: {
    fontSize: 13,
    fontWeight: '700',
  },
  yearScroll: {
    flex: 1,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  yearCell: {
    width: '29%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  yearCellText: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedCell: {
    borderRadius: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

